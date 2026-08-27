import { keccak_256 } from "@noble/hashes/sha3.js";
import { base32, base58 } from "@scure/base";
import type { Chain } from "../chains.js";

export function normalizeAddress(chain: Chain, address: string): string {
  switch (chain) {
    case "STARKNET":
      return normalizeStarknet(address);
    case "ETHEREUM":
    case "BASE":
      return normalizeEvm(address);
    case "SOLANA":
      return normalizeSolana(address);
    case "STELLAR":
      return normalizeStellar(address);
    case "BITCOIN":
      throw new Error("BITCOIN address normalization not implemented");
  }
}

function normalizeStarknet(address: string): string {
  try {
    const hex = BigInt(address).toString(16);
    return "0x" + hex.padStart(64, "0").toLowerCase();
  } catch {
    throw new Error(`Invalid STARKNET address: "${address}"`);
  }
}

function normalizeEvm(address: string): string {
  const m = /^0x([0-9a-fA-F]{40})$/.exec(address);
  if (!m) throw new Error(`Invalid ETHEREUM/BASE address: "${address}"`);
  const lower = m[1].toLowerCase();

  const hash = keccak_256(new TextEncoder().encode(lower));
  let out = "0x";
  for (let i = 0; i < 40; i++) {
    const nibble = (hash[i >> 1]! >> (i % 2 === 0 ? 4 : 0)) & 0xf;
    out += nibble >= 8 ? lower[i]!.toUpperCase() : lower[i];
  }
  return out;
}

function normalizeSolana(address: string): string {
  try {
    const bytes = base58.decode(address);
    if (bytes.length !== 32) throw new Error("not a 32-byte key");
    return address;
  } catch {
    throw new Error(`Invalid SOLANA address: "${address}"`);
  }
}

const STELLAR_VERSION_BYTES = new Set([6 << 3, 2 << 3]);

function normalizeStellar(address: string): string {
  const upper = address.toUpperCase();
  if (!/^[GC][A-Z2-7]{55}$/.test(upper)) {
    throw new Error(`Invalid STELLAR address: "${address}"`);
  }
  let decoded: Uint8Array;
  try {
    decoded = base32.decode(upper);
  } catch {
    throw new Error(`Invalid STELLAR address: "${address}"`);
  }
  if (decoded.length !== 35 || !STELLAR_VERSION_BYTES.has(decoded[0]!)) {
    throw new Error(`Invalid STELLAR address: "${address}"`);
  }
  const payload = decoded.subarray(0, 33);
  const checksum = decoded[33]! | (decoded[34]! << 8);
  if (crc16xmodem(payload) !== checksum) {
    throw new Error(`Invalid STELLAR address: "${address}"`);
  }
  return upper;
}

function crc16xmodem(bytes: Uint8Array): number {
  let crc = 0;
  for (const byte of bytes) {
    crc ^= byte << 8;
    for (let i = 0; i < 8; i++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc;
}

declare const canonicalHashBrand: unique symbol;

/**
 * A felt hash in exactly one spelling: lowercase, zero-padded to 64 hex digits.
 *
 * Felts have many equal spellings — `0x0ab`, `0xAB` and `0xab` are the same
 * value on chain but three different strings. Anything that uses a hash as an
 * identity or uniqueness key must therefore compare canonical form, or the
 * same on-chain fact can be presented as several distinct records.
 *
 * Only `normalizeHash` can produce this type, so a function that demands a
 * `CanonicalHash` cannot be handed a raw caller-supplied string. It remains
 * assignable to `string`, so existing readers are unaffected.
 */
export type CanonicalHash = string & { readonly [canonicalHashBrand]: true };

export function normalizeHash(hash: string): CanonicalHash {
  try {
    const hex = BigInt(hash).toString(16);
    return ("0x" + hex.padStart(64, "0").toLowerCase()) as CanonicalHash;
  } catch {
    throw new Error(`Invalid hash: "${hash}"`);
  }
}

export function shortenAddress(chain: Chain, address: string, chars = 4): string {
  const norm = normalizeAddress(chain, address);
  return `${norm.slice(0, chars + 2)}...${norm.slice(-chars)}`;
}
