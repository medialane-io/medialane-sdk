import { test, expect } from "bun:test";
import { hash, num, type ProviderInterface } from "starknet";
import { ACTION_PROBLEM, UserFacingError } from "../errors.js";
import { createSelfFundConsent } from "./self-fund-consent.js";
import { sponsoredExecutor } from "./executors.js";
import { CREDITS_EXHAUSTED } from "./cosigned-self-pay.js";
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
  message: { value: "1", Calls: CALLS.map((c) => ({ To: c.contractAddress, Selector: num.toHex(hash.getSelectorFromName(c.entrypoint)), Calldata: c.calldata })) },
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
    owners: async () => [{}],
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

const unavailable = (code = "sponsor_unavailable", status = 503) =>
  fetchStub({ build: new Response(JSON.stringify({ error: "down", code }), { status }) });
const agreeing = () => {
  const asked: unknown[] = [];
  return { asked, consent: { request: async (p: unknown) => { asked.push(p); return true; } } as never };
};
const guarded = async () => [{}];
const unguardedOneOwner = { guardians: async () => [], owners: async () => [{}] };
const input = { userAddress: USER, privateKeyHex: PRIVATE_KEY, calls: CALLS, intentIds: ["i1"] };

test("an unavailable sponsor asks a wallet with a guardian to pay, then uses the guardian-signed path", async () => {
  const { asked, consent } = agreeing();
  const executor = sponsoredExecutor({ provider, proxyUrl: "/p", fetchImpl: unavailable(), fallback: never, cosignedFallback: fallbackTo("0xguarded"), consent, guardians: guarded });
  expect(await executor.execute(input)).toEqual({ transactionHash: "0xguarded" });
  expect(asked).toHaveLength(1);
});

test("a wallet with a guardian that declines sends nothing and sees why sponsorship failed", async () => {
  const executor = sponsoredExecutor({ provider, proxyUrl: "/p", fetchImpl: unavailable(), fallback: never, cosignedFallback: never, consent: { request: async () => false } as never, guardians: guarded });
  const err = await executor.execute(input).catch((e: unknown) => e);
  expect(err).toBeInstanceOf(UserFacingError);
  expect((err as UserFacingError).message).toBe("down");
});

test("a wallet with several owners and no guardian also needs the backend to sign", async () => {
  const { consent } = agreeing();
  const executor = sponsoredExecutor({
    provider, proxyUrl: "/p", fetchImpl: unavailable(), fallback: never, cosignedFallback: fallbackTo("0xcosigned"), consent,
    guardians: async () => [], owners: async () => [{}, {}],
  });
  expect((await executor.execute(input)).transactionHash).toBe("0xcosigned");
});

test("when the guardian cannot be read, the guardian-signed path is used", async () => {
  const { consent } = agreeing();
  const executor = sponsoredExecutor({
    provider, proxyUrl: "/p", fetchImpl: unavailable(), fallback: never, cosignedFallback: fallbackTo("0xguarded"), consent,
    guardians: async () => { throw new Error("rpc down"); },
  });
  expect((await executor.execute(input)).transactionHash).toBe("0xguarded");
});

test("without credits a wallet with a guardian is told so instead of being asked to pay", async () => {
  const { asked, consent } = agreeing();
  const executor = sponsoredExecutor({ provider, proxyUrl: "/p", fetchImpl: unavailable("credits_exhausted", 402), fallback: never, cosignedFallback: never, consent, guardians: guarded });
  const err = await executor.execute(input).catch((e: unknown) => e);
  expect((err as UserFacingError).message).toBe(CREDITS_EXHAUSTED);
  expect(asked).toHaveLength(0);
});

test("without credits a wallet without a guardian can still pay for itself", async () => {
  const { consent } = agreeing();
  const executor = sponsoredExecutor({ provider, proxyUrl: "/p", fetchImpl: unavailable("credits_exhausted", 402), fallback: fallbackTo("0xself"), cosignedFallback: never, consent, ...unguardedOneOwner });
  expect((await executor.execute(input)).transactionHash).toBe("0xself");
});

test("a call with no intent ids cannot get a guardian signature, so a guarded wallet is not asked to pay", async () => {
  const { asked, consent } = agreeing();
  const executor = sponsoredExecutor({ provider, proxyUrl: "/p", fallback: never, cosignedFallback: never, consent, guardians: guarded });
  const err = await executor.execute({ userAddress: USER, privateKeyHex: PRIVATE_KEY, calls: CALLS }).catch((e: unknown) => e);
  expect((err as UserFacingError).message).toBe(ACTION_PROBLEM);
  expect(asked).toHaveLength(0);
});

test("a call with no intent ids still pays directly when the guardian cannot be read", async () => {
  const { consent } = agreeing();
  const executor = sponsoredExecutor({
    provider, proxyUrl: "/p", fallback: fallbackTo("0xself"), cosignedFallback: never, consent,
    guardians: async () => { throw new Error("rpc down"); },
  });
  expect((await executor.execute({ userAddress: USER, privateKeyHex: PRIVATE_KEY, calls: CALLS })).transactionHash).toBe("0xself");
});

test("a mismatched sponsor answer is not paid for by the user", async () => {
  let asked = 0;
  const consent = createSelfFundConsent(async () => ({ feeRaw: 1n, unit: "FRI", balanceRaw: null }));
  consent.registerHandler(async () => {
    asked += 1;
    return true;
  });
  const other = { ...TYPED_DATA, message: { value: "1", Calls: [{ To: "0x9", Selector: "0x1", Calldata: [] }] } };
  const executor = sponsoredExecutor({
    provider,
    proxyUrl: "/api/wallet/sponsored-invoke",
    consent,
    fetchImpl: fetchStub({ build: new Response(JSON.stringify({ typedData: other }), { status: 200 }) }),
    fallback: never,
    guardians: async () => [],
  });
  await expect(executor.execute({ userAddress: USER, privateKeyHex: PRIVATE_KEY, calls: CALLS, intentIds: ["i1"] })).rejects.toThrow();
  expect(asked).toBe(0);
});
