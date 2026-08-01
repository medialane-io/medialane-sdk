import { test, expect } from "bun:test";
import { deriveOwnerKeyPair } from "./derive.js";

const SECRET = new TextEncoder().encode("test-only-secret-do-not-use");

test("derivation is deterministic for the same secret + recipient", () => {
  const a = deriveOwnerKeyPair(SECRET, "a@example.com");
  const b = deriveOwnerKeyPair(SECRET, "a@example.com");
  expect(a).toEqual(b);
});

test("different recipients under the same secret derive different keys", () => {
  const a = deriveOwnerKeyPair(SECRET, "a@example.com");
  const b = deriveOwnerKeyPair(SECRET, "b@example.com");
  expect(a.privateKey).not.toBe(b.privateKey);
  expect(a.publicKey).not.toBe(b.publicKey);
});

test("different secrets derive different keys for the same recipient", () => {
  const other = new TextEncoder().encode("a-different-secret");
  const a = deriveOwnerKeyPair(SECRET, "a@example.com");
  const b = deriveOwnerKeyPair(other, "a@example.com");
  expect(a.privateKey).not.toBe(b.privateKey);
});

test("private key is a valid Stark-curve scalar and publicKey matches it", () => {
  const { ec } = require("starknet");
  const { privateKey, publicKey } = deriveOwnerKeyPair(SECRET, "a@example.com");
  const STARK_ORDER = 3618502788666131213697322783095070105526743751716087489154079457884512865583n;
  expect(BigInt(privateKey) > 0n).toBe(true);
  expect(BigInt(privateKey) < STARK_ORDER).toBe(true);
  expect(ec.starkCurve.getStarkKey(privateKey)).toBe(publicKey);
});
