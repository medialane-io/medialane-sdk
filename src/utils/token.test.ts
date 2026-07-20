import { test, expect, describe } from "bun:test";
import { parseAmount, formatAmount, getTokenByAddress, getTokenBySymbol } from "./token.js";

describe("parseAmount / formatAmount", () => {
  test("round-trips 18-decimal amounts without float precision loss", () => {
    // 123.456789012345678 at 18dp — the raw value (21 digits) is beyond a
    // float's exact integer range, so a float-based factor would corrupt it.
    const raw = parseAmount("123.456789012345678", 18);
    expect(raw).toBe("123456789012345678000"); // 123·1e18 + 456789012345678·1e3
    expect(formatAmount(raw, 18)).toBe("123.456789012345678000"); // fraction zero-padded to 18
  });

  test("formatAmount uses exact BigInt factor at 18 decimals", () => {
    // 1 whole token, 18dp — the classic Math.pow(10,18) precision trap.
    expect(formatAmount("1000000000000000000", 18)).toBe("1.000000000000000000");
  });

  test("parseAmount pads and truncates the fractional part to decimals", () => {
    expect(parseAmount("1.5", 6)).toBe("1500000");
    expect(parseAmount("1.123456789", 6)).toBe("1123456"); // truncates extra precision
  });
});

describe("getTokenByAddress", () => {
  test("matches a non-zero-padded Starknet address to the padded stored form", () => {
    const usdc = getTokenBySymbol("USDC")!;
    // Strip the leading zero after 0x — a common unpadded form from RPC/events.
    const unpadded = "0x" + usdc.address.slice(2).replace(/^0+/, "");
    expect(unpadded).not.toBe(usdc.address); // precondition: actually unpadded
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
