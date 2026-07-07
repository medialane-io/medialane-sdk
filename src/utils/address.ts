import { num } from "starknet";
import { keccak_256 } from "@noble/hashes/sha3.js";
import { base32, base58 } from "@scure/base";
import type { Chain } from "../chains.js";

/**
 * Normalize an address to its chain's canonical form. The single source of
 * address normalization across Medialane (07-identity §I; spec 2026-06-13 §3.2).
 * `medialane-backend` re-exports this; do not maintain a parallel copy.
 *
 * - STARKNET: 0x-prefixed 64-char lowercase hex (felt, zero-padded).
 * - ETHEREUM / BASE: EIP-55 mixed-case checksum.
 * - SOLANA: base58, validated as a 32-byte public key, returned verbatim.
 * - STELLAR: strkey (G… account / C… contract), CRC16-XModem-verified,
 *   canonical uppercase.
 * - BITCOIN: not implemented — a non-foreclosed seam, gated on a future
 *   Bitcoin fork (chain-sovereignty §2); never a built path today.
 */
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
    const hex = num.toHex(BigInt(address));
    return "0x" + hex.slice(2).padStart(64, "0").toLowerCase();
  } catch {
    throw new Error(`Invalid STARKNET address: "${address}"`);
  }
}

function normalizeEvm(address: string): string {
  const m = /^0x([0-9a-fA-F]{40})$/.exec(address);
  if (!m) throw new Error(`Invalid ETHEREUM/BASE address: "${address}"`);
  const lower = m[1].toLowerCase();
  // EIP-55: keccak256 of the lowercase hex (ASCII, no 0x); uppercase the i-th
  // hex char when the i-th nibble of the hash is >= 8.
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
    return address; // base58 is canonical and case-sensitive — return as-is
  } catch {
    throw new Error(`Invalid SOLANA address: "${address}"`);
  }
}

/** Stellar strkey version bytes: 'G' account (6<<3), 'C' contract (2<<3). */
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

/** CRC16-XModem (poly 0x1021, init 0x0000) — the strkey checksum. */
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

/**
 * Normalize a felt/hash (tx hash, order hash) to 0x-prefixed 64-char lowercase
 * hex. Starknet-shaped; chain-scoped at call sites that handle other chains'
 * hashes.
 */
export function normalizeHash(hash: string): string {
  try {
    const hex = num.toHex(BigInt(hash));
    return "0x" + hex.slice(2).padStart(64, "0").toLowerCase();
  } catch {
    throw new Error(`Invalid hash: "${hash}"`);
  }
}

/** Shorten an address to "0x1234...abcd" form, normalized for its chain. */
export function shortenAddress(chain: Chain, address: string, chars = 4): string {
  const norm = normalizeAddress(chain, address);
  return `${norm.slice(0, chars + 2)}...${norm.slice(-chars)}`;
}
