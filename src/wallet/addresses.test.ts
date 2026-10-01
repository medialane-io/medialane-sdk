import { test, expect } from "bun:test";
import { isDeployed, isValidStarknetAddress, normalizeWalletAddress } from "./addresses.js";

test("accepts a well-formed address", () => {
  expect(isValidStarknetAddress("0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcd")).toBe(true);
});

test("rejects garbage", () => {
  expect(isValidStarknetAddress("not-an-address")).toBe(false);
  expect(isValidStarknetAddress("")).toBe(false);
});

test("normalises case and padding to one stored form", () => {
  expect(normalizeWalletAddress("0xABC")).toBe(normalizeWalletAddress("0xabc"));
});

test("an account with code onchain is deployed", async () => {
  const provider = { getClassHashAt: async () => "0x1" };
  expect(await isDeployed(provider, "0xabc")).toBe(true);
});

test("an account the chain does not know is not deployed", async () => {
  const provider = {
    getClassHashAt: async () => {
      throw Object.assign(new Error("Contract not found"), { code: 20 });
    },
  };
  expect(await isDeployed(provider, "0xabc")).toBe(false);
});

test("a failed read throws instead of reading as not deployed", async () => {
  const provider = {
    getClassHashAt: async () => {
      throw new Error("fetch failed");
    },
  };
  await expect(isDeployed(provider, "0xabc")).rejects.toThrow("fetch failed");
});

test("the address reaches the provider in its stored form", async () => {
  const seen: string[] = [];
  const provider = {
    getClassHashAt: async (address: string) => {
      seen.push(address);
      return "0x1";
    },
  };
  await isDeployed(provider, "0xABC");
  expect(seen).toEqual([normalizeWalletAddress("0xabc")]);
});
