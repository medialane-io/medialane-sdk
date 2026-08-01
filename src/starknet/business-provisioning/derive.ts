import { extract, expand } from "@noble/hashes/hkdf.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { ec, num } from "starknet";

const STARK_ORDER = 3618502788666131213697322783095070105526743751716087489154079457884512865583n;

/**
 * Derive a MediaWallet owner key pair from a business-held secret and a
 * per-recipient identifier (typically their email) — deterministic, so the
 * business never has to store a per-recipient key: recompute it from the one
 * secret it already holds whenever it's needed (deploy time, handoff time),
 * then discard it. HKDF-SHA256(secret, recipientId), reduced mod the Stark
 * curve order to get a valid scalar (never zero).
 */
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
