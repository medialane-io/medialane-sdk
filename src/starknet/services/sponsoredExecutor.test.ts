import { test, expect, mock } from "bun:test";
import type { TypedData } from "starknet";
import { executeSponsored, SponsoredCallRejectedError, allowsFallbackFunding, type TypedDataSigner } from "./sponsoredExecutor.js";

const FAKE_TYPED_DATA = {
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
} satisfies TypedData;

function fakeSigner(address = "0xdeadbeef"): TypedDataSigner {
  return { address, signTypedData: async () => ["0xr", "0xs"] };
}

test("executeSponsored calls build then execute and returns sponsored + tx hash", async () => {
  const calls: { url: string; body: { userAddress?: string; signature?: string[] } }[] = [];
  const fetchImpl = mock(async (url: string, init?: RequestInit) => {
    const body = JSON.parse(init!.body as string);
    calls.push({ url, body });
    if (url === "/api/wallet/sponsored-invoke/build") {
      return new Response(JSON.stringify({ typedData: FAKE_TYPED_DATA }), { status: 200 });
    }
    if (url === "/api/wallet/sponsored-invoke/execute") {
      return new Response(JSON.stringify({ transactionHash: "0xtxhash" }), { status: 200 });
    }
    throw new Error(`Unexpected fetch to ${url}`);
  }) as unknown as typeof fetch;

  const result = await executeSponsored(
    { proxyUrl: "/api/wallet/sponsored-invoke", fetchImpl },
    fakeSigner(),
    { intentIds: ["i1"] },
  );

  expect(result).toEqual({ status: "sponsored", transactionHash: "0xtxhash" });
  expect(calls[0].url).toBe("/api/wallet/sponsored-invoke/build");
  expect((calls[0].body as { intentIds?: string[] }).intentIds).toEqual(["i1"]);
  expect(calls[1].url).toBe("/api/wallet/sponsored-invoke/execute");
  expect(calls[1].body.signature).toEqual(["0xr", "0xs"]);
});

for (const status of [500, 502, 503]) {
  test(`executeSponsored returns unavailable when the sponsor cannot build (${status})`, async () => {
    const fetchImpl = mock(async () =>
      new Response(JSON.stringify({ error: "boom" }), { status })) as unknown as typeof fetch;

    const result = await executeSponsored(
      { proxyUrl: "/api/wallet/sponsored-invoke", fetchImpl },
      fakeSigner(),
      { intentIds: ["i1"] },
    );

    expect(result).toEqual({ status: "unavailable", reason: "boom" });
  });
}

for (const status of [400, 401, 403, 429]) {
  test(`executeSponsored throws SponsoredCallRejectedError when build refuses the call (${status}), so nobody is asked to pay`, async () => {
    const fetchImpl = mock(async () =>
      new Response(JSON.stringify({ error: "refused" }), { status })) as unknown as typeof fetch;

    await expect(
      executeSponsored(
        { proxyUrl: "/api/wallet/sponsored-invoke", fetchImpl },
        fakeSigner(),
        { intentIds: ["i1"] },
      ),
    ).rejects.toBeInstanceOf(SponsoredCallRejectedError);
  });
}

test("executeSponsored returns unavailable on a 503 from execute — the sponsor is down and nothing broadcast", async () => {
  const fetchImpl = mock(async (url: string) => {
    if (url === "/api/wallet/sponsored-invoke/build") {
      return new Response(JSON.stringify({ typedData: FAKE_TYPED_DATA }), { status: 200 });
    }
    return new Response(JSON.stringify({ error: "boom" }), { status: 503 });
  }) as unknown as typeof fetch;

  const result = await executeSponsored(
    { proxyUrl: "/api/wallet/sponsored-invoke", fetchImpl },
    fakeSigner(),
    { intentIds: ["i1"] },
  );

  expect(result).toEqual({ status: "unavailable", reason: "boom" });
});

for (const status of [400, 403, 422, 429, 502]) {
  test(`executeSponsored throws SponsoredCallRejectedError on a ${status} from execute`, async () => {
    const fetchImpl = mock(async (url: string) => {
      if (url === "/api/wallet/sponsored-invoke/build") {
        return new Response(JSON.stringify({ typedData: FAKE_TYPED_DATA }), { status: 200 });
      }
      return new Response(JSON.stringify({ error: "boom" }), { status });
    }) as unknown as typeof fetch;

    await expect(
      executeSponsored(
        { proxyUrl: "/api/wallet/sponsored-invoke", fetchImpl },
        fakeSigner(),
        { intentIds: ["i1"] },
      ),
    ).rejects.toBeInstanceOf(SponsoredCallRejectedError);
  });
}

test("executeSponsored falls back to a generic reason when the response has no error field", async () => {
  const fetchImpl = mock(async () => new Response("not json", { status: 502 })) as unknown as typeof fetch;

  const result = await executeSponsored(
    { proxyUrl: "/api/wallet/sponsored-invoke", fetchImpl },
    fakeSigner(),
    { intentIds: ["i1"] },
  );

  expect(result.status).toBe("unavailable");
  if (result.status === "unavailable") expect(result.reason.length).toBeGreaterThan(0);
});

