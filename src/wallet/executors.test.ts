import { test, expect } from "bun:test";
import type { ProviderInterface } from "starknet";
import { UserFacingError } from "../errors.js";
import { createSelfFundConsent } from "./self-fund-consent.js";
import { GUARDIAN_WALLET_BUSY, sponsoredExecutor } from "./executors.js";
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
  const consent = createSelfFundConsent(async () => ({ feeRaw: 1n, unit: "FRI", balanceRaw: null }));
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

  const result = await executor.execute({ userAddress: USER, privateKeyHex: PRIVATE_KEY, calls: CALLS, intentIds: ["i1"] });
  expect(result).toEqual({ transactionHash: "0xsponsored" });
  expect(asked).toBe(0);
});

test("an unavailable sponsor asks the user, then pays from their wallet", async () => {
  const consent = createSelfFundConsent(async () => ({ feeRaw: 1n, unit: "FRI", balanceRaw: null }));
  consent.registerHandler(async () => true);
  const executor = sponsoredExecutor({
    provider,
    proxyUrl: "/api/wallet/sponsored-invoke",
    consent,
    fetchImpl: fetchStub({
      build: new Response(JSON.stringify({ error: "down", code: "sponsor_unavailable" }), { status: 502 }),
    }),
    fallback: fallbackTo("0xselffunded"),
    guardians: async () => [],
  });

  expect(await executor.execute({ userAddress: USER, privateKeyHex: PRIVATE_KEY, calls: CALLS, intentIds: ["i1"] })).toEqual({
    transactionHash: "0xselffunded",
  });
});

test("declining leaves the transaction unsent", async () => {
  const consent = createSelfFundConsent(async () => ({ feeRaw: 1n, unit: "FRI", balanceRaw: null }));
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
    executor.execute({ userAddress: USER, privateKeyHex: PRIVATE_KEY, calls: CALLS, intentIds: ["i1"] }),
  ).rejects.toBeInstanceOf(UserFacingError);
});

test("a refused transaction is never offered for self-funding", async () => {
  let asked = 0;
  const consent = createSelfFundConsent(async () => ({ feeRaw: 1n, unit: "FRI", balanceRaw: null }));
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
    executor.execute({ userAddress: USER, privateKeyHex: PRIVATE_KEY, calls: CALLS, intentIds: ["i1"] }),
  ).rejects.toBeInstanceOf(UserFacingError);
  expect(asked).toBe(0);
});

test("the executor sends intent ids to sponsorship", async () => {
  const bodies: unknown[] = [];
  const fetchImpl = (async (url: string, init: RequestInit) => {
    bodies.push(JSON.parse(String(init.body)));
    return String(url).endsWith("/build")
      ? new Response(JSON.stringify({ typedData: TYPED_DATA }), { status: 200 })
      : new Response(JSON.stringify({ transactionHash: "0xsponsored" }), { status: 200 });
  }) as unknown as typeof fetch;
  const executor = sponsoredExecutor({ provider, proxyUrl: "/p", fetchImpl, fallback: never, consent: createSelfFundConsent(async () => ({ feeRaw: "1", unit: "FRI" }) as never) });
  const result = await executor.execute({ userAddress: USER, privateKeyHex: PRIVATE_KEY, calls: CALLS, intentIds: ["i9"] });
  expect(result.transactionHash).toBe("0xsponsored");
  expect(bodies[0]).toEqual({ intentIds: ["i9"] });
});

test("a transaction with no intent ids is never sent to the sponsor and goes straight to the user", async () => {
  let fetched = false;
  const fetchImpl = (async () => { fetched = true; return new Response("{}"); }) as unknown as typeof fetch;
  const asked: unknown[] = [];
  const consent = { request: async (p: unknown) => { asked.push(p); return true; } };
  const executor = sponsoredExecutor({ provider, proxyUrl: "/p", fetchImpl, fallback: fallbackTo("0xself"), consent: consent as never });
  const result = await executor.execute({ userAddress: USER, privateKeyHex: PRIVATE_KEY, calls: CALLS });
  expect(result.transactionHash).toBe("0xself");
  expect(fetched).toBe(false);
  expect(asked).toHaveLength(1);
});

const unavailable = () => fetchStub({ build: new Response(JSON.stringify({ error: "down", code: "sponsor_unavailable" }), { status: 503 }) });

test("an unavailable sponsor never offers self-funding to a wallet with a guardian", async () => {
  const asked: unknown[] = [];
  const consent = { request: async (p: unknown) => { asked.push(p); return true; } };
  const executor = sponsoredExecutor({ provider, proxyUrl: "/p", fetchImpl: unavailable(), fallback: never, consent: consent as never, guardians: async () => [{}] });
  const err = await executor.execute({ userAddress: USER, privateKeyHex: PRIVATE_KEY, calls: CALLS, intentIds: ["i1"] }).catch((e: unknown) => e);
  expect(err).toBeInstanceOf(UserFacingError);
  expect((err as UserFacingError).message).toBe(GUARDIAN_WALLET_BUSY);
  expect((err as UserFacingError).retryable).toBe(true);
  expect(asked).toHaveLength(0);
});

test("a call with no intent ids is not offered self-funding when the wallet has a guardian", async () => {
  const asked: unknown[] = [];
  const consent = { request: async (p: unknown) => { asked.push(p); return true; } };
  const executor = sponsoredExecutor({ provider, proxyUrl: "/p", fallback: never, consent: consent as never, guardians: async () => [{}] });
  const err = await executor.execute({ userAddress: USER, privateKeyHex: PRIVATE_KEY, calls: CALLS }).catch((e: unknown) => e);
  expect(err).toBeInstanceOf(UserFacingError);
  expect((err as UserFacingError).message).toBe(GUARDIAN_WALLET_BUSY);
  expect(asked).toHaveLength(0);
});

test("guardian read failure keeps today's fallback", async () => {
  const asked: unknown[] = [];
  const consent = { request: async (p: unknown) => { asked.push(p); return true; } };
  const executor = sponsoredExecutor({
    provider,
    proxyUrl: "/p",
    fetchImpl: unavailable(),
    fallback: fallbackTo("0xself"),
    consent: consent as never,
    guardians: async () => { throw new Error("rpc down"); },
  });
  expect((await executor.execute({ userAddress: USER, privateKeyHex: PRIVATE_KEY, calls: CALLS, intentIds: ["i1"] })).transactionHash).toBe("0xself");
  expect(asked).toHaveLength(1);
});
