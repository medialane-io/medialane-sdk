

export const COIN_DECIMALS = 18;
export const LAUNCH_PRICE_QUOTE_PER_COIN = 0.01;
export const MIN_SUPPLY = 1_000n;
export const MAX_SUPPLY = 1_000_000_000_000n;
export const MAX_FELT_BYTES = 31;

function byteLen(s: string): number {
  return new TextEncoder().encode(s).length;
}

export function validateName(s: string): string | null {
  if (!s.trim()) return "Name is required";
  if (byteLen(s) > MAX_FELT_BYTES) return `Name must be at most ${MAX_FELT_BYTES} bytes`;
  return null;
}

export function validateSymbol(s: string): string | null {
  if (!s.trim()) return "Symbol is required";
  if (byteLen(s) > MAX_FELT_BYTES) return `Symbol must be at most ${MAX_FELT_BYTES} bytes`;
  return null;
}

export function validateSupply(human: string): string | null {
  if (!/^\d+$/.test(human.trim())) return "Supply must be a whole number";
  const v = BigInt(human.trim());
  if (v < MIN_SUPPLY) return `Supply must be at least ${MIN_SUPPLY.toString()}`;
  if (v > MAX_SUPPLY) return `Supply must be at most ${MAX_SUPPLY.toString()}`;
  return null;
}

export function toRaw(human: bigint, decimals = COIN_DECIMALS): bigint {
  return human * 10n ** BigInt(decimals);
}

export function teamCoinsRaw(supplyRaw: bigint, pct: number): bigint {
  const bps = BigInt(Math.round(pct * 100));
  return (supplyRaw * bps) / 10_000n;
}

export function buybackQuoteRaw(teamCoinsRawValue: bigint, quoteDecimals: number): bigint {
  return (teamCoinsRawValue * 10n ** BigInt(quoteDecimals)) / (100n * 10n ** BigInt(COIN_DECIMALS));
}

export function fdvHuman(supplyHuman: number): number {
  return supplyHuman * LAUNCH_PRICE_QUOTE_PER_COIN;
}
