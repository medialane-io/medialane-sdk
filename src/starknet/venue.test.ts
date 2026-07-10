import { test, expect, mock } from "bun:test";
import { hash } from "starknet";
import { resolveConfig } from "../config.js";
import { StarknetVenue, type StarknetVenueDeps } from "./venue.js";
import type { StarknetVenueSigner } from "./index.js";

const ORDER_CREATED_SELECTOR = hash.getSelectorFromName("OrderCreated");
const CFG = resolveConfig({
  backendUrl: "https://api.example.com",
  rpcUrl: "https://rpc.example.com",
  marketplaceContract: "0x100",
  collectionContract: "0x200",
  marketplace1155Contract: "0x101",
  collection1155Contract: "0x201",
  chain: "STARKNET",
});
const asset = { chain: "STARKNET" as const, contract: "0xbeef", tokenId: "7" };

/** A read provider: get_counter → 3, everything else → 0 (approval needed),
 *  and a receipt carrying one OrderCreated event with `orderHash`. */
function readProvider(orderHash = "0xabc") {
  return {
    callContract: mock(async (req: any) => (req?.entrypoint === "get_counter" ? ["0x3"] : ["0x0"])),
    getTransactionReceipt: mock(async () => ({
      events: [{ from_address: "0x100", keys: [ORDER_CREATED_SELECTOR, orderHash], data: [] }],
    })),
  } as any;
}

/** A capability-port mock that records what it is asked to sign and execute. */
function mockSigner(rec: { typed: unknown[]; calls: unknown[][] }): StarknetVenueSigner {
  return {
    address: "0xa11ce",
    signTypedData: mock(async (d) => {
      rec.typed.push(d);
      return ["0x1", "0x2"];
    }),
    execute: mock(async (c) => {
      rec.calls.push(c);
      return { txHash: "0xtx" };
    }),
  };
}

function deps(over: Partial<StarknetVenueDeps> = {}): StarknetVenueDeps {
  return {
    config: CFG,
    provider: readProvider(),
    resolveOrder: mock(async () => ({ paymentToken: "0xda1a", unitPrice: "1000000", standard: "ERC721" as const })),
    resolveStandard: mock(async () => "ERC721" as const),
    ...over,
  };
}

test("chain tag is STARKNET", () => {
  expect(new StarknetVenue(deps()).chain).toBe("STARKNET");
});

test("incrementCounter executes increment_counter on the 721 marketplace", async () => {
  const rec = { typed: [], calls: [] as unknown[][] };
  await new StarknetVenue(deps()).incrementCounter(mockSigner(rec));
  expect((rec.calls[0][0] as any).entrypoint).toBe("increment_counter");
  expect((rec.calls[0][0] as any).contractAddress).toBe("0x100");
});

test("getCounter reads get_counter via the deps provider", async () => {
  const d = deps();
  expect(await new StarknetVenue(d).getCounter("0xme")).toBe(3n);
  expect((d.provider.callContract as any).mock.calls[0][0].entrypoint).toBe("get_counter");
});

test("fulfillOrder (721) executes [approve, fulfill_order], never signs", async () => {
  const rec = { typed: [], calls: [] as unknown[][] };
  const signer = mockSigner(rec);
  const r = await new StarknetVenue(deps()).fulfillOrder(signer, "0xdigest");
  expect(rec.calls[0].map((c: any) => c.entrypoint)).toEqual(["approve", "fulfill_order"]);
  expect(rec.typed).toHaveLength(0); // fulfilment is unsigned
  expect(r.txHash).toBe("0xtx");
});

