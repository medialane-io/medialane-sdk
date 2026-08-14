import { SUPPORTED_TOKENS } from "../constants.js";

export type SupportedToken = (typeof SUPPORTED_TOKENS)[number];

export function parseAmount(human: string, decimals: number): string {
  const [whole, frac = ""] = human.split(".");
  const fracPadded = frac.padEnd(decimals, "0").slice(0, decimals);
  return (BigInt(whole) * BigInt(10) ** BigInt(decimals) + BigInt(fracPadded)).toString();
}

export function formatAmount(raw: string, decimals: number): string {
  const value = BigInt(raw);
  const factor = 10n ** BigInt(decimals);
  const whole = value / factor;
  const remainder = value % factor;
  const fractional = remainder.toString().padStart(decimals, "0");
  return `${whole}.${fractional}`;
}

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

      }
    }
    return t.address.toLowerCase() === address.toLowerCase();
  });
}

export function getTokenBySymbol(symbol: string): SupportedToken | undefined {
  const upper = symbol.toUpperCase();
  return SUPPORTED_TOKENS.find((t) => t.symbol === upper);
}

export function getListableTokens(): ReadonlyArray<SupportedToken> {
  return SUPPORTED_TOKENS.filter((t) => t.listable);
}
