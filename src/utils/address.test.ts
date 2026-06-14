import { test, expect } from "bun:test";
import { normalizeAddress } from "./address.js";

test("Starknet pads to 64-char lowercase hex (unchanged behavior)", () => {
  expect(normalizeAddress("STARKNET", "0x1")).toBe("0x" + "0".repeat(63) + "1");
});

test("EVM returns EIP-55 checksummed address", () => {
  expect(normalizeAddress("ETHEREUM", "0xfb6916095ca1df60bb79ce92ce3ea74c37c5d359"))
    .toBe("0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359");
});

test("BASE uses the same EVM checksum", () => {
  expect(normalizeAddress("BASE", "0xFB6916095CA1DF60BB79CE92CE3EA74C37C5D359"))
    .toBe("0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359");
});

test("Solana base58 address (32 bytes) is returned verbatim when valid", () => {
  const usdcMint = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
  expect(normalizeAddress("SOLANA", usdcMint)).toBe(usdcMint);
});

test("invalid EVM address throws with the chain named", () => {
  expect(() => normalizeAddress("ETHEREUM", "nope")).toThrow(/ETHEREUM/);
});

test("invalid Solana address throws with the chain named", () => {
  expect(() => normalizeAddress("SOLANA", "0xdeadbeef")).toThrow(/SOLANA/);
});

test("BITCOIN is a non-foreclosed seam — not implemented", () => {
  expect(() => normalizeAddress("BITCOIN", "bc1qxyz")).toThrow(/not implemented/i);
});
