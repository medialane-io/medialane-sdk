import { test, expect } from "bun:test";
import { InvalidRecoveryKeyError, parseRecoveryKey } from "../starknet/index.js";

test("a refused recovery key is the same error class the entry exports", () => {
  for (const bad of ["", "0x", "0x0", "nonsense", "0xzz", "0x" + "f".repeat(64)]) {
    expect(() => parseRecoveryKey(bad)).toThrow(InvalidRecoveryKeyError);
  }
});

test("a valid key still yields an address", () => {
  expect(parseRecoveryKey("0x01" + "2b".repeat(31)).walletAddress).toBe(
    "0x6958ce9523a63b831c5d3a691059affe47dfaab5124a9d7bf10f80a080b8cf",
  );
});
