import { describe, it, expect } from "bun:test";
import { priceToEkuboParams, validatePrice, VALIDATED_EKUBO_PARAMS } from "./creatorCoin.js";

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

    const TICK_BASE = 1.000001;
    for (const quoteDecimals of [6, 8, 18]) {
      const result = priceToEkuboParams(quoteDecimals);
      const tick = result.startingPrice.sign ? -Number(result.startingPrice.mag) : Number(result.startingPrice.mag);
      const rawRatio = TICK_BASE ** tick;
      const decAdj = 10 ** (18 - quoteDecimals);
      const decodedPrice = rawRatio * decAdj;
      expect(Math.abs(decodedPrice - 0.01) / 0.01).toBeLessThan(0.01);
    }
  });

  it("stays within the validated bound for realistic prices across all supported quote decimals (6/8/18)", () => {
    const bound = Number(VALIDATED_EKUBO_PARAMS.bound);
    for (const quoteDecimals of [6, 8, 18]) {
      for (const price of [0.0000001, 0.001, 0.01, 1, 100, 1_000_000]) {
        const result = priceToEkuboParams(quoteDecimals, price);
        expect(Number(result.startingPrice.mag)).toBeLessThan(bound);
      }
    }
  });

  it("fee/tickSpacing/bound stay fixed regardless of price — only starting_price varies", () => {
    const a = priceToEkuboParams(18, 0.001);
    const b = priceToEkuboParams(18, 500);
    expect(a.fee).toBe(b.fee);
    expect(a.tickSpacing).toBe(b.tickSpacing);
    expect(a.bound).toBe(b.bound);
    expect(a.startingPrice.mag).not.toBe(b.startingPrice.mag);
  });
});

describe("validatePrice", () => {
  it("accepts a realistic price at every supported quote decimal profile", () => {
    for (const quoteDecimals of [6, 8, 18]) {
      expect(validatePrice(quoteDecimals, 0.01)).toBeNull();
    }
  });
  it("rejects zero, negative, and non-finite prices", () => {
    expect(validatePrice(18, 0)).toMatch(/positive/i);
    expect(validatePrice(18, -1)).toMatch(/positive/i);
    expect(validatePrice(18, NaN)).toMatch(/positive/i);
    expect(validatePrice(18, Infinity)).toMatch(/positive/i);
  });
  it("accepts prices far outside the 0.01 default in both directions", () => {
    expect(validatePrice(18, 0.0000000001)).toBeNull();
    expect(validatePrice(18, 1_000_000)).toBeNull();
  });
});
