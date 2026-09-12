import { test, expect } from "bun:test";
import { ec } from "starknet";
import { deriveStarkKeyPair, starkKeyPairFromPrivateKey } from "./crypto.js";

const secret = (byte: number) => new Uint8Array(32).fill(byte);

test("the same passkey secret always gives the same key, which is the whole point", async () => {
  const a = await deriveStarkKeyPair(secret(7));
  const b = await deriveStarkKeyPair(secret(7));
  expect(a.privateKeyHex).toBe(b.privateKeyHex);
  expect(a.publicKeyHex).toBe(b.publicKeyHex);
});

test("a different passkey secret gives a different key", async () => {
  const a = await deriveStarkKeyPair(secret(7));
  const b = await deriveStarkKeyPair(secret(8));
  expect(a.privateKeyHex).not.toBe(b.privateKeyHex);
});

test("the derived key is a valid Starknet private key", async () => {
  const { privateKeyHex } = await deriveStarkKeyPair(secret(1));
  const value = BigInt(privateKeyHex);
  expect(value).toBeGreaterThan(0n);
  expect(value < ec.starkCurve.CURVE.n).toBe(true);
  expect(() => starkKeyPairFromPrivateKey(privateKeyHex)).not.toThrow();
});

test("the derived key survives a round trip through the importer, so it can be exported", async () => {
  const derived = await deriveStarkKeyPair(secret(3));
  const imported = starkKeyPairFromPrivateKey(derived.privateKeyHex);
  expect(imported.privateKeyHex).toBe(derived.privateKeyHex);
  expect(imported.publicKeyHex).toBe(derived.publicKeyHex);
});

test("every derived key is padded to the same width", async () => {
  for (const byte of [1, 2, 3, 4, 5]) {
    const { privateKeyHex } = await deriveStarkKeyPair(secret(byte));
    expect(privateKeyHex).toMatch(/^0x[0-9a-f]{64}$/);
  }
});

test("the signing key is derived under a different label than the sealing key", async () => {
  const prf = secret(9);
  const material = await crypto.subtle.importKey("raw", prf, "HKDF", false, ["deriveBits"]);
  const bitsFor = (label: string) =>
    crypto.subtle.deriveBits(
      { name: "HKDF", hash: "SHA-256", salt: new Uint8Array(0), info: new TextEncoder().encode(label) },
      material,
      384,
    );

  const sealing = new Uint8Array(await bitsFor("medialane-io-owner-key"));
  const signing = new Uint8Array(await bitsFor("medialane/passkey/stark-key/v1"));
  expect(Array.from(sealing)).not.toEqual(Array.from(signing));
});
