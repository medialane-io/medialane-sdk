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

test("an account's own records are read as the wallet that signed, not as the key", async () => {
  const calls = capture({ data: { id: "c1", accountId: "a1", plan: "FREE", status: "ACTIVE", creditBalance: 12 } });
  await client().getMe("siws-token");
  expect(calls[0].url).toBe("https://api.test/v1/portal/me");
  expect((calls[0].init.headers as Record<string, string>).Authorization).toBe("Bearer siws-token");
});

test("without a token the key still decides whose account it is", async () => {
  const calls = capture();
  await client().getMe();
  const headers = (calls[0].init.headers ?? {}) as Record<string, string>;
  expect(headers.Authorization).toBeUndefined();
});

test("credit history and spend read from the routes the backend serves", async () => {
  const calls = capture({ data: [] });
  const api = client();
  await api.getCreditHistory("t");
  await api.getSpend("t");
  expect(calls.map((c) => c.url)).toEqual([
    "https://api.test/v1/portal/credits/history",
    "https://api.test/v1/portal/credits/spend",
  ]);
});

test("a deposit is checked by its transaction", async () => {
  const calls = capture({ data: { deposits: 1 } });
  await client().checkDeposit("0xabc", "t");
  expect(calls[0].url).toBe("https://api.test/v1/portal/credits/check");
  expect(calls[0].init.method).toBe("POST");
  expect(JSON.parse(String(calls[0].init.body))).toEqual({ txHash: "0xabc" });
});

test("keys are created and revoked as the signed-in wallet", async () => {
  const calls = capture({ data: {} });
  const api = client();
  await api.createApiKey({ appSource: "MEDIALANE_PORTAL" }, "t");
  await api.deleteApiKey("key-1", "t");
  expect(calls[0].url).toBe("https://api.test/v1/portal/keys");
  expect(JSON.parse(String(calls[0].init.body))).toEqual({ appSource: "MEDIALANE_PORTAL" });
  expect(calls[1].url).toBe("https://api.test/v1/portal/keys/key-1");
  expect(calls[1].init.method).toBe("DELETE");
});
