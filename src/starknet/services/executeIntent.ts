import { UserFacingError } from "../../errors.js";
import { MedialaneApiError } from "../../api/client.js";
import type { Call, TypedData } from "starknet";
import type { StarknetVenueSigner } from "../signer.js";
import type { IntentsApi } from "../../api/domains/intents.js";
import type { ApiIntentCreated } from "../../types/api.js";
import type { ReceiptLike } from "./receipts.js";

export interface ReceiptProvider {
  getTransactionReceipt(txHash: string): Promise<unknown>;
}

export interface IntentClient {
  api: { intents: Pick<IntentsApi, "submitSignature" | "confirm" | "syncTransaction"> };
  provider: ReceiptProvider;
}

export async function confirmIntentBestEffort(
  client: IntentClient,
  intentId: string,
  txHash: string,
): Promise<void> {
  await client.api.intents.confirm(intentId, txHash).catch(() => {});
}

const SYNC_TIMEOUT_MS = 20_000;
const SYNC_RETRY_MS = 2000;

function readableLater(err: unknown): boolean {
  return err instanceof MedialaneApiError && err.status === 404;
}

export async function syncTransactionBestEffort(
  client: IntentClient,
  txHash: string,
  timeoutMs = SYNC_TIMEOUT_MS,
  retryMs = SYNC_RETRY_MS,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<void>((resolve) => {
    timer = setTimeout(() => resolve(), timeoutMs);
  });
  const sync = (async () => {
    while (!stopped) {
      const again = await client.api.intents.syncTransaction(txHash).then(
        (res) => res?.pending === true,
        readableLater,
      );
      if (!again || Date.now() + retryMs >= deadline) return;
      await new Promise<void>((resolve) => setTimeout(resolve, retryMs));
    }
  })();
  try {
    await Promise.race([sync, timeout]);
  } finally {
    stopped = true;
    if (timer) clearTimeout(timer);
  }
}

const RECEIPT_RETRY_DELAYS_MS = [0, 3000, 5000, 7000, 10000];

interface ReceiptStatusShape extends ReceiptLike {
  execution_status?: string;
  finality_status?: string;
  status?: string;
}

export async function assertTransactionSucceeded(
  provider: ReceiptProvider,
  txHash: string,
  retryDelaysMs: readonly number[] = RECEIPT_RETRY_DELAYS_MS,
): Promise<ReceiptLike> {
  for (let attempt = 0; attempt < retryDelaysMs.length; attempt++) {
    const delay = retryDelaysMs[attempt];
    if (delay) await new Promise<void>((r) => setTimeout(r, delay));
    try {
      const receipt = (await provider.getTransactionReceipt(txHash)) as ReceiptStatusShape;
      const status = receipt.execution_status ?? receipt.status;
      if (status === "REVERTED" || status === "REJECTED") {
        throw new UserFacingError("Transaction was submitted but reverted onchain. Please check your balance and try again.");
      }
      if (status) return receipt;
    } catch (err) {
      if (err instanceof Error && err.message.includes("reverted onchain")) throw err;
    }
  }
  throw new UserFacingError("Verification timed out. Check your account for the transaction status.");
}

export interface ExecuteIntentOpts {
  confirm?: boolean;
}

export async function executeIntent(
  signer: StarknetVenueSigner,
  client: IntentClient,
  intent: ApiIntentCreated,
  opts: ExecuteIntentOpts = {},
): Promise<{ txHash: string; receipt: ReceiptLike }> {
  let calls: Call[];
  if (intent.requiresSignature) {
    const signature = await signer.signTypedData(intent.typedData as TypedData);
    const signed = await client.api.intents.submitSignature(intent.id, signature);
    calls = signed.calls as Call[];
  } else {
    calls = intent.calls as Call[];
  }

  const { txHash } = await signer.execute(calls, { intentIds: [intent.id] });
  const receipt = await assertTransactionSucceeded(client.provider, txHash);
  await Promise.all([
    syncTransactionBestEffort(client, txHash),
    opts.confirm !== false ? confirmIntentBestEffort(client, intent.id, txHash) : undefined,
  ]);
  return { txHash, receipt };
}

export async function executeIntents(
  signer: StarknetVenueSigner,
  client: IntentClient,
  intents: ApiIntentCreated[],
  opts: ExecuteIntentOpts = {},
): Promise<{ txHash: string; receipt: ReceiptLike }> {
  if (intents.some((i) => i.requiresSignature)) {
    throw new Error("Expected prebuilt intents (requiresSignature=false)");
  }
  const calls = intents.flatMap((i) => (i as Extract<ApiIntentCreated, { requiresSignature: false }>).calls) as Call[];
  const { txHash } = await signer.execute(calls, { intentIds: intents.map((i) => i.id) });
  const receipt = await assertTransactionSucceeded(client.provider, txHash);
  await Promise.all([
    syncTransactionBestEffort(client, txHash),
    ...(opts.confirm !== false ? intents.map((i) => confirmIntentBestEffort(client, i.id, txHash)) : []),
  ]);
  return { txHash, receipt };
}
