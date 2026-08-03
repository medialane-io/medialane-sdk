import { test, expect, mock, afterEach } from "bun:test";
import { ApiClient } from "./client.js";

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

interface Captured { url: string; init: RequestInit }

function scriptFetch(script: (url: string) => { status: number; body?: unknown }) {
  const captured: Captured[] = [];
  globalThis.fetch = mock(async (input: unknown, init?: RequestInit) => {
    const url = String(input);
    captured.push({ url, init: init ?? {} });
    const { status, body } = script(url);
    return new Response(body === undefined ? "" : JSON.stringify(body), { status });
  }) as unknown as typeof fetch;
  return captured;
}

test("getWalletActivity GETs /v1/wallet-activity with the address query param — no signature required", async () => {
  const calls = scriptFetch(() => ({
    status: 200,
    body: { data: [{ id: "a1", chain: "STARKNET", accountAddress: "0x1", type: "SEND", txHash: "0xtx", blockNumber: "175", timestamp: "2026-08-01T00:00:00.000Z", tokenAddress: "0xtoken", amount: "100", counterparty: "0xother", tokenInAddress: null, amountIn: null, tokenOutAddress: null, amountOut: null }] },
  }));
  const client = new ApiClient("https://api.test.invalid", "test-key");
  const res = await client.getWalletActivity("0x1");
  expect(calls[0].url).toBe(
    "https://api.test.invalid/v1/wallet-activity?address=0x0000000000000000000000000000000000000000000000000000000000000001&chain=STARKNET",
  );
  const headers = calls[0].init.headers as Record<string, string>;
  expect(headers["Authorization"]).toBeUndefined();
  expect(headers["x-api-key"]).toBe("test-key");
  expect(res.data[0].blockNumber).toBe("175");
});

test("getWalletActivity normalizes the address for the client's chain", async () => {
  const calls = scriptFetch(() => ({ status: 200, body: { data: [] } }));
  const client = new ApiClient("https://api.test.invalid", "test-key");
  await client.getWalletActivity("0x1");
  expect(calls[0].url).toContain("address=0x0000000000000000000000000000000000000000000000000000000000000001");
});
