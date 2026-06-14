import { test, expect } from "bun:test";
import { CHAINS, getCoordinates, type Chain } from "./chains.js";

test("STARKNET is a registered chain", () => {
  expect(CHAINS).toContain("STARKNET");
});

test("getCoordinates returns the Starknet marketplace-721 address", () => {
  const c = getCoordinates("STARKNET");
  expect(c.marketplace721).toBe(
    "0x069cf5391077e3ebdd9cb6aebf90ed530d29f0d6aa34a43f5afae938c0fb565e",
  );
});

test("getCoordinates throws for an unconfigured chain", () => {
  expect(() => getCoordinates("SOLANA" as Chain)).toThrow(/no coordinates/i);
});
