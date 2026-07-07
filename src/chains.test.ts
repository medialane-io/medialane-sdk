import { test, expect } from "bun:test";
import { CHAINS, getCoordinates, type Chain } from "./chains.js";

test("STARKNET is a registered chain", () => {
  expect(CHAINS).toContain("STARKNET");
});

test("getCoordinates returns the Starknet marketplace-721 address", () => {
  const c = getCoordinates("STARKNET");
  expect(c.marketplace721).toBe(
    "0x03eda9a2b6ad90845a43591bac8083ebaf677d51fdf20f503b2c01889e3131fc",
  );
});

test("getCoordinates throws for an unconfigured chain", () => {
  expect(() => getCoordinates("SOLANA" as Chain)).toThrow(/no coordinates/i);
});

import { describe as d2, expect as e2, test as t2 } from "bun:test";

d2("per-chain coordinate shapes", () => {
  t2("starknet stays populated and typed", async () => {
    const { getCoordinates } = await import("./chains.js");
    e2(getCoordinates("STARKNET").marketplace721).toStartWith("0x");
  });
  t2("unconfigured chains throw until deploy", async () => {
    const { getCoordinates } = await import("./chains.js");
    for (const chain of ["ETHEREUM", "BASE", "SOLANA", "STELLAR"] as const) {
      e2(() => getCoordinates(chain)).toThrow(/No coordinates configured/);
    }
  });
});
