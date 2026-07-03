import { test, expect } from "bun:test";
import { getService, hasCapability } from "./registry.js";

test("mip-erc721 exposes Starknet onchain coordinates", () => {
  const svc = getService("mip-erc721")!;
  expect(svc.onchain?.STARKNET?.factoryAddress).toBe(
    "0x0225c3ae09506b8d97adc39649ca740dad5aac195b7f5f0441cc1852947acaea",
  );
});

test("a service has no coordinates on an unpopulated chain", () => {
  const svc = getService("mip-erc721")!;
  expect(svc.onchain?.ETHEREUM).toBeUndefined();
});

test("ip-club is not transferable (soulbound membership card)", () => {
  const svc = getService("ip-club")!;
  expect(svc.capabilities).not.toContain("transfer");
});

test("hasCapability reflects a service's capabilities array", () => {
  expect(hasCapability("ip-club", "transfer")).toBe(false);
  expect(hasCapability("ip-tickets", "transfer")).toBe(true);
});

test("hasCapability returns false for an unregistered or missing service id", () => {
  expect(hasCapability("not-a-real-service", "transfer")).toBe(false);
  expect(hasCapability(null, "transfer")).toBe(false);
  expect(hasCapability(undefined, "transfer")).toBe(false);
});
