import { test, expect } from "bun:test";
import type { StarknetVenueSigner } from "../index.js";
import type { ApiIntentCreated } from "../../types/api.js";
import { executeIntent, executeIntents, confirmIntentBestEffort, assertTransactionSucceeded, syncTransactionBestEffort, type ReceiptProvider } from "./executeIntent.js";

function fakeProvider(receiptImpl: (txHash: string) => Promise<unknown> = async () => ({ execution_status: "SUCCEEDED" })): ReceiptProvider {
  return { getTransactionReceipt: receiptImpl };
}

function fakeSigner(overrides: Partial<StarknetVenueSigner> = {}): StarknetVenueSigner {
  return {
    address: "0xwallet",
    signTypedData: async () => ["0xr", "0xs"],
    execute: async () => ({ txHash: "0xtx" }),
    ...overrides,
  };
}

function fakeClient(overrides: Record<string, unknown> = {}) {
  return {
    api: {
      confirmIntent: async () => ({}),
      syncTransaction: async () => ({ data: { applied: 1, pending: false } }),
      submitIntentSignature: async () => ({ data: { calls: [{ contractAddress: "0xc", entrypoint: "e", calldata: [] }] } }),
      ...overrides,
    },
  } as never;
}

const PREBUILT: ApiIntentCreated = {
  id: "intent-1",
  expiresAt: "2026-01-01T00:00:00Z",
  requiresSignature: false,
  calls: [{ contractAddress: "0xc", entrypoint: "e", calldata: [] }],
};

const SIGNED: ApiIntentCreated = {
  id: "intent-2",
  expiresAt: "2026-01-01T00:00:00Z",
  requiresSignature: true,
  typedData: { domain: {}, message: {}, primaryType: "x", types: {} } as never,
};

test("executeIntent executes a prebuilt intent's calls directly and confirms by default", async () => {
  let confirmedWith: [string, string] | null = null;
  const client = fakeClient({ confirmIntent: async (id: string, txHash: string) => { confirmedWith = [id, txHash]; } });
  const result = await executeIntent(fakeProvider(), fakeSigner(), client, PREBUILT);
  expect(result.txHash).toBe("0xtx");
  expect(confirmedWith).toEqual(["intent-1", "0xtx"]);
});

test("executeIntent skips confirmation when confirm:false", async () => {
  let confirmCalled = false;
  const client = fakeClient({ confirmIntent: async () => { confirmCalled = true; } });
  await executeIntent(fakeProvider(), fakeSigner(), client, PREBUILT, { confirm: false });
  expect(confirmCalled).toBe(false);
});

test("executeIntent never throws when confirmation fails (best-effort)", async () => {
  const client = fakeClient({ confirmIntent: async () => { throw new Error("network error"); } });
  const result = await executeIntent(fakeProvider(), fakeSigner(), client, PREBUILT);
  expect(result.txHash).toBe("0xtx");
});

test("executeIntent signs typed data, submits, then executes the populated calls for a signature-required intent", async () => {
  const signed: unknown[] = [];
  const signer = fakeSigner({ signTypedData: async (td) => { signed.push(td); return ["0xr", "0xs"]; } });
  const client = fakeClient();
  const result = await executeIntent(fakeProvider(), signer, client, SIGNED);
  expect(signed.length).toBe(1);
  expect(result.txHash).toBe("0xtx");
});

test("confirmIntentBestEffort swallows errors", async () => {
  const client = fakeClient({ confirmIntent: async () => { throw new Error("boom"); } });
  await expect(confirmIntentBestEffort(client, "id", "0xtx")).resolves.toBeUndefined();
});

test("executeIntents bundles multiple prebuilt intents' calls into one multicall", async () => {
  const calls: unknown[] = [];
  const signer = fakeSigner({ execute: async (c) => { calls.push(...c); return { txHash: "0xbundled" }; } });
  const confirmed: string[] = [];
  const client = fakeClient({ confirmIntent: async (id: string) => { confirmed.push(id); } });

  const second: ApiIntentCreated = { ...PREBUILT, id: "intent-3", calls: [{ contractAddress: "0xd", entrypoint: "f", calldata: [] }] };
  const result = await executeIntents(fakeProvider(), signer, client, [PREBUILT, second]);

  expect(calls.length).toBe(2);
  expect(result.txHash).toBe("0xbundled");
  expect(confirmed.sort()).toEqual(["intent-1", "intent-3"]);
});

