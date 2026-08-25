import { test, expect, describe } from "bun:test";
import { parseAmount, formatAmount, getTokenByAddress, getTokenBySymbol } from "./token.js";

describe("parseAmount / formatAmount", () => {
  test("round-trips 18-decimal amounts without float precision loss", () => {

    const raw = parseAmount("123.456789012345678", 18);
    expect(raw).toBe("123456789012345678000");
    expect(formatAmount(raw, 18)).toBe("123.456789012345678");
  });

  test("formatAmount trims trailing zeros and drops the decimal point for whole numbers", () => {
    expect(formatAmount("1000000000000000000", 18)).toBe("1");
    expect(formatAmount("1500000000000000000", 18)).toBe("1.5");
    expect(formatAmount("0", 18)).toBe("0");
  });

  test("parseAmount pads and truncates the fractional part to decimals", () => {
    expect(parseAmount("1.5", 6)).toBe("1500000");
    expect(parseAmount("1.123456789", 6)).toBe("1123456");
  });
});

describe("getTokenByAddress", () => {
  test("matches a non-zero-padded Starknet address to the padded stored form", () => {
    const usdc = getTokenBySymbol("USDC")!;

    const unpadded = "0x" + usdc.address.slice(2).replace(/^0+/, "");
    expect(unpadded).not.toBe(usdc.address);
    expect(getTokenByAddress(unpadded)?.symbol).toBe("USDC");
  });

  test("matches the canonical padded address", () => {
    const usdc = getTokenBySymbol("USDC")!;
    expect(getTokenByAddress(usdc.address)?.symbol).toBe("USDC");
  });

  test("returns undefined for an unknown address", () => {
    expect(getTokenByAddress("0xdead")).toBeUndefined();
  });
});
