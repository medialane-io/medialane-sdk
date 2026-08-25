import { test, expect, mock } from "bun:test";
import type { TypedData } from "starknet";
import { executeSponsored, SponsoredCallRejectedError, type TypedDataSigner } from "./sponsoredExecutor.js";

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
    [{ contractAddress: "0x1", entrypoint: "foo", calldata: [] }],
  );

  expect(result).toEqual({ status: "sponsored", transactionHash: "0xtxhash" });
  expect(calls[0].url).toBe("/api/wallet/sponsored-invoke/build");
  expect(calls[0].body.userAddress).toBe("0xdeadbeef");
  expect(calls[1].url).toBe("/api/wallet/sponsored-invoke/execute");
  expect(calls[1].body.signature).toEqual(["0xr", "0xs"]);
});

test("executeSponsored returns unavailable on ANY build failure", async () => {
  const fetchImpl = mock(async () =>
    new Response(JSON.stringify({ error: "boom" }), { status: 502 })) as unknown as typeof fetch;

  const result = await executeSponsored(
    { proxyUrl: "/api/wallet/sponsored-invoke", fetchImpl },
    fakeSigner(),
    [{ contractAddress: "0x1", entrypoint: "foo", calldata: [] }],
  );

  expect(result).toEqual({ status: "unavailable", reason: "boom" });
});

for (const status of [400, 429, 503]) {
  test(`executeSponsored returns unavailable on a ${status} from execute — nothing could have broadcast`, async () => {
    const fetchImpl = mock(async (url: string) => {
      if (url === "/api/wallet/sponsored-invoke/build") {
        return new Response(JSON.stringify({ typedData: FAKE_TYPED_DATA }), { status: 200 });
      }
      return new Response(JSON.stringify({ error: "boom" }), { status });
    }) as unknown as typeof fetch;

    const result = await executeSponsored(
      { proxyUrl: "/api/wallet/sponsored-invoke", fetchImpl },
      fakeSigner(),
      [{ contractAddress: "0x1", entrypoint: "foo", calldata: [] }],
    );

    expect(result).toEqual({ status: "unavailable", reason: "boom" });
  });
}

for (const status of [422, 502]) {
  test(`executeSponsored throws SponsoredCallRejectedError on a ${status} from execute — may have already broadcast, or the call itself is broken`, async () => {
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
        [{ contractAddress: "0x1", entrypoint: "foo", calldata: [] }],
      ),
    ).rejects.toBeInstanceOf(SponsoredCallRejectedError);
  });
}

test("executeSponsored falls back to a generic reason when the response has no error field", async () => {
  const fetchImpl = mock(async () => new Response("not json", { status: 502 })) as unknown as typeof fetch;

  const result = await executeSponsored(
    { proxyUrl: "/api/wallet/sponsored-invoke", fetchImpl },
    fakeSigner(),
    [{ contractAddress: "0x1", entrypoint: "foo", calldata: [] }],
  );

  expect(result.status).toBe("unavailable");
  if (result.status === "unavailable") expect(result.reason.length).toBeGreaterThan(0);
});
