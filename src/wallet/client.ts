import { typedData as starknetTypedData, type Call, type ProviderInterface, type TypedData } from "starknet";
import { signWithPrivateKey } from "../starknet/passkey-wallet/crypto.js";
import {
  buildCancelEscapeCall,
  buildCompleteEscapeOwnerCall,
  buildSetFirstGuardianCall,
  buildTriggerEscapeOwnerCall,
  getEscape,
  getEscapeSecurityPeriod,
  getGuardians,
  getOwners,
  type EscapeInfo,
  type GuardianInfo,
} from "../starknet/business-provisioning/guardian.js";
import {
  buildAddOwnerCall,
  buildRemoveOwnerByGuidCall,
  computeOwnerGuid,
} from "../starknet/business-provisioning/handoff.js";
import { normalizeWalletAddress } from "./addresses.js";
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
}

export interface MediaWallet {
  store: OwnerStore;
  passkey: PasskeyOwner;
  lock(address: string): void;
  signerFor(sealed: SealedOwner): {
    address: string;
    signTypedData(data: TypedData): Promise<string[]>;
    execute(calls: Call[]): Promise<{ txHash: string }>;
  };
  run(sealed: SealedOwner, calls: Call[], userAddress?: string): Promise<ExecutedTransaction>;
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
}

export function createMediaWallet(config: MediaWalletConfig): MediaWallet {
  const ttl = config.unlockTtlMs ?? 20_000;
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

  const run = async (sealed: SealedOwner, calls: Call[], userAddress?: string): Promise<ExecutedTransaction> => {
    const privateKeyHex = await unlockOnce(sealed);
    return config.executor.execute({
      userAddress: userAddress ?? sealed.address,
      privateKeyHex,
      calls,
    });
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
        execute: async (calls) => {
          const { transactionHash } = await run(sealed, calls);
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

    async setFirstGuardian(sealed, guardianPubkey) {
      const { transactionHash } = await run(sealed, [buildSetFirstGuardianCall(sealed.address, guardianPubkey)]);
      return transactionHash;
    },

    async triggerEscapeOwner(guardianSealed, targetAddress, newOwnerPubkey) {
      const { transactionHash } = await run(
        guardianSealed,
        [buildTriggerEscapeOwnerCall(targetAddress, newOwnerPubkey)],
        normalizeWalletAddress(targetAddress),
      );
      return transactionHash;
    },

    async completeEscapeOwner(guardianSealed, targetAddress) {
      const { transactionHash } = await run(
        guardianSealed,
        [buildCompleteEscapeOwnerCall(targetAddress)],
        normalizeWalletAddress(targetAddress),
      );
      return transactionHash;
    },

    async cancelEscape(sealed) {
      const { transactionHash } = await run(sealed, [buildCancelEscapeCall(sealed.address)]);
      return transactionHash;
    },

    async addDevice(sealed, devicePubkey) {
      const { transactionHash } = await run(sealed, [buildAddOwnerCall(sealed.address, devicePubkey)]);
      return transactionHash;
    },

    async removeDevice(sealed, ownerGuid) {
      const { transactionHash } = await run(sealed, [buildRemoveOwnerByGuidCall(sealed.address, ownerGuid)]);
      return transactionHash;
    },
  };
}
