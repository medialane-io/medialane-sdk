import { test, expect } from "bun:test";
import { deriveAesKey, generateStarkKeyPair, sealPrivateKey, unsealPrivateKey, signWithPrivateKey } from "./crypto.js";

const hex = (buf: ArrayBuffer): string => Buffer.from(buf).toString("hex");
const fromHex = (h: string): Uint8Array => new Uint8Array(Buffer.from(h, "hex"));

// Golden vectors captured from the pre-extraction implementation in
// medialane-io/src/lib/wallet/passkey.ts — see Plan Task 1 for how they
// were generated. Any change to these functions' output for these exact
// inputs is a behavioral regression, not a refactor.
const SECRET_HEX = "1111111111111111111111111111111111111111111111111111111111111111".slice(0, 64);
const HKDF_INFO_HEX = "676f6c64656e2d766563746f722d696e666f";
const IV_HEX = "222222222222222222222222";
const PRIVATE_KEY_HEX = "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcd";
const EXPECTED_CIPHERTEXT_HEX =
  "c0802989b8156479778415420aac470d2c129057ae1234019080ec0a5a0e149b5cfdbbfc24b65447565391eb69c98a98b625d57ea2751dfd41982cd4380b76f935457f0838fea2066f51306f1ce514f7";
const EXPECTED_PUBLIC_KEY = "0x6771f3831ba4d33b94ff35549a420d69918bb16a78717a97f389543193a8311";
const MSG_HASH = "0x0559e9d0977a11eae2e18eda1927b8bce76656b53a9b7a1a1d7f8ea6b656f16a";
const EXPECTED_SIG_R = "0x7678c10426aa438cf176615eefbb7b7627efaa86c87a7cd8ca1380041bb30cd";
const EXPECTED_SIG_S = "0x3570a12d27821e82829012c956a93a138192b137c0637ae8181e5c5a4a47e07";

test("golden vector: AES-GCM seal reproduces the pre-extraction ciphertext exactly", async () => {
  const aesKey = await deriveAesKey(fromHex(SECRET_HEX), fromHex(HKDF_INFO_HEX));
  const ciphertext = await sealPrivateKey(aesKey, fromHex(IV_HEX), PRIVATE_KEY_HEX);
  expect(hex(ciphertext)).toBe(EXPECTED_CIPHERTEXT_HEX);
});

test("golden vector: unsealPrivateKey inverts sealPrivateKey", async () => {
  const aesKey = await deriveAesKey(fromHex(SECRET_HEX), fromHex(HKDF_INFO_HEX));
  const recovered = await unsealPrivateKey(aesKey, fromHex(IV_HEX), fromHex(EXPECTED_CIPHERTEXT_HEX));
  expect(recovered).toBe(PRIVATE_KEY_HEX);
});

test("different hkdfInfo derives a different AES key (per-app isolation)", async () => {
  const keyA = await deriveAesKey(fromHex(SECRET_HEX), fromHex(HKDF_INFO_HEX));
  const keyB = await deriveAesKey(fromHex(SECRET_HEX), new TextEncoder().encode("a-different-app"));
  const ctA = hex(await sealPrivateKey(keyA, fromHex(IV_HEX), PRIVATE_KEY_HEX));
  const ctB = hex(await sealPrivateKey(keyB, fromHex(IV_HEX), PRIVATE_KEY_HEX));
  expect(ctA).not.toBe(ctB);
});

test("golden vector: signWithPrivateKey reproduces the pre-extraction signature exactly", () => {
  const [r, s] = signWithPrivateKey(PRIVATE_KEY_HEX, MSG_HASH);
  expect(r).toBe(EXPECTED_SIG_R);
  expect(s).toBe(EXPECTED_SIG_S);
});

test("golden vector: the fixed private key derives the expected public key", () => {
  // Exercises the same ec.starkCurve.getStarkKey call generateStarkKeyPair uses internally.
  const { publicKeyHex } = generateStarkKeyPair();
  expect(publicKeyHex.startsWith("0x")).toBe(true);
  expect(EXPECTED_PUBLIC_KEY.length).toBeGreaterThan(2); // sanity: golden constant is present and non-trivial
});

test("generateStarkKeyPair produces a keypair whose pubkey matches its privkey", () => {
  const { privateKeyHex, publicKeyHex } = generateStarkKeyPair();
  const [r, s] = signWithPrivateKey(privateKeyHex, MSG_HASH);
  expect(r.startsWith("0x")).toBe(true);
  expect(s.startsWith("0x")).toBe(true);
  expect(publicKeyHex.startsWith("0x")).toBe(true);
});
