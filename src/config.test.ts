import { test, expect } from "bun:test";
import { resolveConfig } from "./config.js";

test("defaults to STARKNET and resolves its coordinates", () => {
  const cfg = resolveConfig({});
  expect(cfg.chain).toBe("STARKNET");
  expect(cfg.rpcUrl).toBe("https://rpc.starknet.lava.build");
  expect(cfg.marketplace721Contract).toBe(
    "0x03eda9a2b6ad90845a43591bac8083ebaf677d51fdf20f503b2c01889e3131fc",
  );
});

test("an explicit rpcUrl overrides the registry default", () => {
  const cfg = resolveConfig({ rpcUrl: "https://example.test/rpc" });
  expect(cfg.rpcUrl).toBe("https://example.test/rpc");
});

test("appSource is accepted when it is an upper-case name, and passed through", () => {
  expect(resolveConfig({ appSource: "MEDIALANE_IO" }).appSource).toBe("MEDIALANE_IO");
});

test("appSource is optional", () => {
  expect(resolveConfig({}).appSource).toBeUndefined();
});

test("an appSource that is not an upper-case name is rejected", () => {
  expect(() => resolveConfig({ appSource: "medialane io" })).toThrow();
});
