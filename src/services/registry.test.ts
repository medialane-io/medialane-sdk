import { test, expect } from "bun:test";
import { getService } from "./registry.js";

test("mip-erc721 exposes Starknet onchain coordinates", () => {
  const svc = getService("mip-erc721")!;
  expect(svc.onchain?.STARKNET?.factoryAddress).toBe(
    "0x0322cb7119955e01ac778d40976eb3ba50540bb0899f812d612f9c7e63e49fd2",
  );
});

test("a service has no coordinates on an unpopulated chain", () => {
  const svc = getService("mip-erc721")!;
  expect(svc.onchain?.ETHEREUM).toBeUndefined();
});
