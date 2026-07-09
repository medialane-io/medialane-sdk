import { test, expect, mock } from "bun:test";
import { StarknetVenue } from "./venue.js";

function makeVenue() {
  const deps = {
    config: { marketplaceContract: "0xmkt" } as any,
    provider: {} as any,
    resolveOrder: mock(async () => ({
      paymentToken: "0xusdc",
      totalPrice: "1000000",
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
    resolveOrder: mock(async () => ({ paymentToken: "0xusdc", totalPrice: "3000000", standard: "ERC1155" as const })),
    resolveStandard: mock(async () => "ERC1155" as const),
  };
  const venue = new StarknetVenue(deps);
  const spy = mock(async () => ({ txHash: "0xf" }));
  (venue as any).m1155.fulfillOrder = spy;
  await venue.fulfillOrder({} as any, "0xd", { quantity: "3" });
  expect(spy.mock.calls[0][1]).toMatchObject({ orderHash: "0xd", quantity: "3" });
});

test("cancelOrder (721) delegates with the digest", async () => {
  const { venue } = makeVenue();
  const spy = mock(async () => ({ txHash: "0xcancel" }));
  (venue as any).m721.cancelOrder = spy;
  await venue.cancelOrder({} as any, "0xdigest");
  expect(spy.mock.calls[0][1]).toEqual({ orderHash: "0xdigest" });
});
