import { describe, expect, test } from "bun:test";
import { address, felt, uint } from "./starknet.js";

const message = (schema: { safeParse(v: unknown): { success: boolean; error?: { issues: { message: string }[] } } }, value: unknown) => {
  const r = schema.safeParse(value);
  return r.success ? null : r.error!.issues[0]!.message;
};

describe("starknet.address", () => {
  test.each(["0x1", `0x${"a".repeat(64)}`, "0xAbC"])("accepts %s", (value) => {
    expect(address.safeParse(value).success).toBe(true);
  });

  test.each(["1", "0xzz", `0x${"a".repeat(65)}`, "", "0x"])("rejects %p with the address message", (value) => {
    expect(message(address, value)).toBe("Invalid Starknet address");
  });
});

describe("starknet.uint", () => {
  test.each(["0", "123", "340282366920938463463374607431768211456"])("accepts %s", (value) => {
    expect(uint.safeParse(value).success).toBe(true);
  });

  test.each(["-1", "1.5", "abc", "", "0x1"])("rejects %p with the integer message", (value) => {
    expect(message(uint, value)).toBe("must be a non-negative integer string");
  });
});

describe("starknet.felt", () => {
  test("accepts a hex felt and rejects anything else with the felt message", () => {
    expect(felt.safeParse("0x0").success).toBe(true);
    expect(felt.safeParse(`0x${"f".repeat(64)}`).success).toBe(true);
    expect(message(felt, "12")).toBe("must be a hex felt");
    expect(message(felt, `0x${"f".repeat(65)}`)).toBe("must be a hex felt");
  });
});
