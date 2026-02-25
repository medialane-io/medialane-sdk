import { SUPPORTED_TOKENS } from "../constants.js";

export type SupportedToken = (typeof SUPPORTED_TOKENS)[number];

/**
 * Parse a human-readable amount (e.g. "1.5") to its raw integer string
 * representation given the token's decimal places.
 */
export function parseAmount(human: string, decimals: number): string {
  const factor = Math.pow(10, decimals);
  return BigInt(Math.floor(parseFloat(human) * factor)).toString();
}

/**
 * Format a raw integer string (e.g. "1500000") to a human-readable decimal
 * string given the token's decimal places.
 */
export function formatAmount(raw: string, decimals: number): string {
  const value = BigInt(raw);
  const factor = BigInt(Math.pow(10, decimals));
  const whole = value / factor;
  const remainder = value % factor;
  const fractional = remainder.toString().padStart(decimals, "0");
  return `${whole}.${fractional}`;
}

/**
 * Find a supported token by its contract address (case-insensitive).
 */
export function getTokenByAddress(address: string): SupportedToken | undefined {
  const lower = address.toLowerCase();
  return SUPPORTED_TOKENS.find((t) => t.address.toLowerCase() === lower);
}

/**
 * Find a supported token by its symbol (case-insensitive).
 */
export function getTokenBySymbol(symbol: string): SupportedToken | undefined {
  const upper = symbol.toUpperCase();
  return SUPPORTED_TOKENS.find((t) => t.symbol === upper);
}
