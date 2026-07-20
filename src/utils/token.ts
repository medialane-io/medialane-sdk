import { SUPPORTED_TOKENS } from "../constants.js";

export type SupportedToken = (typeof SUPPORTED_TOKENS)[number];

/**
 * Parse a human-readable amount (e.g. "1.5") to its raw integer string
 * representation given the token's decimal places.
 * Uses pure BigInt arithmetic to avoid floating point precision loss.
 */
export function parseAmount(human: string, decimals: number): string {
  const [whole, frac = ""] = human.split(".");
  const fracPadded = frac.padEnd(decimals, "0").slice(0, decimals);
  return (BigInt(whole) * BigInt(10) ** BigInt(decimals) + BigInt(fracPadded)).toString();
}

/**
 * Format a raw integer string (e.g. "1500000") to a human-readable decimal
 * string given the token's decimal places.
 */
export function formatAmount(raw: string, decimals: number): string {
  const value = BigInt(raw);
  const factor = 10n ** BigInt(decimals);
  const whole = value / factor;
  const remainder = value % factor;
  const fractional = remainder.toString().padStart(decimals, "0");
  return `${whole}.${fractional}`;
}

/**
 * Find a supported token by its contract address.
 *
 * Compares by numeric felt value so a caller-supplied address that isn't
 * zero-padded to 64 hex chars (`0x33068f6…`) still matches the stored padded
 * form (`0x033068f6…`) — a bare `.toLowerCase()` string compare would miss it,
 * the exact padding trap the address invariant warns against. Non-hex inputs
 * fall back to a case-insensitive string compare.
 */
export function getTokenByAddress(address: string): SupportedToken | undefined {
  let target: bigint | null = null;
  try {
    target = BigInt(address);
  } catch {
    target = null;
  }
  return SUPPORTED_TOKENS.find((t) => {
    if (target !== null) {
      try {
        return BigInt(t.address) === target;
      } catch {
        /* stored address not hex — fall through to string compare */
      }
    }
    return t.address.toLowerCase() === address.toLowerCase();
  });
}

/**
 * Find a supported token by its symbol (case-insensitive).
 */
export function getTokenBySymbol(symbol: string): SupportedToken | undefined {
  const upper = symbol.toUpperCase();
  return SUPPORTED_TOKENS.find((t) => t.symbol === upper);
}

/**
 * Return all tokens available for use in listing and offer dialogs.
 * Tokens with listable: false appear only as marketplace filter chips.
 */
export function getListableTokens(): ReadonlyArray<SupportedToken> {
  return SUPPORTED_TOKENS.filter((t) => t.listable);
}
