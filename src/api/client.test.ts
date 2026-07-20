import { test, expect, mock, afterEach } from "bun:test";
import { ApiClient, MedialaneApiError } from "./client.js";

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

interface Captured { url: string; init: RequestInit }

/** Mock fetch that records each call and returns a scripted status/body. */
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

test("allow404 read returns null instead of throwing", async () => {
  scriptFetch(() => ({ status: 404, body: { error: "not found" } }));
  const c = new ApiClient("https://api.test", "ml_live_x");
  expect(await c.getCollectionProfile("0x1")).toBeNull();
});

test("allow403 read returns null (gated-content non-holder)", async () => {
  scriptFetch(() => ({ status: 403, body: { error: "not a holder" } }));
  const c = new ApiClient("https://api.test", "ml_live_x");
  expect(await c.getGatedContent("0x1", "clerk_tok")).toBeNull();
});

test("a non-allowlisted error still throws MedialaneApiError", async () => {
  scriptFetch(() => ({ status: 400, body: { error: "bad input" } }));
  const c = new ApiClient("https://api.test", "ml_live_x");
  await expect(c.getCollectionProfile("0x1")).rejects.toBeInstanceOf(MedialaneApiError);
});

test("Clerk-authed methods send both x-api-key and Authorization through the unified path", async () => {
  const calls = scriptFetch(() => ({ status: 200, body: { ok: true } }));
  const c = new ApiClient("https://api.test", "ml_live_x");
  await c.updateCreatorProfile("0x1", { displayName: "Ada" } as never, "clerk_tok");
  const headers = calls[0].init.headers as Record<string, string>;
  expect(headers["x-api-key"]).toBe("ml_live_x");
  expect(headers["Authorization"]).toBe("Bearer clerk_tok");
  expect(calls[0].init.method).toBe("PATCH");
});

test("5xx reads are retried (unified retry parity for profile reads)", async () => {
  let n = 0;
  scriptFetch(() => {
    n++;
    return n < 3 ? { status: 503, body: { error: "unavailable" } } : { status: 200, body: { ok: true } };
  });
  const c = new ApiClient("https://api.test", "ml_live_x", { baseDelayMs: 1, maxDelayMs: 2 });
  const out = await c.getCollectionProfile("0x1");
  expect(out).toEqual({ ok: true } as never);
  expect(n).toBe(3); // two 503s retried, third succeeds
});
