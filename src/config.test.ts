import { test, expect } from "bun:test";
import { resolveConfig } from "./config.js";

test("defaults to STARKNET and resolves its coordinates", () => {
  const cfg = resolveConfig({});
  expect(cfg.chain).toBe("STARKNET");
  expect(cfg.rpcUrl).toBe("https://rpc.starknet.lava.build");
  expect(cfg.marketplace721Contract).toBe(
    "0x069cf5391077e3ebdd9cb6aebf90ed530d29f0d6aa34a43f5afae938c0fb565e",
  );
});

test("an explicit rpcUrl overrides the registry default", () => {
  const cfg = resolveConfig({ rpcUrl: "https://example.test/rpc" });
  expect(cfg.rpcUrl).toBe("https://example.test/rpc");
});