test("the failure code decides whether the user can self-fund", () => {
  expect(allowsFallbackFunding("sponsor_unavailable", 502, "build")).toBe(true);
  expect(allowsFallbackFunding("credits_exhausted", 402, "build")).toBe(true);
  expect(allowsFallbackFunding("credits_exhausted", 402, "execute")).toBe(true);
  for (const code of ["not_authorized", "rate_limited", "invalid_request", "account_not_deployed", "not_executable", "may_have_broadcast"]) {
    expect(allowsFallbackFunding(code, 502, "build")).toBe(false);
    expect(allowsFallbackFunding(code, 503, "execute")).toBe(false);
  }
});

test("a response without a code keeps the status rules", () => {
  expect(allowsFallbackFunding(undefined, 502, "build")).toBe(true);
  expect(allowsFallbackFunding(undefined, 403, "build")).toBe(false);
  expect(allowsFallbackFunding(undefined, 503, "execute")).toBe(true);
  expect(allowsFallbackFunding(undefined, 502, "execute")).toBe(false);
});

test("exhausted credits at build offer self-funding", async () => {
  const fetchImpl = mock(async () =>
    new Response(JSON.stringify({ x402Version: 1, accepts: [], code: "credits_exhausted" }), { status: 402 })) as unknown as typeof fetch;

  const result = await executeSponsored(
    { proxyUrl: "/api/wallet/sponsored-invoke", fetchImpl },
    fakeSigner(),
    { intentIds: ["i1"] },
  );

  expect(result.status).toBe("unavailable");
});

test("an execute that may have broadcast is never offered for self-funding", async () => {
  const fetchImpl = mock(async (url: string) => {
    if (url === "/api/wallet/sponsored-invoke/build") {
      return new Response(JSON.stringify({ typedData: FAKE_TYPED_DATA }), { status: 200 });
    }
    return new Response(JSON.stringify({ error: "maybe sent", code: "may_have_broadcast" }), { status: 502 });
  }) as unknown as typeof fetch;

  await expect(
    executeSponsored(
      { proxyUrl: "/api/wallet/sponsored-invoke", fetchImpl },
      fakeSigner(),
      { intentIds: ["i1"] },
    ),
  ).rejects.toBeInstanceOf(SponsoredCallRejectedError);
});

test("with intent ids, build and execute send only the ids", async () => {
  const bodies: unknown[] = [];
  const fetchImpl = (async (_url: string, init: RequestInit) => {
    bodies.push(JSON.parse(String(init.body)));
    return bodies.length === 1
      ? new Response(JSON.stringify({ typedData: { t: 1 } }), { status: 200 })
      : new Response(JSON.stringify({ transactionHash: "0xtx" }), { status: 200 });
  }) as unknown as typeof fetch;
  const signer: TypedDataSigner = { address: "0x1", signTypedData: async () => ["0xs"] };
  const result = await executeSponsored({ proxyUrl: "/p", fetchImpl }, signer, { intentIds: ["i1"] });
  expect(result).toEqual({ status: "sponsored", transactionHash: "0xtx" });
  expect(bodies).toEqual([{ intentIds: ["i1"] }, { intentIds: ["i1"], typedData: { t: 1 }, signature: ["0xs"] }]);
});

test("extra headers are sent on both requests", async () => {
  const seen: Headers[] = [];
  const fetchImpl = (async (_url: string, init: RequestInit) => {
    seen.push(new Headers(init.headers));
    return new Response(JSON.stringify(seen.length === 1 ? { typedData: {} } : { transactionHash: "0x1" }), { status: 200 });
  }) as unknown as typeof fetch;
  await executeSponsored({ proxyUrl: "/p", fetchImpl, headers: { authorization: "Bearer t" } }, { address: "0x1", signTypedData: async () => [] }, { intentIds: ["i1"] });
  expect(seen.map((h) => h.get("authorization"))).toEqual(["Bearer t", "Bearer t"]);
});

test("a launchpad-run step is sponsored by the wallet address, with no calls in either body", async () => {
  const bodies: unknown[] = [];
  const fetchImpl = (async (url: string, init: RequestInit) => {
    bodies.push(JSON.parse(String(init.body)));
    return String(url).endsWith("/build")
      ? new Response(JSON.stringify({ typedData: { t: 1 } }), { status: 200 })
      : new Response(JSON.stringify({ transactionHash: "0xh" }), { status: 200 });
  }) as unknown as typeof fetch;
  const signer = { address: "0xa", signTypedData: async () => ["0xs"] };
  const result = await executeSponsored({ proxyUrl: "/runs/1/collection", fetchImpl }, signer, { userAddress: "0xa" });
  expect(result).toEqual({ status: "sponsored", transactionHash: "0xh" });
  expect(bodies).toEqual([{ userAddress: "0xa" }, { userAddress: "0xa", typedData: { t: 1 }, signature: ["0xs"] }]);
});
