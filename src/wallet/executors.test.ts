import { test, expect } from "bun:test";
import type { ProviderInterface } from "starknet";
import { SponsoredCallRejectedError } from "../starknet/services/sponsoredExecutor.js";
import { createSelfFundConsent } from "./self-fund-consent.js";
import { sponsoredExecutor } from "./executors.js";
import type { WalletExecutor } from "./types.js";

const PRIVATE_KEY = "0x012b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b";
const USER = "0x6958ce9523a63b831c5d3a691059affe47dfaab5124a9d7bf10f80a080b8cf";
const CALLS = [{ contractAddress: "0x1", entrypoint: "transfer", calldata: [] }];
const TYPED_DATA = {
  types: {
    StarknetDomain: [
      { name: "name", type: "shortstring" },
      { name: "version", type: "shortstring" },
      { name: "chainId", type: "shortstring" },
      { name: "revision", type: "shortstring" },
    ],
    Ping: [{ name: "value", type: "felt" }],
  },
  primaryType: "Ping",
  domain: { name: "avnu.paymaster", version: "1", chainId: "SN_MAIN", revision: "1" },
  message: { value: "1" },
};

const provider = (): ProviderInterface => ({}) as ProviderInterface;
const never: WalletExecutor = {
  execute: async () => {
    throw new Error("the fallback should not run");
  },
};
const fallbackTo = (hash: string): WalletExecutor => ({ execute: async () => ({ transactionHash: hash }) });

function fetchStub(handlers: { build?: Response; execute?: Response }): typeof fetch {
  return (async (url: string) => {
    if (String(url).endsWith("/build")) {
      return handlers.build ?? new Response(JSON.stringify({ typedData: TYPED_DATA }), { status: 200 });
    }
    return handlers.execute ?? new Response(JSON.stringify({ transactionHash: "0xsponsored" }), { status: 200 });
  }) as unknown as typeof fetch;
}

test("a sponsored transaction never asks the user to pay", async () => {
  let asked = 0;
  const consent = createSelfFundConsent(async () => ({ feeRaw: 1n, unit: "FRI" }));
  consent.registerHandler(async () => {
    asked += 1;
    return true;
  });
  const executor = sponsoredExecutor({
    provider,
    proxyUrl: "/api/wallet/sponsored-invoke",
    consent,
    fetchImpl: fetchStub({}),
    fallback: never,
  });

  const result = await executor.execute({ userAddress: USER, privateKeyHex: PRIVATE_KEY, calls: CALLS });
  expect(result).toEqual({ transactionHash: "0xsponsored" });
  expect(asked).toBe(0);
});

test("an unavailable sponsor asks the user, then pays from their wallet", async () => {
  const consent = createSelfFundConsent(async () => ({ feeRaw: 1n, unit: "FRI" }));
  consent.registerHandler(async () => true);
  const executor = sponsoredExecutor({
    provider,
    proxyUrl: "/api/wallet/sponsored-invoke",
    consent,
    fetchImpl: fetchStub({
      build: new Response(JSON.stringify({ error: "down", code: "sponsor_unavailable" }), { status: 502 }),
    }),
    fallback: fallbackTo("0xselffunded"),
  });

  expect(await executor.execute({ userAddress: USER, privateKeyHex: PRIVATE_KEY, calls: CALLS })).toEqual({
    transactionHash: "0xselffunded",
  });
});

test("declining leaves the transaction unsent", async () => {
  const consent = createSelfFundConsent(async () => ({ feeRaw: 1n, unit: "FRI" }));
  consent.registerHandler(async () => false);
  const executor = sponsoredExecutor({
    provider,
    proxyUrl: "/api/wallet/sponsored-invoke",
    consent,
    fetchImpl: fetchStub({
      build: new Response(JSON.stringify({ error: "down", code: "sponsor_unavailable" }), { status: 502 }),
    }),
    fallback: never,
  });

  await expect(
    executor.execute({ userAddress: USER, privateKeyHex: PRIVATE_KEY, calls: CALLS }),
  ).rejects.toBeInstanceOf(SponsoredCallRejectedError);
});

test("a refused transaction is never offered for self-funding", async () => {
  let asked = 0;
  const consent = createSelfFundConsent(async () => ({ feeRaw: 1n, unit: "FRI" }));
  consent.registerHandler(async () => {
    asked += 1;
    return true;
  });
  const executor = sponsoredExecutor({
    provider,
    proxyUrl: "/api/wallet/sponsored-invoke",
    consent,
    fetchImpl: fetchStub({
      build: new Response(JSON.stringify({ error: "not yours", code: "not_authorized" }), { status: 403 }),
    }),
    fallback: never,
  });

  await expect(
    executor.execute({ userAddress: USER, privateKeyHex: PRIVATE_KEY, calls: CALLS }),
  ).rejects.toBeInstanceOf(SponsoredCallRejectedError);
  expect(asked).toBe(0);
});
