import { test, expect, mock, afterEach } from "bun:test";
import { ApiClient } from "./client.js";

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

function mockFetch(calls: string[]) {
  globalThis.fetch = mock(async (input: unknown) => {
    calls.push(String(input));
    return new Response(JSON.stringify({ data: [], meta: { page: 1, limit: 24, total: 0 } }), { status: 200 });
  }) as unknown as typeof fetch;
}

test("getCoins builds /v1/coins with service + paging", async () => {
  const calls: string[] = [];
  mockFetch(calls);
  const c = new ApiClient("https://api.test", "ml_live_x");
  await c.getCoins({ service: "creator-coin", page: 2, limit: 10 });
  expect(calls[0]).toContain("/v1/coins");
  expect(calls[0]).toContain("service=creator-coin");
  expect(calls[0]).toContain("page=2");
  expect(calls[0]).toContain("limit=10");
});

test("getCoin normalizes the address into /v1/coins/:contract", async () => {
  const calls: string[] = [];
  mockFetch(calls);
  const c = new ApiClient("https://api.test", "ml_live_x");
  await c.getCoin("0x1");
  expect(calls[0]).toContain("/v1/coins/0x" + "0".repeat(63) + "1");
});
