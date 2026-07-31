import { describe, it, expect } from "bun:test";
import { priceToEkuboParams, VALIDATED_EKUBO_PARAMS } from "./creatorCoin.js";

describe("priceToEkuboParams", () => {
  it("reproduces VALIDATED_EKUBO_PARAMS exactly for an 18-decimal quote", () => {
    const result = priceToEkuboParams(18);
    expect(result.startingPrice.mag).toBe(VALIDATED_EKUBO_PARAMS.startingPrice.mag);
    expect(result.startingPrice.sign).toBe(VALIDATED_EKUBO_PARAMS.startingPrice.sign);
    expect(result.fee).toBe(VALIDATED_EKUBO_PARAMS.fee);
    expect(result.tickSpacing).toBe(VALIDATED_EKUBO_PARAMS.tickSpacing);
    expect(result.bound).toBe(VALIDATED_EKUBO_PARAMS.bound);
  });

  it("computes a different tick for a 6-decimal quote (USDC/USDT) than 18-decimal", () => {
    const result6dec = priceToEkuboParams(6);
    const result18dec = priceToEkuboParams(18);
    expect(result6dec.startingPrice.mag).not.toBe(result18dec.startingPrice.mag);
  });

  it("computes a different tick for an 8-decimal quote (WBTC) than 6 or 18", () => {
    const result8dec = priceToEkuboParams(8);
    const result6dec = priceToEkuboParams(6);
    const result18dec = priceToEkuboParams(18);
    expect(result8dec.startingPrice.mag).not.toBe(result6dec.startingPrice.mag);
    expect(result8dec.startingPrice.mag).not.toBe(result18dec.startingPrice.mag);
  });

  it("decodes back to ~0.01 (within one tickSpacing step) via the existing read-side formula", () => {
    // Mirrors getCreatorCoinPrice's price = (sqrt_ratio/2^128)^2 conversion,
    // but starting from a tick instead of a live sqrt_ratio: price = TICK_BASE^tick.
    // Truncation toward zero means the decoded price can be off by up to one
    // tickSpacing step (~0.6%, since TICK_BASE^tickSpacing ≈ 1.006) — not
    // floating-point noise, so the tolerance here is relative, not absolute.
    const TICK_BASE = 1.000001;
    for (const quoteDecimals of [6, 8, 18]) {
      const result = priceToEkuboParams(quoteDecimals);
      const tick = result.startingPrice.sign ? -Number(result.startingPrice.mag) : Number(result.startingPrice.mag);
      const rawRatio = TICK_BASE ** tick;
      const decAdj = 10 ** (18 - quoteDecimals);
      const decodedPrice = rawRatio * decAdj;
      expect(Math.abs(decodedPrice - 0.01) / 0.01).toBeLessThan(0.01); // within 1%
    }
  });
});
