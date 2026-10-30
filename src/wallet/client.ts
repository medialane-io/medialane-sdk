import type { FetchLike } from "../utils/fetch.js";
import { typedData as starknetTypedData, type Call, type ProviderInterface, type TypedData } from "starknet";
import { signWithPrivateKey } from "../starknet/passkey-wallet/crypto.js";
import {
  getEscape,
  getEscapeSecurityPeriod,
  getGuardians,
  getOwners,
  type EscapeInfo,
  type GuardianInfo,
} from "../starknet/media-wallet/guardian.js";
import { computeOwnerGuid } from "../starknet/media-wallet/owners.js";
import { normalizeWalletAddress } from "./addresses.js";
import { ApiClient } from "../api/client.js";
import type { CreateWalletManageIntentParams } from "../types/api.js";
import {
  completeDeployment,
  createDeploymentCoordinator,
  type DeploymentDeps,
  type DeploymentResult,
  type DeploymentStep,
} from "./deployment.js";
import type { OwnerStore } from "./store.js";
import type { PasskeyOwner } from "./passkey.js";
import type { ExecutedTransaction, SealedOwner, WalletExecutor } from "./types.js";

export interface DeviceEntry {
  guid: string;
  type: GuardianInfo["type"];
  isThisDevice: boolean;
}

export function describeDevices(owners: GuardianInfo[], thisDevicePubkey: string): DeviceEntry[] {
  const mine = computeOwnerGuid(thisDevicePubkey);
  return owners.map((owner) => ({
    guid: owner.guid,
    type: owner.type,
    isThisDevice: BigInt(owner.guid) === BigInt(mine),
  }));
}

export function canRemoveDevice(devices: DeviceEntry[], guid: string): boolean {
  if (devices.length <= 1) return false;
  return devices.some((device) => BigInt(device.guid) === BigInt(guid));
}

export interface MediaWalletConfig {
  store: OwnerStore;
  passkey: PasskeyOwner;
  executor: WalletExecutor;
  provider: () => ProviderInterface;
  unlockTtlMs?: number;
  backendUrl?: string;
  deployProxyUrl?: string;
  fetchImpl?: FetchLike;
  walletIntents?: (params: CreateWalletManageIntentParams) => Promise<{ id: string; calls: Call[] }>;
}

export interface MediaWallet {
  store: OwnerStore;
  passkey: PasskeyOwner;
  lock(address: string): void;
  signerFor(sealed: SealedOwner): {
    address: string;
    signTypedData(data: TypedData): Promise<string[]>;
    execute(calls: Call[], opts?: { intentIds?: string[] }): Promise<{ txHash: string }>;
  };
  run(sealed: SealedOwner, calls: Call[], userAddress?: string, intentIds?: string[]): Promise<ExecutedTransaction>;
  getGuardians(address: string): Promise<GuardianInfo[]>;
  getEscape(address: string): Promise<EscapeInfo>;
  getEscapeSecurityPeriod(address: string): Promise<number>;
  setFirstGuardian(sealed: SealedOwner, guardianPubkey: string): Promise<string>;
  triggerEscapeOwner(guardianSealed: SealedOwner, targetAddress: string, newOwnerPubkey: string): Promise<string>;
  completeEscapeOwner(guardianSealed: SealedOwner, targetAddress: string): Promise<string>;
  cancelEscape(sealed: SealedOwner): Promise<string>;
  getOwners(address: string): Promise<GuardianInfo[]>;
  isOwnerOf(accountAddress: string, devicePubkey: string): Promise<boolean>;
  addDevice(sealed: SealedOwner, devicePubkey: string): Promise<string>;
  removeDevice(sealed: SealedOwner, ownerGuid: string): Promise<string>;
  completeDeployment(
    onStep: (step: DeploymentStep) => void,
    options?: { replace?: boolean },
  ): Promise<DeploymentResult>;
  isDeploying(): boolean;
}

