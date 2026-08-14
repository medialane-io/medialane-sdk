import { test, expect, mock, afterEach } from "bun:test";
import { ApiClient, MedialaneApiError } from "./client.js";

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

test("allow404 read returns null instead of throwing", async () => {
  scriptFetch(() => ({ status: 404, body: { error: "not found" } }));
  const c = new ApiClient("https://api.test", "ml_live_x");
  expect(await c.getCollectionProfile("0x1")).toBeNull();
});

test("allow403 read returns null (gated-content non-holder)", async () => {
  scriptFetch(() => ({ status: 403, body: { error: "not a holder" } }));
  const c = new ApiClient("https://api.test", "ml_live_x");
  expect(await c.getGatedContent("0x1", "siws_tok")).toBeNull();
});

test("a non-allowlisted error still throws MedialaneApiError", async () => {
  scriptFetch(() => ({ status: 400, body: { error: "bad input" } }));
  const c = new ApiClient("https://api.test", "ml_live_x");
  await expect(c.getCollectionProfile("0x1")).rejects.toBeInstanceOf(MedialaneApiError);
});

test("SIWS-authed methods send both x-api-key and Authorization through the unified path", async () => {
  const calls = scriptFetch(() => ({ status: 200, body: { ok: true } }));
  const c = new ApiClient("https://api.test", "ml_live_x");
  await c.updateCreatorProfile("0x1", { displayName: "Ada" } as never, "siws_tok");
  const headers = calls[0].init.headers as Record<string, string>;
  expect(headers["x-api-key"]).toBe("ml_live_x");
  expect(headers["Authorization"]).toBe("Bearer siws_tok");
  expect(calls[0].init.method).toBe("PATCH");
});

test("upsertMyWallet forwards emailVerificationToken in the request body when provided", async () => {
  const calls = scriptFetch(() => ({ status: 200, body: { walletAddress: "0x1" } }));
  const c = new ApiClient("https://api.test", "ml_live_x");
  await c.upsertMyWallet("siws_tok", { emailVerificationToken: "email_verified_abc.def" });
  const body = JSON.parse(String(calls[0].init.body));
  expect(body.emailVerificationToken).toBe("email_verified_abc.def");
});

test("upsertMyWallet omits emailVerificationToken from the body when not provided", async () => {
  const calls = scriptFetch(() => ({ status: 200, body: { walletAddress: "0x1" } }));
  const c = new ApiClient("https://api.test", "ml_live_x");
  await c.upsertMyWallet("siws_tok", {});
  const body = JSON.parse(String(calls[0].init.body));
  expect(body.emailVerificationToken).toBeUndefined();
});

test("upsertMyWallet forwards a plain email in the request body when provided", async () => {
  const calls = scriptFetch(() => ({ status: 200, body: { walletAddress: "0x1" } }));
  const c = new ApiClient("https://api.test", "ml_live_x");
  await c.upsertMyWallet("siws_tok", { email: "alice@example.com" });
  const body = JSON.parse(String(calls[0].init.body));
  expect(body.email).toBe("alice@example.com");
});

test("upsertMyWallet forwards accountToken in the request body when provided", async () => {
  const calls = scriptFetch(() => ({ status: 200, body: { walletAddress: "0x1" } }));
  const c = new ApiClient("https://api.test", "ml_live_x");
  await c.upsertMyWallet("siws_tok", { accountToken: "account_session_abc.def" });
  const body = JSON.parse(String(calls[0].init.body));
  expect(body.accountToken).toBe("account_session_abc.def");
});

test("checkEmailExists returns true when the backend reports exists:true", async () => {
  scriptFetch(() => ({ status: 200, body: { exists: true } }));
  const c = new ApiClient("https://api.test", "ml_live_x");
  expect(await c.checkEmailExists("alice@example.com")).toBe(true);
});

test("checkEmailExists returns false when the backend reports exists:false", async () => {
  scriptFetch(() => ({ status: 200, body: { exists: false } }));
  const c = new ApiClient("https://api.test", "ml_live_x");
  expect(await c.checkEmailExists("alice@example.com")).toBe(false);
});

test("checkEmailExists sends the email as a query param", async () => {
  const calls = scriptFetch(() => ({ status: 200, body: { exists: false } }));
  const c = new ApiClient("https://api.test", "ml_live_x");
  await c.checkEmailExists("alice@example.com");
  expect(calls[0].url).toContain("/v1/auth/email/exists?email=alice%40example.com");
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
  expect(n).toBe(3);
});
