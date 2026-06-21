import { test, expect } from "bun:test";
import { getService } from "./registry.js";

test("mip-erc721 exposes Starknet onchain coordinates", () => {
  const svc = getService("mip-erc721")!;
  expect(svc.onchain?.STARKNET?.factoryAddress).toBe(
    "0x0558c9b6ea4d403df6d765fb77be55702c572f0a811f037c6c4209fe1e5aeef2",
  );
});

test("a service has no coordinates on an unpopulated chain", () => {
  const svc = getService("mip-erc721")!;
  expect(svc.onchain?.ETHEREUM).toBeUndefined();
});
