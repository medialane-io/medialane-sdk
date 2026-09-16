import { Account, stark, typedData as starknetTypedData, type ProviderInterface } from "starknet";
import { getCoordinates } from "../chains.js";
import { signWithPrivateKey } from "../starknet/passkey-wallet/crypto.js";
import { ownerConstructorCalldata } from "../starknet/business-provisioning/account.js";
import { requestSiwsToken } from "../starknet/siws/client.js";
import type { ExecutedTransaction, SealedOwner } from "./types.js";

export type DeploymentStep = "creating-passkey" | "deploying" | "signing-in";

export interface DeploymentResult {
  sealed: SealedOwner;
  siwsToken: string;
}

async function describeFailure(res: Response, fallback: string): Promise<never> {
  const body = (await res.json().catch(() => null)) as { error?: string } | null;
  throw new Error(body?.error || fallback);
}

export async function deploySponsored(input: {
  proxyUrl: string;
  provider: ProviderInterface;
  ownerAddress: string;
  ownerPubKey: string;
  privateKeyHex: string;
  salt?: string;
  fetchImpl?: typeof fetch;
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
    body: JSON.stringify({ ownerAddress: input.ownerAddress, typedData, signature, deployment, calls }),
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

export interface DeploymentDeps {
  store: { load(): SealedOwner | null; save(sealed: SealedOwner): void; notifyChange(): void };
  passkey: {
    createOwnerKey(): Promise<{ sealed: SealedOwner; privateKeyHex: string }>;
    unlockOwnerKey(sealed: SealedOwner): Promise<string>;
  };
  provider: () => ProviderInterface;
  backendUrl: string;
  deployProxyUrl?: string;
  fetchImpl?: typeof fetch;
  deploySponsoredImpl?: typeof deploySponsored;
  deploySelfFundedImpl?: typeof deploySelfFunded;
  requestSiwsTokenImpl?: typeof requestSiwsToken;
}

export async function completeDeployment(
  deps: DeploymentDeps,
  onStep: (step: DeploymentStep) => void,
  options: { forceNew?: boolean } = {},
): Promise<DeploymentResult> {
  let sealed = options.forceNew ? null : deps.store.load();
  let privateKeyHex: string;

  if (!sealed) {
    onStep("creating-passkey");
    const created = await deps.passkey.createOwnerKey();
    sealed = created.sealed;
    privateKeyHex = created.privateKeyHex;
    deps.store.save(sealed);
  } else {
    privateKeyHex = await deps.passkey.unlockOwnerKey(sealed);
  }

  onStep("deploying");
  const wallet = { ownerAddress: sealed.address, ownerPubKey: sealed.ownerPubKey, privateKeyHex };

  const sponsored = deps.deploySponsoredImpl ?? deploySponsored;
  const selfFunded = deps.deploySelfFundedImpl ?? deploySelfFunded;

  if (deps.deployProxyUrl) {
    try {
      await sponsored({
        proxyUrl: deps.deployProxyUrl,
        provider: deps.provider(),
        fetchImpl: deps.fetchImpl,
        ...wallet,
      });
    } catch (sponsoredErr) {
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

  onStep("signing-in");
  const address = sealed.address;
  const siwsToken = await (deps.requestSiwsTokenImpl ?? requestSiwsToken)({
    backendUrl: deps.backendUrl,
    walletAddress: address,
    signer: {
      signMessage: async (td) =>
        signWithPrivateKey(privateKeyHex, starknetTypedData.getMessageHash(td as never, address)),
    },
  });

  deps.store.notifyChange();
  return { sealed, siwsToken };
}