test("executeIntents throws if any intent requires a signature", async () => {
  await expect(executeIntents(fakeProvider(), fakeSigner(), fakeClient(), [PREBUILT, SIGNED])).rejects.toThrow(
    "Expected prebuilt intents (requiresSignature=false)",
  );
});

test("executeIntent throws when the submitted transaction reverted onchain", async () => {
  const provider = fakeProvider(async () => ({ execution_status: "REVERTED" }));
  await expect(executeIntent(provider, fakeSigner(), fakeClient(), PREBUILT)).rejects.toThrow("reverted onchain");
});

test("executeIntents throws when the bundled transaction reverted onchain", async () => {
  const provider = fakeProvider(async () => ({ execution_status: "REVERTED" }));
  await expect(executeIntents(provider, fakeSigner(), fakeClient(), [PREBUILT])).rejects.toThrow("reverted onchain");
});

test("assertTransactionSucceeded retries past a not-yet-indexed receipt and then succeeds", async () => {
  let calls = 0;
  const provider = fakeProvider(async () => {
    calls += 1;
    if (calls < 3) throw new Error("Transaction hash not found");
    return { execution_status: "SUCCEEDED" };
  });
  await expect(assertTransactionSucceeded(provider, "0xtx", [0, 0, 0, 0])).resolves.toBeUndefined();
  expect(calls).toBe(3);
});

test("assertTransactionSucceeded times out with a distinguishable error if the receipt never resolves", async () => {
  const provider = fakeProvider(async () => { throw new Error("Transaction hash not found"); });
  await expect(assertTransactionSucceeded(provider, "0xtx", [0, 0])).rejects.toThrow("Verification timed out");
});

test("executeIntent syncs the transaction before it returns", async () => {
  const order: string[] = [];
  const client = fakeClient({
    syncTransaction: async (txHash: string) => { order.push(`sync ${txHash}`); return { data: { applied: 1, pending: false } }; },
  });
  const signer = fakeSigner({ execute: async () => { order.push("execute"); return { txHash: "0xtx" }; } });
  await executeIntent(fakeProvider(), signer, client, PREBUILT, { confirm: false });
  order.push("returned");
  expect(order).toEqual(["execute", "sync 0xtx", "returned"]);
});

test("executeIntents syncs the bundled transaction once", async () => {
  const synced: string[] = [];
  const client = fakeClient({ syncTransaction: async (txHash: string) => { synced.push(txHash); return { data: { applied: 2, pending: false } }; } });
  const second: ApiIntentCreated = { ...PREBUILT, id: "intent-3" };
  await executeIntents(fakeProvider(), fakeSigner(), client, [PREBUILT, second]);
  expect(synced).toEqual(["0xtx"]);
});

test("a failing sync never fails the transaction", async () => {
  const client = fakeClient({ syncTransaction: async () => { throw new Error("Transaction not found yet"); } });
  const result = await executeIntent(fakeProvider(), fakeSigner(), client, PREBUILT);
  expect(result.txHash).toBe("0xtx");
});

test("a reverted transaction is never synced", async () => {
  let synced = false;
  const client = fakeClient({ syncTransaction: async () => { synced = true; } });
  const provider = fakeProvider(async () => ({ execution_status: "REVERTED" }));
  await expect(executeIntent(provider, fakeSigner(), client, PREBUILT)).rejects.toThrow("reverted onchain");
  expect(synced).toBe(false);
});

test("syncTransactionBestEffort stops waiting at its timeout", async () => {
  const client = fakeClient({ syncTransaction: () => new Promise(() => {}) });
  const started = Date.now();
  await expect(syncTransactionBestEffort(client, "0xtx", 20)).resolves.toBeUndefined();
  expect(Date.now() - started).toBeLessThan(1000);
});
