import { describe, expect, test } from "bun:test";
import type { Call } from "starknet";
import { resolveConfig } from "../../config.js";
import { sameCalls } from "../sponsored-checks.js";
import { buildIntent, resolveIntentInputs, type IntentOrder, type IntentReaders } from "./build.js";
import { purchaseCost } from "./fulfill.js";
import fixtures from "./fulfill.fixtures.json";

const withFees = resolveConfig({ feeConfig: { enabled: true, fundAddress: fixtures.fund } });
const withoutFees = resolveConfig({ feeConfig: { enabled: false } });
const cases = ["listing721", "listing1155", "offer721", "offer1155"] as const;
const is1155 = (name: string) => name.endsWith("1155");

describe("fulfill builds what the backend builds", () => {
  for (const name of cases) {
    const c = fixtures[name];
    const inputs = { order: c.order as IntentOrder, is1155: is1155(name) };

    test(`${name} with the platform fee`, () => {
      expect(sameCalls(buildIntent("fulfill", c.params, inputs, withFees).calls, c.withFee as Call[])).toBe(true);
    });

    test(`${name} without the platform fee`, () => {
      expect(sameCalls(buildIntent("fulfill", c.params, inputs, withoutFees).calls, c.withoutFee as Call[])).toBe(true);
    });
  }

  test("an order the index doesn't have is fulfilled with no approval or fee", () => {
    const built = buildIntent("fulfill", fixtures.listing721.params, { order: null, is1155: false }, withFees);
    expect(built.calls.map((c) => c.entrypoint)).toEqual(["fulfill_order"]);
  });
});

describe("fulfill reads the stored order", () => {
  const readers = (order: IntentOrder | null): IntentReaders => ({
    counterOf: async () => "0",
    royaltyCapOf: async () => "0",
    orderOf: async () => order,
  });

  test("the token standard comes from the stored order when not given", async () => {
    const inputs = await resolveIntentInputs("fulfill", fixtures.listing1155.params, readers(fixtures.listing1155.order as IntentOrder));
    expect(inputs).toEqual({ order: fixtures.listing1155.order, is1155: true });
  });

  test("a given ERC-1155 standard is kept", async () => {
    const inputs = await resolveIntentInputs("fulfill", { ...fixtures.listing721.params, tokenStandard: "ERC1155" }, readers(null));
    expect(inputs).toEqual({ order: null, is1155: true });
  });
});

describe("purchaseCost", () => {
  const spent = (calls: Call[], token: string) =>
    calls
      .filter((c) => BigInt(c.contractAddress) === BigInt(token) && (c.entrypoint === "approve" || c.entrypoint === "transfer"))
      .reduce((sum, c) => {
        const data = (c.calldata as string[]).map(String);
        return sum + BigInt(data[1]!) + (BigInt(data[2]!) << 128n);
      }, 0n);

  for (const name of ["listing721", "listing1155"] as const) {
    test(`${name}: the total is what the purchase spends`, () => {
      const c = fixtures[name];
      const order = c.order as IntentOrder;
      const quantity = is1155(name) ? BigInt((c.params as { quantity?: string }).quantity ?? "1") : 1n;
      const built = buildIntent("fulfill", c.params, { order, is1155: is1155(name) }, withFees);
      const cost = purchaseCost(order, quantity, withFees.feeConfig);
      expect(cost.total).toBe(spent(built.calls, order.consideration.token!));
      expect(cost.total).toBe(cost.gross + cost.fee);
      expect(cost.feeBps).toBe(100);
    });
  }

  test("without the platform fee the total is the price", () => {
    const order = fixtures.listing721.order as IntentOrder;
    const cost = purchaseCost(order, 1, withoutFees.feeConfig);
    expect(cost).toEqual({ gross: BigInt(order.consideration.startAmount), fee: 0n, total: BigInt(order.consideration.startAmount), feeBps: 0 });
  });

  test("quantity counts only for ERC-1155 listings", () => {
    const order = fixtures.listing721.order as IntentOrder;
    expect(purchaseCost(order, 5, withFees.feeConfig)).toEqual(purchaseCost(order, 1, withFees.feeConfig));
  });
});
