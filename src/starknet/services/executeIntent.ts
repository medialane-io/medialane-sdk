import type { Call, TypedData } from "starknet";
import type { StarknetVenueSigner } from "../index.js";
import type { MedialaneClient } from "../client.js";
import type { ApiIntentCreated } from "../../types/api.js";

export interface ReceiptProvider {
  getTransactionReceipt(txHash: string): Promise<unknown>;
}

export async function confirmIntentBestEffort(
  client: MedialaneClient,
  intentId: string,
  txHash: string,
): Promise<void> {
  await client.api.confirmIntent(intentId, txHash).catch(() => {});
}

const RECEIPT_RETRY_DELAYS_MS = [0, 3000, 5000, 7000, 10000];

interface ReceiptStatusShape {
  execution_status?: string;
  finality_status?: string;
  status?: string;
}

export async function assertTransactionSucceeded(
  provider: ReceiptProvider,
  txHash: string,
  retryDelaysMs: readonly number[] = RECEIPT_RETRY_DELAYS_MS,
): Promise<void> {
  for (let attempt = 0; attempt < retryDelaysMs.length; attempt++) {
    const delay = retryDelaysMs[attempt];
    if (delay) await new Promise<void>((r) => setTimeout(r, delay));
    try {
      const receipt = (await provider.getTransactionReceipt(txHash)) as ReceiptStatusShape;
      const status = receipt.execution_status ?? receipt.status;
      if (status === "REVERTED" || status === "REJECTED") {
        throw new Error("Transaction was submitted but reverted onchain. Please check your balance and try again.");
      }
      if (status) return;
    } catch (err) {
      if (err instanceof Error && err.message.includes("reverted onchain")) throw err;
    }
  }
  throw new Error("Verification timed out. Check your account for the transaction status.");
}

export interface ExecuteIntentOpts {
  confirm?: boolean;
}

export async function executeIntent(
  provider: ReceiptProvider,
  signer: StarknetVenueSigner,
  client: MedialaneClient,
  intent: ApiIntentCreated,
  opts: ExecuteIntentOpts = {},
): Promise<{ txHash: string }> {
  let calls: Call[];
  if (intent.requiresSignature) {
    const signature = await signer.signTypedData(intent.typedData as TypedData);
    const signed = await client.api.submitIntentSignature(intent.id, signature);
    calls = signed.data.calls as Call[];
  } else {
    calls = intent.calls as Call[];
  }

  const { txHash } = await signer.execute(calls);
  await assertTransactionSucceeded(provider, txHash);
  if (opts.confirm !== false) {
    await confirmIntentBestEffort(client, intent.id, txHash);
  }
  return { txHash };
}

export async function executeIntents(
  provider: ReceiptProvider,
  signer: StarknetVenueSigner,
  client: MedialaneClient,
  intents: ApiIntentCreated[],
  opts: ExecuteIntentOpts = {},
): Promise<{ txHash: string }> {
  if (intents.some((i) => i.requiresSignature)) {
    throw new Error("Expected prebuilt intents (requiresSignature=false)");
  }
  const calls = intents.flatMap((i) => (i as Extract<ApiIntentCreated, { requiresSignature: false }>).calls) as Call[];
  const { txHash } = await signer.execute(calls);
  await assertTransactionSucceeded(provider, txHash);
  if (opts.confirm !== false) {
    await Promise.all(intents.map((i) => confirmIntentBestEffort(client, i.id, txHash)));
  }
  return { txHash };
}
