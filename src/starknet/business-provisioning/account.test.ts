import { test, expect } from "bun:test";
import { ownerConstructorCalldata, computeAccountAddress } from "./account.js";
import { STARKNET_MEDIAWALLET_CLASS_HASH } from "../../constants.js";

const OWNER = "0x61cc05c5da6e9b1403a27ffa564498cd2b8cda1428b053b08dbbd1cceb744c6";

test("owner constructor calldata is [0, pubkey, 1]", () => {
  expect(ownerConstructorCalldata("0xabc")).toEqual(["0x0", "0xabc", "0x1"]);
  expect(ownerConstructorCalldata(2748)).toEqual(["0x0", "0xabc", "0x1"]);
});

test("computeAccountAddress is deterministic", () => {
  expect(computeAccountAddress(OWNER, 0)).toBe(computeAccountAddress(OWNER, 0));
});

test("computeAccountAddress varies with salt and owner", () => {
  expect(computeAccountAddress(OWNER, 1)).not.toBe(computeAccountAddress(OWNER, 0));
  expect(computeAccountAddress("0xdead", 0)).not.toBe(computeAccountAddress(OWNER, 0));
});

test("computeAccountAddress is a valid Starknet felt (< 2^251)", () => {
  const addr = computeAccountAddress(OWNER, 0);
  expect(addr.startsWith("0x")).toBe(true);
  expect(BigInt(addr) < 2n ** 251n).toBe(true);
  expect(BigInt(addr) > 0n).toBe(true);
});

test("uses the SDK's single-source MediaWallet class hash", () => {
  expect(STARKNET_MEDIAWALLET_CLASS_HASH).toBe(
    "0x014b210c7d47392691144bafecdca3c6c7791cc295ea305988da0a724c05ac31",
  );
});
