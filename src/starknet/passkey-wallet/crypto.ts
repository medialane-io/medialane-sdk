import { ec, num } from "starknet";

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

export class InvalidStarkPrivateKeyError extends Error {
  constructor(reason: string) {
    super(`Not a valid Starknet private key: ${reason}`);
    this.name = "InvalidStarkPrivateKeyError";
  }
}

export function starkKeyPairFromPrivateKey(input: string): { privateKeyHex: string; publicKeyHex: string } {
  const trimmed = input.trim().replace(/\s+/g, "");
  const body = trimmed.startsWith("0x") || trimmed.startsWith("0X") ? trimmed.slice(2) : trimmed;

  if (body.length === 0) throw new InvalidStarkPrivateKeyError("it is empty");
  if (!/^[0-9a-fA-F]+$/.test(body)) throw new InvalidStarkPrivateKeyError("it is not hexadecimal");
  if (body.length > 64) throw new InvalidStarkPrivateKeyError("it is too long");

  const value = BigInt("0x" + body);
  if (value === 0n) throw new InvalidStarkPrivateKeyError("it is zero");
  if (value >= ec.starkCurve.CURVE.n) throw new InvalidStarkPrivateKeyError("it is outside the curve order");

  const privateKeyHex = "0x" + value.toString(16).padStart(64, "0");
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
