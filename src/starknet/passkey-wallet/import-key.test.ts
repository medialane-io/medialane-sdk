import { test, expect } from "bun:test";
import { generateStarkKeyPair, starkKeyPairFromPrivateKey, InvalidStarkPrivateKeyError } from "./crypto.js";

test("round-trips a generated key back to the same public key", () => {
  const generated = generateStarkKeyPair();
  const imported = starkKeyPairFromPrivateKey(generated.privateKeyHex);
  expect(imported.publicKeyHex).toBe(generated.publicKeyHex);
});

test("accepts the same key with or without 0x, and with stray whitespace", () => {
  const { privateKeyHex, publicKeyHex } = generateStarkKeyPair();
  const bare = privateKeyHex.slice(2);
  expect(starkKeyPairFromPrivateKey(bare).publicKeyHex).toBe(publicKeyHex);
  expect(starkKeyPairFromPrivateKey(`  ${privateKeyHex}\n`).publicKeyHex).toBe(publicKeyHex);
  expect(starkKeyPairFromPrivateKey(privateKeyHex.toUpperCase().replace("0X", "0x")).publicKeyHex).toBe(publicKeyHex);
});

test("normalises short keys so the same value always yields one address", () => {
  expect(starkKeyPairFromPrivateKey("0x1").privateKeyHex).toBe("0x" + "1".padStart(64, "0"));
  expect(starkKeyPairFromPrivateKey("0x01").publicKeyHex).toBe(starkKeyPairFromPrivateKey("0x1").publicKeyHex);
});

test("rejects values that are not keys rather than deriving a wrong wallet", () => {
  expect(() => starkKeyPairFromPrivateKey("")).toThrow(InvalidStarkPrivateKeyError);
  expect(() => starkKeyPairFromPrivateKey("0x")).toThrow(InvalidStarkPrivateKeyError);
  expect(() => starkKeyPairFromPrivateKey("not-a-key")).toThrow(InvalidStarkPrivateKeyError);
  expect(() => starkKeyPairFromPrivateKey("0xzz")).toThrow(InvalidStarkPrivateKeyError);
  expect(() => starkKeyPairFromPrivateKey("0x0")).toThrow(InvalidStarkPrivateKeyError);
});

test("rejects keys outside the curve order instead of silently reducing them", () => {
  const tooLong = "0x" + "f".repeat(65);
  expect(() => starkKeyPairFromPrivateKey(tooLong)).toThrow(InvalidStarkPrivateKeyError);
  const aboveOrder = "0x" + "f".repeat(64);
  expect(() => starkKeyPairFromPrivateKey(aboveOrder)).toThrow(InvalidStarkPrivateKeyError);
});
