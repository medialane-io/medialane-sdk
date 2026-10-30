import type { FetchLike } from "../utils/fetch.js";
import { Account, stark, type ProviderInterface } from "starknet";
import { getCoordinates } from "../chains.js";
import { ownerConstructorCalldata } from "../starknet/media-wallet/account.js";
import { isDeployed } from "./addresses.js";
import type { ExecutedTransaction, SealedOwner } from "./types.js";

export type DeploymentStep = "creating-passkey" | "deploying";

export interface DeploymentResult {
  sealed: SealedOwner;
}

export class SponsoredDeployError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = "SponsoredDeployError";
  }
}

export const isAccountRefusal = (err: unknown): boolean =>
  err instanceof SponsoredDeployError && (err.status === 401 || err.status === 409);

async function describeFailure(res: Response, fallback: string): Promise<never> {
  const body = (await res.json().catch(() => null)) as { error?: string; code?: string } | null;
  throw new SponsoredDeployError(body?.error || fallback, res.status, body?.code);
}

export async function deploySponsored(input: {
  proxyUrl: string;
  provider: ProviderInterface;
  ownerAddress: string;
  ownerPubKey: string;
  privateKeyHex: string;
  salt?: string;
  replace?: boolean;
  fetchImpl?: FetchLike;
}): Promise<ExecutedTransaction> {
  const doFetch = input.fetchImpl ?? fetch;
  const base = input.proxyUrl.replace(/\/$/, "");

  const buildRes = await doFetch(`${base}/build`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ownerPubkey: input.ownerPubKey,
      ownerAddress: input.ownerAddress,
      salt: input.salt ?? "0x0",
    }),
  });
  if (!buildRes.ok) {
    await describeFailure(buildRes, "We couldn't prepare your wallet deployment. Please try again.");
  }
  const { typedData, deployment, calls } = (await buildRes.json()) as {
    typedData: object;
    deployment: object;
    calls: object[];
  };

  const account = new Account({
    provider: input.provider,
    address: input.ownerAddress,
    signer: input.privateKeyHex,
    cairoVersion: "1",
  });
  const signature = stark.signatureToHexArray(await account.signMessage(typedData as never));

  const executeRes = await doFetch(`${base}/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ownerAddress: input.ownerAddress, typedData, signature, deployment, calls, replace: input.replace === true }),
  });
  if (!executeRes.ok) {
    await describeFailure(executeRes, "We couldn't complete your wallet deployment. Please try again.");
  }
  const { transactionHash } = (await executeRes.json()) as { transactionHash: string };
  return { transactionHash };
}

export async function deploySelfFunded(input: {
  provider: ProviderInterface;
  ownerAddress: string;
  ownerPubKey: string;
  privateKeyHex: string;
}): Promise<ExecutedTransaction> {
  const classHash = getCoordinates("STARKNET").mediaWalletClassHash;
  if (!classHash) throw new Error("Media Wallet class hash is not configured");
  const account = new Account({
    provider: input.provider,
    address: input.ownerAddress,
    signer: input.privateKeyHex,
    cairoVersion: "1",
  });
  const { transaction_hash } = await account.deployAccount({
    classHash,
    constructorCalldata: ownerConstructorCalldata(input.ownerPubKey),
    addressSalt: 0,
    contractAddress: input.ownerAddress,
  });
  return { transactionHash: transaction_hash };
}

export async function waitUntilDeployed(
  provider: ProviderInterface,
  address: string,
  timeoutMs = 90_000,
  sleep: (ms: number) => Promise<void> = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let wait = 1_000;
  for (;;) {
    if (await isDeployed(provider, address).catch(() => false)) return;
    if (Date.now() >= deadline) {
      throw new Error(
        "Your wallet was submitted but has not appeared on Starknet yet. Please try again in a moment.",
      );
    }
    await sleep(wait);
    wait = Math.min(Math.round(wait * 1.5), 5_000);
  }
}

export interface DeploymentDeps {
  store: {
    load(): SealedOwner | null;
    save(sealed: SealedOwner): void;
    loadPending(): SealedOwner | null;
    savePending(sealed: SealedOwner): void;
    clearPending(): void;
    notifyChange(): void;
  };
  passkey: {
    createOwnerKey(): Promise<{ sealed: SealedOwner; privateKeyHex: string }>;
    unlockOwnerKey(sealed: SealedOwner): Promise<string>;
  };
  provider: () => ProviderInterface;
  deployProxyUrl?: string;
  fetchImpl?: FetchLike;
  deploySponsoredImpl?: typeof deploySponsored;
  deploySelfFundedImpl?: typeof deploySelfFunded;
  waitUntilDeployedImpl?: typeof waitUntilDeployed;
  isDeployedImpl?: typeof isDeployed;
}

async function deployWallet(
  deps: DeploymentDeps,
  wallet: { ownerAddress: string; ownerPubKey: string; privateKeyHex: string },
  replace: boolean,
): Promise<void> {
  const sponsored = deps.deploySponsoredImpl ?? deploySponsored;
  const selfFunded = deps.deploySelfFundedImpl ?? deploySelfFunded;

  if (deps.deployProxyUrl) {
    try {
      await sponsored({
        proxyUrl: deps.deployProxyUrl,
        provider: deps.provider(),
        fetchImpl: deps.fetchImpl,
        replace,
        ...wallet,
      });
    } catch (sponsoredErr) {
      if (replace || isAccountRefusal(sponsoredErr)) throw sponsoredErr;
      try {
        await selfFunded({ provider: deps.provider(), ...wallet });
      } catch (selfFundedErr) {
        const sponsored = sponsoredErr instanceof Error ? sponsoredErr.message : String(sponsoredErr);
        const selfFunded = selfFundedErr instanceof Error ? selfFundedErr.message : String(selfFundedErr);
        throw new Error(`Sponsored deploy failed: ${sponsored}. Self-funded fallback failed: ${selfFunded}`);
      }
    }
  } else {
    await selfFunded({ provider: deps.provider(), ...wallet });
  }

  await (deps.waitUntilDeployedImpl ?? waitUntilDeployed)(deps.provider(), wallet.ownerAddress);
}

async function unfinishedReplacement(deps: DeploymentDeps): Promise<SealedOwner | null> {
  const pending = deps.store.loadPending();
  if (!pending) return null;
  const deployed = await (deps.isDeployedImpl ?? isDeployed)(deps.provider(), pending.address).catch(() => true);
  return deployed ? null : pending;
}

export async function completeDeployment(
  deps: DeploymentDeps,
  onStep: (step: DeploymentStep) => void,
  options: { replace?: boolean } = {},
): Promise<DeploymentResult> {
  const pending = await unfinishedReplacement(deps);
  const replacing = options.replace === true || pending !== null;
  let sealed: SealedOwner | null = replacing ? pending : deps.store.load();
  if (!replacing && sealed && (await (deps.isDeployedImpl ?? isDeployed)(deps.provider(), sealed.address).catch(() => false))) {
    sealed = null;
  }
  let privateKeyHex: string;

  if (!sealed) {
    onStep("creating-passkey");
    const created = await deps.passkey.createOwnerKey();
    sealed = created.sealed;
    privateKeyHex = created.privateKeyHex;
    if (replacing) deps.store.savePending(sealed);
    else deps.store.save(sealed);
  } else {
    privateKeyHex = await deps.passkey.unlockOwnerKey(sealed);
  }

  onStep("deploying");
  await deployWallet(deps, { ownerAddress: sealed.address, ownerPubKey: sealed.ownerPubKey, privateKeyHex }, replacing);

  if (replacing) {
    deps.store.save(sealed);
    deps.store.clearPending();
  }
  deps.store.notifyChange();
  return { sealed };
}

export interface DeploymentCoordinator {
  run(onStep: (step: DeploymentStep) => void, options?: { replace?: boolean }): Promise<DeploymentResult>;
  isDeploying(): boolean;
}

export function createDeploymentCoordinator(
  execute: (onStep: (step: DeploymentStep) => void, options: { replace?: boolean }) => Promise<DeploymentResult>,
): DeploymentCoordinator {
  let inFlight: Promise<DeploymentResult> | null = null;
  let currentStep: DeploymentStep | null = null;
  const listeners = new Set<(step: DeploymentStep) => void>();

  return {
    run(onStep, options = {}) {
      if (inFlight) {
        if (options.replace) {
          return Promise.reject(new Error("A wallet setup is already in progress."));
        }
        if (currentStep) onStep(currentStep);
        listeners.add(onStep);
        return inFlight.finally(() => listeners.delete(onStep));
      }
      listeners.add(onStep);
      let started: Promise<DeploymentResult>;
      try {
        started = execute((step) => {
          currentStep = step;
          for (const listener of listeners) listener(step);
        }, options);
      } catch (err) {
        listeners.clear();
        return Promise.reject(err);
      }
      const run = started.finally(() => {
        inFlight = null;
        currentStep = null;
        listeners.clear();
      });
      inFlight = run;
      return run;
    },
    isDeploying: () => inFlight !== null,
  };
}
