import { ec, num } from "starknet";

/**
 * Pure crypto primitives behind a passkey-sealed Starknet wallet — HKDF key
 * derivation, AES-GCM seal/unseal, Stark keypair generation, Stark-curve
 * signing. Deliberately excludes the WebAuthn calls (`navigator.credentials`)
 * that produce the PRF secret these functions consume — that stays app-local
 * because it's untestable in this SDK's Node-based test environment and
 * because RP_NAME/PRF_SALT are legitimately per-app identity, not protocol
 * facts. `hkdfInfo` is always an explicit caller-supplied parameter, never
 * defaulted — see the design doc's "load-bearing constraint" for why.
 */
export async function deriveAesKey(prfSecret: Uint8Array, hkdfInfo: Uint8Array): Promise<CryptoKey> {
  const hkdf = await crypto.subtle.importKey("raw", prfSecret as BufferSource, "HKDF", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: new Uint8Array(0), info: hkdfInfo as BufferSource },
    hkdf,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export function generateStarkKeyPair(): { privateKeyHex: string; publicKeyHex: string } {
  const privateKeyHex =
    "0x" +
    Array.from(ec.starkCurve.utils.randomPrivateKey())
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  return { privateKeyHex, publicKeyHex: ec.starkCurve.getStarkKey(privateKeyHex) };
}

export async function sealPrivateKey(
  aesKey: CryptoKey,
  iv: Uint8Array,
  privateKeyHex: string,
): Promise<ArrayBuffer> {
  return crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    aesKey,
    new TextEncoder().encode(privateKeyHex),
  );
}

export async function unsealPrivateKey(
  aesKey: CryptoKey,
  iv: Uint8Array,
  ciphertext: BufferSource,
): Promise<string> {
  const buf = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv as BufferSource }, aesKey, ciphertext);
  return new TextDecoder().decode(buf);
}

export function signWithPrivateKey(privateKeyHex: string, msgHash: string): [string, string] {
  const sig = ec.starkCurve.sign(msgHash, privateKeyHex);
  return [num.toHex(sig.r), num.toHex(sig.s)];
}
