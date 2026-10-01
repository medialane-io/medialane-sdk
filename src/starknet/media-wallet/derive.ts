import { extract, expand } from "@noble/hashes/hkdf.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { ec, num } from "starknet";

const STARK_ORDER = 3618502788666131213697322783095070105526743751716087489154079457884512865583n;

export function deriveOwnerKeyPair(
  secret: Uint8Array,
  recipientId: string,
): { privateKey: string; publicKey: string } {
  const prk = extract(sha256, secret);
  const okm = expand(sha256, prk, new TextEncoder().encode(recipientId), 32);
  let scalar = BigInt("0x" + Buffer.from(okm).toString("hex")) % STARK_ORDER;
  if (scalar === 0n) scalar = 1n;
  const privateKey = num.toHex(scalar);
  const publicKey = ec.starkCurve.getStarkKey(privateKey);
  return { privateKey, publicKey };
}
