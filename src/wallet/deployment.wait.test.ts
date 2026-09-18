import { test, expect } from "bun:test";
import type { ProviderInterface } from "starknet";
import { waitUntilDeployed } from "./deployment.js";

function providerDeployedAfter(attempts: number): { provider: ProviderInterface; calls: () => number } {
  let calls = 0;
  const provider = {
    getClassHashAt: async () => {
      calls += 1;
      if (calls < attempts) throw new Error("Contract not found");
      return "0x1";
    },
  } as unknown as ProviderInterface;
  return { provider, calls: () => calls };
}

test("returns as soon as the account exists", async () => {
  const { provider, calls } = providerDeployedAfter(1);
  await waitUntilDeployed(provider, "0xabc", 10_000, async () => {});
  expect(calls()).toBe(1);
});

test("keeps checking while the account is still pending", async () => {
  const { provider, calls } = providerDeployedAfter(4);
  await waitUntilDeployed(provider, "0xabc", 10_000, async () => {});
  expect(calls()).toBe(4);
});

test("gives up with a message a user can act on", async () => {
  const provider = {
    getClassHashAt: async () => {
      throw new Error("Contract not found");
    },
  } as unknown as ProviderInterface;
  await expect(waitUntilDeployed(provider, "0xabc", 0, async () => {})).rejects.toThrow(
    /has not appeared on Starknet/,
  );
});