export function createMediaWallet(config: MediaWalletConfig): MediaWallet {
  const ttl = config.unlockTtlMs ?? 20_000;
  const deployments = createDeploymentCoordinator((onStep, options) => {
    const deps: DeploymentDeps = {
      store: config.store,
      passkey: config.passkey,
      provider: config.provider,
      deployProxyUrl: config.deployProxyUrl,
      fetchImpl: config.fetchImpl,
    };
    return completeDeployment(deps, onStep, options);
  });
  const unlockCache = new Map<string, { promise: Promise<string>; timer: ReturnType<typeof setTimeout> }>();

  const lock = (address: string): void => {
    const entry = unlockCache.get(address);
    if (!entry) return;
    clearTimeout(entry.timer);
    unlockCache.delete(address);
  };

  const unlockOnce = (sealed: SealedOwner): Promise<string> => {
    const existing = unlockCache.get(sealed.address);
    if (existing) return existing.promise;
    const promise = config.passkey.unlockOwnerKey(sealed).catch((err) => {
      lock(sealed.address);
      throw err;
    });
    const timer = setTimeout(() => lock(sealed.address), ttl);
    unlockCache.set(sealed.address, { promise, timer });
    return promise;
  };

  const run = async (sealed: SealedOwner, calls: Call[], userAddress?: string, intentIds?: string[]): Promise<ExecutedTransaction> => {
    const privateKeyHex = await unlockOnce(sealed);
    return config.executor.execute({
      userAddress: userAddress ?? sealed.address,
      privateKeyHex,
      calls,
      intentIds,
    });
  };

  const walletIntents = config.walletIntents ?? (async (params: CreateWalletManageIntentParams) => {
    if (!config.backendUrl) throw new Error("This wallet has no backend url configured");
    const created = await new ApiClient({ baseUrl: config.backendUrl }).intents.create("wallet-manage", params);
    return created as { id: string; calls: Call[] };
  });

  const manage = async (sealed: SealedOwner, params: CreateWalletManageIntentParams): Promise<string> => {
    const intent = await walletIntents(params);
    const { transactionHash } = await run(sealed, intent.calls, params.owner, [intent.id]);
    return transactionHash;
  };

  return {
    store: config.store,
    passkey: config.passkey,
    lock,

    signerFor(sealed) {
      return {
        address: sealed.address,
        signTypedData: async (data) => {
          const privateKeyHex = await unlockOnce(sealed);
          return signWithPrivateKey(privateKeyHex, starknetTypedData.getMessageHash(data, sealed.address));
        },
        execute: async (calls, opts) => {
          const { transactionHash } = await run(sealed, calls, undefined, opts?.intentIds);
          return { txHash: transactionHash };
        },
      };
    },

    run,

    getGuardians: (address) => getGuardians(config.provider(), address),
    getEscape: (address) => getEscape(config.provider(), address),
    getEscapeSecurityPeriod: (address) => getEscapeSecurityPeriod(config.provider(), address),
    getOwners: (address) => getOwners(config.provider(), address),

    async isOwnerOf(accountAddress, devicePubkey) {
      const owners = await getOwners(config.provider(), accountAddress);
      const guid = BigInt(computeOwnerGuid(devicePubkey));
      return owners.some((owner) => BigInt(owner.guid) === guid);
    },

    setFirstGuardian: (sealed, guardianPubkey) => manage(sealed, { owner: sealed.address, action: "set_first_guardian", pubkey: guardianPubkey }),

    triggerEscapeOwner: (guardianSealed, targetAddress, newOwnerPubkey) =>
      manage(guardianSealed, { owner: normalizeWalletAddress(targetAddress), action: "trigger_escape", newOwnerPubkey }),

    completeEscapeOwner: (guardianSealed, targetAddress) =>
      manage(guardianSealed, { owner: normalizeWalletAddress(targetAddress), action: "complete_escape" }),

    cancelEscape: (sealed) => manage(sealed, { owner: sealed.address, action: "cancel_escape" }),

    addDevice: (sealed, devicePubkey) => manage(sealed, { owner: sealed.address, action: "add_owner", pubkey: devicePubkey }),

    removeDevice: (sealed, ownerGuid) => manage(sealed, { owner: sealed.address, action: "remove_owner", ownerGuid }),

    completeDeployment: (onStep, options) => deployments.run(onStep, options),
    isDeploying: () => deployments.isDeploying(),
  };
}
