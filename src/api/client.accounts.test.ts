import { test, expect, mock, afterEach } from "bun:test";
import { ApiClient } from "./client.js";

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

test("accounts.list GETs /v1/accounts with search, type of work and paging", async () => {
  const urls: string[] = [];
  globalThis.fetch = mock(async (input: unknown) => {
    urls.push(String(input));
    return new Response(JSON.stringify({ data: [{ address: "0x1", image: "ipfs://a", ipType: "Art" }], meta: { page: 2, limit: 10, total: 11 } }), { status: 200 });
  }) as unknown as typeof fetch;
  const client = new ApiClient({ baseUrl: "https://api.test.invalid", apiKey: "test-key" });

  const res = await client.accounts.list({ search: "0xab", ipType: "art", page: 2, limit: 10 });

  expect(urls).toEqual(["https://api.test.invalid/v1/accounts?search=0xab&ipType=art&page=2&limit=10"]);
  expect(res.data[0]).toEqual({ address: "0x1", image: "ipfs://a", ipType: "Art" });
  expect(res.meta?.total).toBe(11);
});
