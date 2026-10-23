import { test, expect } from "bun:test";
import type { StarknetVenueSigner } from "../index.js";
import type { ApiIntentCreated } from "../../types/api.js";
import { MedialaneApiError } from "../../api/client.js";
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

function fakeClient(overrides: { intents?: Record<string, unknown> } = {}, provider: ReceiptProvider = fakeProvider()) {
  return {
    provider,
    api: {
      intents: {
        confirm: async () => ({}),
        syncTransaction: async () => ({ applied: 1, pending: false }),
        submitSignature: async () => ({ calls: [{ contractAddress: "0xc", entrypoint: "e", calldata: [] }] }),
        ...overrides.intents,
      },
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
  let confirmedWith = null as [string, string] | null;
  const client = fakeClient({ intents: { confirm: async (id: string, txHash: string) => { confirmedWith = [id, txHash]; } } });
  const result = await executeIntent(fakeSigner(), client, PREBUILT);
  expect(result.txHash).toBe("0xtx");
  expect(confirmedWith).toEqual(["intent-1", "0xtx"]);
});

test("executeIntent skips confirmation when confirm:false", async () => {
  let confirmCalled = false;
  const client = fakeClient({ intents: { confirm: async () => { confirmCalled = true; } } });
  await executeIntent(fakeSigner(), client, PREBUILT, { confirm: false });
  expect(confirmCalled).toBe(false);
});

test("executeIntent never throws when confirmation fails (best-effort)", async () => {
  const client = fakeClient({ intents: { confirm: async () => { throw new Error("network error"); } } });
  const result = await executeIntent(fakeSigner(), client, PREBUILT);
  expect(result.txHash).toBe("0xtx");
});

test("executeIntent signs typed data, submits, then executes the populated calls for a signature-required intent", async () => {
  const signed: unknown[] = [];
  const signer = fakeSigner({ signTypedData: async (td) => { signed.push(td); return ["0xr", "0xs"]; } });
  const client = fakeClient();
  const result = await executeIntent(signer, client, SIGNED);
  expect(signed.length).toBe(1);
  expect(result.txHash).toBe("0xtx");
});

test("confirmIntentBestEffort swallows errors", async () => {
  const client = fakeClient({ intents: { confirm: async () => { throw new Error("boom"); } } });
  await expect(confirmIntentBestEffort(client, "id", "0xtx")).resolves.toBeUndefined();
});

test("executeIntents bundles multiple prebuilt intents' calls into one multicall", async () => {
  const calls: unknown[] = [];
  const signer = fakeSigner({ execute: async (c) => { calls.push(...c); return { txHash: "0xbundled" }; } });
  const confirmed: string[] = [];
  const client = fakeClient({ intents: { confirm: async (id: string) => { confirmed.push(id); } } });

  const second: ApiIntentCreated = { ...PREBUILT, id: "intent-3", calls: [{ contractAddress: "0xd", entrypoint: "f", calldata: [] }] };
  const result = await executeIntents(signer, client, [PREBUILT, second]);

  expect(calls.length).toBe(2);
  expect(result.txHash).toBe("0xbundled");
  expect(confirmed.sort()).toEqual(["intent-1", "intent-3"]);
});

test("executeIntents throws if any intent requires a signature", async () => {
  await expect(executeIntents(fakeSigner(), fakeClient(), [PREBUILT, SIGNED])).rejects.toThrow(
    "Expected prebuilt intents (requiresSignature=false)",
  );
});

test("executeIntent throws when the submitted transaction reverted onchain", async () => {
  const provider = fakeProvider(async () => ({ execution_status: "REVERTED" }));
  await expect(executeIntent(fakeSigner(), fakeClient({}, provider), PREBUILT)).rejects.toThrow("reverted onchain");
});

test("executeIntents throws when the bundled transaction reverted onchain", async () => {
  const provider = fakeProvider(async () => ({ execution_status: "REVERTED" }));
  await expect(executeIntents(fakeSigner(), fakeClient({}, provider), [PREBUILT])).rejects.toThrow("reverted onchain");
});

test("assertTransactionSucceeded retries past a not-yet-indexed receipt and then succeeds", async () => {
  let calls = 0 as number;
  const provider = fakeProvider(async () => {
    calls += 1;
    if (calls < 3) throw new Error("Transaction hash not found");
    return { execution_status: "SUCCEEDED" };
  });
  await expect(assertTransactionSucceeded(provider, "0xtx", [0, 0, 0, 0]) as Promise<unknown>).resolves.toEqual({ execution_status: "SUCCEEDED" });
  expect(calls).toBe(3);
});

test("assertTransactionSucceeded times out with a distinguishable error if the receipt never resolves", async () => {
  const provider = fakeProvider(async () => { throw new Error("Transaction hash not found"); });
  await expect(assertTransactionSucceeded(provider, "0xtx", [0, 0])).rejects.toThrow("Verification timed out");
});

test("executeIntent syncs the transaction before it returns", async () => {
  const order: string[] = [];
  const client = fakeClient({ intents: { syncTransaction: async (txHash: string) => { order.push(`sync ${txHash}`); return { applied: 1, pending: false }; } } });
  const signer = fakeSigner({ execute: async () => { order.push("execute"); return { txHash: "0xtx" }; } });
  await executeIntent(signer, client, PREBUILT, { confirm: false });
  order.push("returned");
  expect(order).toEqual(["execute", "sync 0xtx", "returned"]);
});

test("executeIntents syncs the bundled transaction once", async () => {
  const synced: string[] = [];
  const client = fakeClient({ intents: { syncTransaction: async (txHash: string) => { synced.push(txHash); return { applied: 2, pending: false }; } } });
  const second: ApiIntentCreated = { ...PREBUILT, id: "intent-3" };
  await executeIntents(fakeSigner(), client, [PREBUILT, second]);
  expect(synced).toEqual(["0xtx"]);
});

test("a failing sync never fails the transaction", async () => {
  const client = fakeClient({ intents: { syncTransaction: async () => { throw new Error("Transaction not found yet"); } } });
  const result = await executeIntent(fakeSigner(), client, PREBUILT);
  expect(result.txHash).toBe("0xtx");
});

test("a reverted transaction is never synced", async () => {
  let synced = false;
  const provider = fakeProvider(async () => ({ execution_status: "REVERTED" }));
  const client = fakeClient({ intents: { syncTransaction: async () => { synced = true; } } }, provider);
  await expect(executeIntent(fakeSigner(), client, PREBUILT)).rejects.toThrow("reverted onchain");
  expect(synced).toBe(false);
});

test("syncTransactionBestEffort stops waiting at its timeout", async () => {
  const client = fakeClient({ intents: { syncTransaction: () => new Promise(() => {}) } });
  const started = Date.now();
  await expect(syncTransactionBestEffort(client, "0xtx", 20)).resolves.toBeUndefined();
  expect(Date.now() - started).toBeLessThan(1000);
});

test("syncTransactionBestEffort asks again while the transaction is pending or not found yet", async () => {
  const answers: Array<() => Promise<unknown>> = [
    async () => { throw new MedialaneApiError(404, "Transaction not found yet"); },
    async () => ({ applied: 0, pending: true }),
    async () => ({ applied: 1, pending: false }),
  ];
  let calls = 0;
  const client = fakeClient({ intents: { syncTransaction: () => answers[calls++]!() } });
  await syncTransactionBestEffort(client, "0xtx", 1000, 1);
  expect(calls).toBe(3);
});

test("syncTransactionBestEffort does not ask again after a server error", async () => {
  let calls = 0;
  const client = fakeClient({ intents: { syncTransaction: async () => { calls++; throw new MedialaneApiError(500, "boom"); } } });
  await syncTransactionBestEffort(client, "0xtx", 1000, 1);
  expect(calls).toBe(1);
});

test("syncTransactionBestEffort stops asking at its timeout", async () => {
  let calls = 0;
  const client = fakeClient({ intents: { syncTransaction: async () => { calls++; return { applied: 0, pending: true }; } } });
  await syncTransactionBestEffort(client, "0xtx", 50, 20);
  const seen = calls;
  await new Promise((r) => setTimeout(r, 80));
  expect(seen).toBeLessThanOrEqual(3);
  expect(calls).toBe(seen);
});

test("executeIntent returns the receipt it verified", async () => {
  const receipt = { execution_status: "SUCCEEDED", events: [{ from_address: "0xc", keys: ["0x1"], data: [] }] };
  const result = await executeIntent(fakeSigner(), fakeClient({}, fakeProvider(async () => receipt)), PREBUILT);
  expect(result.receipt).toBe(receipt);
});

test("assertTransactionSucceeded returns the receipt once it has a status", async () => {
  const receipt = { execution_status: "SUCCEEDED", events: [] };
  await expect(assertTransactionSucceeded(fakeProvider(async () => receipt), "0xtx", [0])).resolves.toBe(receipt);
});

test("executeIntent passes its intent id to the signer", async () => {
  const seen: unknown[] = [];
  const signer = fakeSigner({ execute: async (_calls, opts) => { seen.push(opts); return { txHash: "0xtx" }; } });
  await executeIntent(signer, fakeClient(), PREBUILT);
  expect(seen).toEqual([{ intentIds: ["intent-1"] }]);
});

test("executeIntents passes all intent ids to the signer", async () => {
  const seen: unknown[] = [];
  const signer = fakeSigner({ execute: async (_calls, opts) => { seen.push(opts); return { txHash: "0xtx" }; } });
  await executeIntents(signer, fakeClient(), [PREBUILT, { ...PREBUILT, id: "intent-3" }]);
  expect(seen).toEqual([{ intentIds: ["intent-1", "intent-3"] }]);
});

test("executeIntent reads the receipt through the client's provider", async () => {
  const seen: string[] = [];
  const client = fakeClient({}, fakeProvider(async (txHash) => { seen.push(txHash); return { execution_status: "SUCCEEDED" }; }));
  await executeIntent(fakeSigner(), client, PREBUILT);
  expect(seen).toEqual(["0xtx"]);
});
