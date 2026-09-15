import { test, expect } from "bun:test";
import { createSelfFundConsent, type SelfFundFeeEstimate } from "./self-fund-consent.js";

const FEE: SelfFundFeeEstimate = { feeRaw: 1000n, unit: "FRI" };
const CALLS = [{ contractAddress: "0x1", entrypoint: "transfer", calldata: [] }];

test("denies by default, so real funds are never spent without a handler", async () => {
  const consent = createSelfFundConsent(async () => FEE);
  expect(await consent.request({})).toBe(false);
});

test("delegates to the registered handler and returns its answer", async () => {
  const consent = createSelfFundConsent(async () => FEE);
  consent.registerHandler(async () => true);
  expect(await consent.request({})).toBe(true);
  consent.registerHandler(async () => false);
  expect(await consent.request({})).toBe(false);
});

test("clearing the handler denies again", async () => {
  const consent = createSelfFundConsent(async () => FEE);
  consent.registerHandler(async () => true);
  consent.registerHandler(null);
  expect(await consent.request({})).toBe(false);
});

test("the handler is offered the fee when an address and calls are known", async () => {
  const consent = createSelfFundConsent(async () => FEE);
  let offered: SelfFundFeeEstimate | null = null;
  consent.registerHandler(async (estimate) => {
    offered = await estimate;
    return true;
  });
  await consent.request({ address: "0xabc", calls: CALLS });
  expect(offered).toEqual(FEE);
});

test("a fee that cannot be estimated still asks, with no figure", async () => {
  const consent = createSelfFundConsent(async () => {
    throw new Error("node down");
  });
  let offered: SelfFundFeeEstimate | null | "unset" = "unset";
  consent.registerHandler(async (estimate) => {
    offered = await estimate;
    return true;
  });
  expect(await consent.request({ address: "0xabc", calls: CALLS })).toBe(true);
  expect(offered).toBeNull();
});

test("no fee is estimated when there is nothing to estimate", async () => {
  let estimated = 0;
  const consent = createSelfFundConsent(async () => {
    estimated += 1;
    return FEE;
  });
  consent.registerHandler(async () => true);
  await consent.request({});
  expect(estimated).toBe(0);
});
