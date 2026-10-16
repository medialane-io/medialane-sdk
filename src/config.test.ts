import { test, expect } from "bun:test";
import { resolveConfig } from "./config.js";

test("defaults to STARKNET and resolves its coordinates", () => {
  const cfg = resolveConfig({});
  expect(cfg.chain).toBe("STARKNET");
  expect(cfg.marketplace721Contract).toBe(
    "0x03eda9a2b6ad90845a43591bac8083ebaf677d51fdf20f503b2c01889e3131fc",
  );
});

test("has no RPC URL", () => {
  expect("rpcUrl" in resolveConfig({})).toBe(false);
});
