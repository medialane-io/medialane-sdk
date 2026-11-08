import { describe, expect, test } from "bun:test";
import type { Call } from "starknet";
import { getCoordinates } from "../../chains.js";
import { swapCallsWithinBounds, type SwapRequest } from "./swap.js";
import fixtures from "./swap.fixtures.json";

const EXCHANGE = "0x04270219d365d6b017231b52e92b3fb5d7c8378b05e9abc97724537a80e93b0f";
const OTHER = "0x0999999999999999999999999999999999999999999999999999999999999999";
const base = { taker: fixtures.taker, sellTokenAddress: fixtures.sellToken, buyTokenAddress: fixtures.buyToken };
const sell: SwapRequest = { ...base, ...fixtures.sell.request };
const buy: SwapRequest = { ...base, ...fixtures.buy.request };
const routes = { sell: fixtures.sell.calls as Call[], buy: fixtures.buy.calls as Call[] };

function edit(calls: Call[], index: number, change: (call: Call & { calldata: string[] }) => Call): Call[] {
  return calls.map((call, i) => (i === index ? change({ ...call, calldata: [...(call.calldata as string[])] }) : call));
}
const setArg = (calls: Call[], index: number, position: number, value: string) =>
  edit(calls, index, (call) => ((call.calldata[position] = value), call));

describe("swap routes within bounds", () => {
  test("the exchange is avnu's", () => {
    expect(getCoordinates("STARKNET").swapExchange).toBe(EXCHANGE);
  });

  test("a live route selling an exact amount passes", () => {
    expect(swapCallsWithinBounds(sell, routes.sell)).toBe(true);
  });

  test("a live route buying an exact amount passes, with its closing allowance reset", () => {
    expect(swapCallsWithinBounds(buy, routes.buy)).toBe(true);
  });
});

describe("swap routes out of bounds", () => {
  test("an approval to another spender", () => {
    expect(swapCallsWithinBounds(sell, setArg(routes.sell, 0, 0, OTHER))).toBe(false);
  });

  test("an approval larger than the amount sold", () => {
    expect(swapCallsWithinBounds(sell, setArg(routes.sell, 0, 1, "0xffffffffffffffffffff"))).toBe(false);
  });

  test("a swap on another contract", () => {
    expect(swapCallsWithinBounds(sell, edit(routes.sell, 1, (call) => ({ ...call, contractAddress: OTHER })))).toBe(false);
  });

  test("another beneficiary", () => {
    expect(swapCallsWithinBounds(sell, setArg(routes.sell, 1, 8, OTHER))).toBe(false);
    expect(swapCallsWithinBounds(buy, setArg(routes.buy, 1, 8, OTHER))).toBe(false);
  });

  test("an integrator fee", () => {
    expect(swapCallsWithinBounds(sell, setArg(routes.sell, 1, 9, "0x64"))).toBe(false);
    expect(swapCallsWithinBounds(buy, setArg(routes.buy, 1, 10, OTHER))).toBe(false);
  });

  test("another token bought", () => {
    expect(swapCallsWithinBounds(sell, setArg(routes.sell, 1, 3, OTHER))).toBe(false);
  });

  test("another amount sold or bought than asked", () => {
    expect(swapCallsWithinBounds({ ...sell, sellAmountRaw: "1" }, routes.sell)).toBe(false);
    expect(swapCallsWithinBounds({ ...buy, buyAmountRaw: "1" }, routes.buy)).toBe(false);
  });

  test("an extra call", () => {
    const extra = { contractAddress: fixtures.sellToken, entrypoint: "transfer", calldata: [OTHER, "1", "0"] };
    expect(swapCallsWithinBounds(sell, [...routes.sell, extra])).toBe(false);
  });

  test("the entrypoint of the other mode", () => {
    expect(swapCallsWithinBounds(sell, edit(routes.sell, 1, (call) => ({ ...call, entrypoint: "swap_exact_token_to" })))).toBe(false);
  });
});