test("fulfillOrder (1155) computes total = unitPrice × quantity and routes to the 1155 venue", async () => {
  const rec = { typed: [], calls: [] as unknown[][] };
  const d = deps({
    resolveOrder: mock(async () => ({ paymentToken: "0xda1a", unitPrice: "1000000", standard: "ERC1155" as const })),
  });
  await new StarknetVenue(d).fulfillOrder(mockSigner(rec), "0xd", { quantity: "3" });
  const fulfill = (rec.calls[0] as any[]).find((c) => c.entrypoint === "fulfill_order");
  // fulfill_order([orderHash, quantity]); approve (raw Call) targets the 1155 marketplace 0x101.
  expect(fulfill.calldata[1]).toBe("3");
  expect((rec.calls[0][0] as any).calldata[0]).toBe("0x101");
});

test("cancelOrder (721) signs the cancellation then executes cancel_order", async () => {
  const rec = { typed: [], calls: [] as unknown[][] };
  await new StarknetVenue(deps()).cancelOrder(mockSigner(rec), "0xdigest");
  expect(rec.typed).toHaveLength(1);
  expect((rec.calls[0][0] as any).entrypoint).toBe("cancel_order");
});

test("registerOrder (721 listing) signs the built typed data, executes [approve, register_order], returns receipt orderRef", async () => {
  const rec = { typed: [], calls: [] as unknown[][] };
  const d = deps({ provider: readProvider("0xabc123") });
  const r = await new StarknetVenue(d).registerOrder(mockSigner(rec), {
    asset,
    side: "listing",
    paymentToken: "USDC",
    amount: "1000000",
    royaltyMaxBps: 500,
    startTime: 0,
    endTime: 0,
    salt: "0x1",
  });
  expect(rec.typed).toHaveLength(1);
  expect(rec.calls[0].map((c: any) => c.entrypoint)).toEqual(["approve", "register_order"]);
  expect(r).toEqual({ txHash: "0xtx", orderRef: "0xabc123" });
});

test("registerOrder (721 bid) executes [approve(erc20), register_order]", async () => {
  const rec = { typed: [], calls: [] as unknown[][] };
  await new StarknetVenue(deps()).registerOrder(mockSigner(rec), {
    asset,
    side: "bid",
    paymentToken: "USDC",
    amount: "5000000",
    royaltyMaxBps: 0,
    startTime: 0,
    endTime: 0,
    salt: "0x2",
  });
  const calls = rec.calls[0] as any[];
  expect(calls.map((c) => c.entrypoint)).toEqual(["approve", "register_order"]);
  // the approve targets the resolved ERC-20 (USDC), not the NFT contract.
  expect(calls[0].contractAddress).not.toBe(asset.contract);
});

test("registerOrder (1155 listing) reads the 1155 counter and uses set_approval_for_all", async () => {
  const rec = { typed: [], calls: [] as unknown[][] };
  const d = deps({ resolveStandard: mock(async () => "ERC1155" as const) });
  await new StarknetVenue(d).registerOrder(mockSigner(rec), {
    asset,
    side: "listing",
    paymentToken: "USDC",
    amount: "1000000",
    quantity: "3",
    royaltyMaxBps: 0,
    startTime: 0,
    endTime: 0,
    salt: "0x9",
  });
  const calls = rec.calls[0] as any[];
  expect(calls.map((c) => c.entrypoint)).toEqual(["set_approval_for_all", "register_order"]);
  // counter read hit the 1155 marketplace 0x101.
  const counterCall = (d.provider.callContract as any).mock.calls.find((a: any[]) => a[0].entrypoint === "get_counter");
  expect(counterCall[0].contractAddress).toBe("0x101");
});

test("registerOrder throws if no OrderCreated event in the receipt", async () => {
  const d = deps({ provider: { callContract: mock(async () => ["0x3"]), getTransactionReceipt: mock(async () => ({ events: [] })) } as any });
  const rec = { typed: [], calls: [] as unknown[][] };
  await expect(
    new StarknetVenue(d).registerOrder(mockSigner(rec), {
      asset,
      side: "listing",
      paymentToken: "USDC",
      amount: "1000000",
      royaltyMaxBps: 0,
      startTime: 0,
      endTime: 0,
      salt: "0x1",
    }),
  ).rejects.toThrow("OrderCreated event not found");
});
