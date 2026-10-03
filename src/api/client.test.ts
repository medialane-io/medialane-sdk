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

const client = () => new ApiClient("https://api.test", "ml_live_x");

test("checkEmail returns whether the email exists", async () => {
  const calls = scriptFetch(() => ({ status: 200, body: { exists: true } }));
  expect(await client().checkEmail("alice@example.com")).toEqual({ exists: true });
  expect(calls[0].url).toContain("/v1/auth/email/exists?email=alice%40example.com");
});

test("checkEmailExists is gone", () => {
  expect("checkEmailExists" in client()).toBe(false);
});

test("requestEmailCode posts the email", async () => {
  const calls = scriptFetch(() => ({ status: 200, body: { ok: true } }));
  await client().requestEmailCode("alice@example.com");
  expect(calls[0].url).toContain("/v1/auth/email/request-code");
  expect(JSON.parse(calls[0].init.body as string)).toEqual({ email: "alice@example.com" });
});

test("registerEmailAccount posts the email", async () => {
  const calls = scriptFetch(() => ({ status: 200, body: {} }));
  await client().registerEmailAccount("alice@example.com");
  expect(calls[0].url).toContain("/v1/auth/email/register-account");
  expect(JSON.parse(calls[0].init.body as string)).toEqual({ email: "alice@example.com" });
});

test("registerEmailAccount throws with the status when the account exists", async () => {
  scriptFetch(() => ({ status: 409, body: { error: "ACCOUNT_EXISTS" } }));
  await expect(client().registerEmailAccount("alice@example.com")).rejects.toMatchObject({ status: 409 });
});

test("verifyEmailCode posts the email and the code", async () => {
  const calls = scriptFetch(() => ({ status: 200, body: {} }));
  await client().verifyEmailCode("alice@example.com", "482913");
  expect(calls[0].url).toContain("/v1/auth/email/verify-code");
  expect(JSON.parse(calls[0].init.body as string)).toEqual({ email: "alice@example.com", code: "482913" });
});

test("confirmEmail posts the token and returns the confirmed address", async () => {
  const calls = scriptFetch(() => ({ status: 200, body: { ok: true, email: "alice@example.com" } }));
  expect(await client().confirmEmail("tok.en")).toEqual({ email: "alice@example.com" });
  expect(calls[0].url).toContain("/v1/auth/email/confirm");
  expect(JSON.parse(calls[0].init.body as string)).toEqual({ token: "tok.en" });
});

test("getMyWallet returns the date an unconfirmed email must be confirmed by", async () => {
  scriptFetch(() => ({
    status: 200,
    body: { walletAddress: "0xabc", email: "a@b.co", emailVerified: false, emailDeadline: "2026-10-10T12:00:00.000Z" },
  }));
  const wallet = await client().getMyWallet("siws-token");
  expect(wallet?.emailDeadline).toBe("2026-10-10T12:00:00.000Z");
});

test("setupWalletKey posts the passkey and returns the guid left to remove", async () => {
  const calls = scriptFetch(() => ({ status: 200, body: { walletAddress: "0xabc", removeOwnerGuid: "0x77" } }));
  expect(await client().setupWalletKey({ newOwnerPubkey: "0x1" })).toEqual({
    walletAddress: "0xabc",
    removeOwnerGuid: "0x77",
  });
  expect(calls[0].url).toContain("/v1/users/me/wallet/key");
  expect(JSON.parse(calls[0].init.body as string)).toEqual({ newOwnerPubkey: "0x1" });
});

test("claimWallet is gone", () => {
  expect("claimWallet" in client()).toBe(false);
});

test("getSessionWallet returns the session's wallet and whether its key needs setting up", async () => {
  const calls = scriptFetch(() => ({ status: 200, body: { walletAddress: "0xabc", needsKeySetup: true } }));
  expect(await client().getSessionWallet()).toEqual({ walletAddress: "0xabc", needsKeySetup: true });
  expect(calls[0].url).toContain("/v1/users/me/wallet");
  expect(calls[0].init.method).toBe("POST");
});

test("getSessionWallet returns null when the session has no wallet", async () => {
  scriptFetch(() => ({ status: 200, body: { walletAddress: null } }));
  expect(await client().getSessionWallet()).toBeNull();
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

test("an API error carries the reason the API gave", async () => {
  scriptFetch(() => ({ status: 409, body: { error: "Active offer already exists" } }));
  const c = new ApiClient("https://api.test", "ml_live_x");
  const err = (await c.getCollectionProfile("0x1").catch((e) => e)) as MedialaneApiError;
  expect(err.message).toBe("Active offer already exists");
});

test("a gateway body that is not our shape never becomes the message", async () => {
  const realFetchLocal = globalThis.fetch;
  globalThis.fetch = mock(async () =>
    new Response("<html><body>502 Bad Gateway</body></html>", { status: 502 }),
  ) as unknown as typeof fetch;
  const c = new ApiClient("https://api.test", "ml_live_x");
  const err = (await c.getCollectionProfile("0x1").catch((e) => e)) as MedialaneApiError;
  globalThis.fetch = realFetchLocal;
  expect(err.message).not.toContain("html");
  expect(err.details).toBe("<html><body>502 Bad Gateway</body></html>");
});

test("a JSON body with no error field never becomes the message", async () => {
  scriptFetch(() => ({ status: 500, body: { somethingElse: true } }));
  const c = new ApiClient("https://api.test", "ml_live_x");
  const err = (await c.getCollectionProfile("0x1").catch((e) => e)) as MedialaneApiError;
  expect(err.message).not.toContain("somethingElse");
});

test("upsertMyWallet never sends an email token", async () => {
  const calls = scriptFetch(() => ({ status: 200, body: { walletAddress: "0x1" } }));
  await new ApiClient("https://api.test", "ml_live_x").upsertMyWallet("siws_tok", { walletType: "MEDIAWALLET" });
  expect("emailVerificationToken" in JSON.parse(calls[0].init.body as string)).toBe(false);
});
