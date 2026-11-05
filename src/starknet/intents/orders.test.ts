import { describe, expect, test } from "bun:test";
import { resolveConfig } from "../../config.js";
import type { ApiOrder } from "../../types/api.js";
import { sameCalls } from "../sponsored-checks.js";
import { buildIntent, resolveIntentInputs, type IntentReaders } from "./build.js";
import { typedDataMatches } from "./compare.js";
import fixtures from "./orders.fixtures.json";

const config = resolveConfig({});
const startTime = fixtures.now + 30;
const orderInputs = { counter: "5", royaltyMaxBps: "500" };
const matches = (built: { calls: unknown; typedData?: unknown }, fixture: { calls: unknown; typedData: unknown }) =>
  typedDataMatches(built.typedData, fixture.typedData) && sameCalls(built.calls as never, fixture.calls as never);

function recordingReaders(order: Partial<ApiOrder> | null = null) {
  const reads: string[] = [];
  const readers: IntentReaders = {
    counterOf: async (offerer, standard) => (reads.push(`counter ${standard} ${offerer}`), "5"),
    royaltyCapOf: async (nft, tokenId) => (reads.push(`royalty ${nft} ${tokenId}`), "500"),
    orderOf: async (hash) => (reads.push(`order ${hash}`), order as ApiOrder | null),
  };
  return { readers, reads };
}

describe("order intents build what the backend builds", () => {
  test("a 721 listing", () => {
    expect(matches(buildIntent("listing", { ...fixtures.listing721.params, startTime }, orderInputs, config), fixtures.listing721)).toBe(true);
  });

  test("a 1155 listing", () => {
    expect(matches(buildIntent("listing", { ...fixtures.listing1155.params, startTime }, orderInputs, config), fixtures.listing1155)).toBe(true);
  });

  test("a 721 offer", () => {
    expect(matches(buildIntent("offer", { ...fixtures.offer721.params, startTime }, orderInputs, config), fixtures.offer721)).toBe(true);
  });

  test("a 1155 offer", () => {
    expect(matches(buildIntent("offer", { ...fixtures.offer1155.params, startTime }, orderInputs, config), fixtures.offer1155)).toBe(true);
  });

  test("a 721 cancel", () => {
    expect(matches(buildIntent("cancel", fixtures.cancel721.params, { is1155: false }, config), fixtures.cancel721)).toBe(true);
  });

  test("a 1155 cancel", () => {
    expect(matches(buildIntent("cancel", fixtures.cancel1155.params, { is1155: true }, config), fixtures.cancel1155)).toBe(true);
  });

  test("a counter-offer, which lasts its full duration from its start", () => {
    const p = fixtures.counterOffer.params;
    const built = buildIntent(
      "counter-offer",
      { sellerAddress: p.sellerAddress, originalOrderHash: "0x1", durationSeconds: p.durationSeconds, priceRaw: p.priceRaw, salt: p.salt, startTime },
      { nftContract: p.nftContract, tokenId: p.tokenId, currency: p.currencyAddress, ...orderInputs },
      config,
    );
    const expected = structuredClone(fixtures.counterOffer.typedData) as { message: Record<string, unknown> };
    expected.message.end_time = String(startTime + p.durationSeconds);
    expect(typedDataMatches(built.typedData, expected)).toBe(true);
    expect(sameCalls(built.calls, fixtures.counterOffer.calls as never)).toBe(true);
  });
});

describe("order intents refuse what they can't build", () => {
  test("a listing at another price builds different typed data", () => {
    const built = buildIntent("listing", { ...fixtures.listing721.params, price: "1.6", startTime }, orderInputs, config);
    expect(typedDataMatches(built.typedData, fixtures.listing721.typedData)).toBe(false);
  });

  test("a listing in an unsupported currency is refused", () => {
    expect(() => buildIntent("listing", { ...fixtures.listing721.params, currency: "0x9", startTime }, orderInputs, config)).toThrow(/currency/);
  });

  test("a 1155 listing of no items is refused", () => {
    expect(() => buildIntent("listing", { ...fixtures.listing721.params, amount: "0", startTime }, orderInputs, config)).toThrow(/at least 1/);
  });
});

describe("order intents read only what they need", () => {
  const { offerer, nftContract, tokenId } = fixtures.listing721.params;

  test("a 721 listing reads the offerer's 721 counter and the royalty cap", async () => {
    const { readers, reads } = recordingReaders();
    expect(await resolveIntentInputs("listing", { ...fixtures.listing721.params, startTime }, readers)).toEqual(orderInputs);
    expect(reads).toEqual([`counter ERC721 ${offerer}`, `royalty ${nftContract} ${tokenId}`]);
  });

  test("a 1155 offer reads the 1155 counter", async () => {
    const { readers, reads } = recordingReaders();
    await resolveIntentInputs("offer", { ...fixtures.offer1155.params, startTime }, readers);
    expect(reads[0]).toBe(`counter ERC1155 ${offerer}`);
  });

  test("a cancel that names its standard reads nothing", async () => {
    const { readers, reads } = recordingReaders();
    expect(await resolveIntentInputs("cancel", { ...fixtures.cancel721.params, tokenStandard: "ERC1155" }, readers)).toEqual({ is1155: true });
    expect(reads).toEqual([]);
  });

  test("a cancel without a standard reads it from the stored order", async () => {
    const { readers } = recordingReaders({ offer: { itemType: "ERC1155" } as ApiOrder["offer"], consideration: { itemType: "ERC20" } as ApiOrder["consideration"] });
    expect(await resolveIntentInputs("cancel", fixtures.cancel721.params, readers)).toEqual({ is1155: true });
  });

  test("a counter-offer reads the item and currency from the original order", async () => {
    const original = {
      offer: { itemType: "ERC20", token: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d" },
      consideration: { itemType: "ERC721", token: nftContract, identifier: tokenId },
    } as unknown as ApiOrder;
    const { readers } = recordingReaders(original);
    const p = fixtures.counterOffer.params;
    expect(
      await resolveIntentInputs("counter-offer", { sellerAddress: p.sellerAddress, originalOrderHash: "0x1", durationSeconds: p.durationSeconds, priceRaw: p.priceRaw, salt: p.salt, startTime }, readers),
    ).toEqual({ nftContract, tokenId, currency: original.offer.token, ...orderInputs });
  });

  test("a counter-offer on an order that can't be found is refused", async () => {
    const { readers } = recordingReaders(null);
    await expect(resolveIntentInputs("counter-offer", { sellerAddress: offerer, originalOrderHash: "0x1", durationSeconds: 3600, priceRaw: "1", salt: "0x1", startTime }, readers)).rejects.toThrow(/order/);
  });
});
