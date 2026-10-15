import { test, expect, afterEach } from "bun:test";
import { ApiClient } from "./client.js";

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

function capture(response: unknown = { data: {} }) {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  globalThis.fetch = (async (url: string, init: RequestInit = {}) => {
    calls.push({ url: String(url), init });
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }) as unknown as typeof fetch;
  return calls;
}

function client() {
  return new ApiClient("https://api.test");
}

test("portal routes send no wallet token; the session identifies the account", async () => {
  const calls = capture({ data: { id: "c1", accountId: "a1", status: "ACTIVE", creditBalance: 12 } });
  await client().getMe();
  expect(calls[0].url).toBe("https://api.test/v1/portal/me");
  const headers = (calls[0].init.headers ?? {}) as Record<string, string>;
  expect(headers.Authorization).toBeUndefined();
});

test("credit history and spend read from the routes the backend serves", async () => {
  const calls = capture({ data: [] });
  const api = client();
  await api.getCreditHistory();
  await api.getSpend();
  expect(calls.map((c) => c.url)).toEqual([
    "https://api.test/v1/portal/credits/history",
    "https://api.test/v1/portal/credits/spend",
  ]);
});

test("a deposit is checked by its transaction", async () => {
  const calls = capture({ data: { deposits: 1 } });
  await client().checkDeposit("0xabc");
  expect(calls[0].url).toBe("https://api.test/v1/portal/credits/check");
  expect(calls[0].init.method).toBe("POST");
  expect(JSON.parse(String(calls[0].init.body))).toEqual({ txHash: "0xabc" });
});

test("key changes send the wallet's confirmation in the body and no token", async () => {
  const calls = capture({ data: {} });
  const api = client();
  const confirmation = { expiresAt: 1_700_000_300, signature: ["0x1", "0x2"] };
  await api.createApiKey({ label: "server" }, confirmation);
  await api.deleteApiKey("key-1", confirmation);
  expect(calls[0].url).toBe("https://api.test/v1/portal/keys");
  expect(JSON.parse(String(calls[0].init.body))).toEqual({ label: "server", confirmation });
  expect(calls[1].url).toBe("https://api.test/v1/portal/keys/key-1");
  expect(calls[1].init.method).toBe("DELETE");
  expect(JSON.parse(String(calls[1].init.body))).toEqual({ confirmation });
  for (const call of calls) {
    const headers = (call.init.headers ?? {}) as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
    expect(headers["x-fresh-signature"]).toBeUndefined();
  }
});
