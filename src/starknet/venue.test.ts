import { test, expect, mock } from "bun:test";
import { hash } from "starknet";
import { StarknetVenue } from "./venue.js";

const ORDER_CREATED_SELECTOR = hash.getSelectorFromName("OrderCreated");
/** A provider whose receipt carries one OrderCreated event with the given hash. */
function receiptProvider(orderHash = "0xabc") {
  return {
    getTransactionReceipt: mock(async () => ({
      events: [{ from_address: "0xmkt", keys: [ORDER_CREATED_SELECTOR, orderHash], data: [] }],
    })),
  } as any;
}
const asset = { chain: "STARKNET" as const, contract: "0xnft", tokenId: "7" };

function makeVenue() {
  const deps = {
    config: { marketplaceContract: "0xmkt" } as any,
    provider: {} as any,
    resolveOrder: mock(async () => ({
      paymentToken: "0xusdc",
      unitPrice: "1000000",
      standard: "ERC721" as const,
    })),
    resolveStandard: mock(async () => "ERC721" as const),
  };
  return { venue: new StarknetVenue(deps), deps };
}

test("chain tag is STARKNET", () => {
  expect(makeVenue().venue.chain).toBe("STARKNET");
});

test("incrementCounter delegates to the 721 module", async () => {
  const { venue } = makeVenue();
  const spy = mock(async () => ({ txHash: "0xinc" }));
  (venue as any).m721.incrementCounter = spy;
  const r = await venue.incrementCounter({} as any);
  expect(spy).toHaveBeenCalledTimes(1);
  expect(r).toEqual({ txHash: "0xinc" });
});

test("getOrderDetails delegates with the digest", async () => {
  const { venue } = makeVenue();
  const spy = mock(async () => ({ offerer: "0xa" }));
  (venue as any).m721.getOrderDetails = spy;
  await venue.getOrderDetails("0xdigest");
  expect(spy.mock.calls[0][0]).toBe("0xdigest");
});

test("getCounter delegates with the address", async () => {
  const { venue } = makeVenue();
  const spy = mock(async () => 5n);
  (venue as any).m721.getCounter = spy;
  expect(await venue.getCounter("0xme")).toBe(5n);
});

test("fulfillOrder (721) resolves the order then calls the 721 module", async () => {
  const { venue } = makeVenue();
  const spy = mock(async () => ({ txHash: "0xfill" }));
  (venue as any).m721.fulfillOrder = spy;
  const r = await venue.fulfillOrder({} as any, "0xdigest");
  expect(spy.mock.calls[0][1]).toEqual({
    orderHash: "0xdigest",
    paymentToken: "0xusdc",
    totalPrice: "1000000",
  });
  expect(r.txHash).toBe("0xfill");
});

test("fulfillOrder routes to the 1155 module with quantity when the order is ERC1155", async () => {
  const deps = {
    config: { marketplaceContract: "0xmkt" } as any,
    provider: {} as any,
    resolveOrder: mock(async () => ({ paymentToken: "0xusdc", unitPrice: "1000000", standard: "ERC1155" as const })),
    resolveStandard: mock(async () => "ERC1155" as const),
  };
  const venue = new StarknetVenue(deps);
  const spy = mock(async () => ({ txHash: "0xf" }));
  (venue as any).m1155.fulfillOrder = spy;
  await venue.fulfillOrder({} as any, "0xd", { quantity: "3" });
  // unitPrice 1_000_000 × quantity 3 = 3_000_000 total approved
  expect(spy.mock.calls[0][1]).toMatchObject({ orderHash: "0xd", quantity: "3", totalPrice: "3000000" });
});

test("cancelOrder (721) delegates with the digest", async () => {
  const { venue } = makeVenue();
  const spy = mock(async () => ({ txHash: "0xcancel" }));
  (venue as any).m721.cancelOrder = spy;
  await venue.cancelOrder({} as any, "0xdigest");
  expect(spy.mock.calls[0][1]).toEqual({ orderHash: "0xdigest" });
});

function registerDeps(standard: "ERC721" | "ERC1155", orderHash = "0xabc") {
  return {
    config: { marketplaceContract: "0xmkt" } as any,
    provider: receiptProvider(orderHash),
    resolveOrder: mock(async () => ({ paymentToken: "0xusdc", unitPrice: "1000000", standard })),
    resolveStandard: mock(async () => standard),
  };
}

test("registerOrder (721 listing) maps raw amount → human price, returns receipt orderRef", async () => {
  const venue = new StarknetVenue(registerDeps("ERC721", "0xabc123"));
  const spy = mock(async () => ({ txHash: "0xtx" }));
  (venue as any).m721.createListing = spy;
  const r = await venue.registerOrder({} as any, {
    asset, side: "listing", paymentToken: "USDC", amount: "1000000", // 1 USDC (6 dp)
    royaltyMaxBps: 500, startTime: 0, endTime: 0, salt: "0x1",
  });
  const arg = spy.mock.calls[0][1];
  expect(arg.nftContract).toBe("0xnft");
  expect(arg.tokenId).toBe("7");
  expect(arg.price).toBe("1.000000");        // formatAmount(1000000, 6)
  expect(arg.currency).toBe("USDC");
  expect(arg.royaltyMaxBps).toBe("500");
  expect(r).toEqual({ txHash: "0xtx", orderRef: "0xabc123" });
});

test("registerOrder (721 bid) → makeOffer", async () => {
  const venue = new StarknetVenue(registerDeps("ERC721"));
  const spy = mock(async () => ({ txHash: "0xtx" }));
  (venue as any).m721.makeOffer = spy;
  await venue.registerOrder({} as any, {
    asset, side: "bid", paymentToken: "USDC", amount: "5000000",
    royaltyMaxBps: 0, startTime: 0, endTime: 0, salt: "0x2",
  });
  expect(spy).toHaveBeenCalledTimes(1);
});

test("registerOrder (1155 listing) → Medialane1155 with quantity + per-unit price", async () => {
  const venue = new StarknetVenue(registerDeps("ERC1155"));
  const spy = mock(async () => ({ txHash: "0xt" }));
  (venue as any).m1155.createListing = spy;
  await venue.registerOrder({} as any, {
    asset, side: "listing", paymentToken: "USDC", amount: "1000000", quantity: "3",
    royaltyMaxBps: 0, startTime: 0, endTime: 0, salt: "0x9",
  });
  const arg = spy.mock.calls[0][1];
  expect(arg.amount).toBe("3");              // units listed
  expect(arg.pricePerUnit).toBe("1.000000"); // per unit
});

test("registerOrder throws if no OrderCreated event in the receipt", async () => {
  const deps = registerDeps("ERC721");
  deps.provider = { getTransactionReceipt: mock(async () => ({ events: [] })) } as any;
  const venue = new StarknetVenue(deps);
  (venue as any).m721.createListing = mock(async () => ({ txHash: "0xtx" }));
  await expect(
    venue.registerOrder({} as any, { asset, side: "listing", paymentToken: "USDC", amount: "1000000", royaltyMaxBps: 0, startTime: 0, endTime: 0, salt: "0x1" }),
  ).rejects.toThrow("OrderCreated event not found");
});
