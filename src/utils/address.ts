import { num } from "starknet";

/**
 * Normalize a Starknet address to a 0x-prefixed 64-character lowercase hex
 * string. Validates the input by routing through `BigInt(...)` — non-numeric
 * input throws `Invalid Starknet address: "<input>"`.
 *
 * The single source of truth for address normalization across Medialane.
 * `medialane-backend` re-exports this; do not maintain a parallel copy.
 */
export function normalizeAddress(address: string): string {
  try {
    const hex = num.toHex(BigInt(address));
    return "0x" + hex.slice(2).padStart(64, "0").toLowerCase();
  } catch {
    throw new Error(`Invalid Starknet address: "${address}"`);
  }
}

/**
 * Normalize a Starknet felt/hash (tx hash, order hash, etc.) to a 0x-prefixed
 * 64-character lowercase hex string. Same shape as `normalizeAddress` — kept
 * as a separate name so the *intent* of each call site is explicit.
 *
 * Starknet RPCs and wallets may omit leading zeroes for the same value;
 * database uniqueness must not treat those textual variants as different
 * transactions.
 */
export function normalizeHash(hash: string): string {
  try {
    const hex = num.toHex(BigInt(hash));
    return "0x" + hex.slice(2).padStart(64, "0").toLowerCase();
  } catch {
    throw new Error(`Invalid Starknet hash: "${hash}"`);
  }
}

/**
 * Shorten an address to "0x1234...abcd" format.
 */
export function shortenAddress(address: string, chars = 4): string {
  const norm = normalizeAddress(address);
  return `${norm.slice(0, chars + 2)}...${norm.slice(-chars)}`;
}
