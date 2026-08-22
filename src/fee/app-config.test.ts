import { test, expect } from "bun:test";
import { resolveAppFeeConfig } from "./app-config.js";

test("defaults to enabled at 100 bps on both surfaces", () => {
  const c = resolveAppFeeConfig({});
  expect(c.enabled).toBe(true);
  expect(c.marketplaceBps).toBe(100);
  expect(c.launchpadBps).toBe(100);
});

test("only the literal string 'false' disables the fee", () => {
  expect(resolveAppFeeConfig({ NEXT_PUBLIC_FEE_ENABLED: "false" }).enabled).toBe(false);
  expect(resolveAppFeeConfig({ NEXT_PUBLIC_FEE_ENABLED: "true" }).enabled).toBe(true);
  expect(resolveAppFeeConfig({ NEXT_PUBLIC_FEE_ENABLED: "" }).enabled).toBe(true);
});

test("reads bps overrides from the environment", () => {
  const c = resolveAppFeeConfig({
    NEXT_PUBLIC_FEE_MARKETPLACE_BPS: "250",
    NEXT_PUBLIC_FEE_LAUNCHPAD_BPS: "0",
  });
  expect(c.marketplaceBps).toBe(250);
  expect(c.launchpadBps).toBe(0);
});

test("a non-numeric bps falls back to the default rather than NaN", () => {
  const c = resolveAppFeeConfig({ NEXT_PUBLIC_FEE_MARKETPLACE_BPS: "abc" });
  expect(c.marketplaceBps).toBe(100);
});

test("an empty fund address resolves to undefined, not an empty string", () => {
  expect(resolveAppFeeConfig({ NEXT_PUBLIC_FEE_FUND_ADDRESS: "" }).fundAddress).toBeUndefined();
});
