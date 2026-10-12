import { test, expect, mock, afterEach } from "bun:test";
import { ApiClient, MedialaneApiError } from "./client.js";
import type { CreateDropClaimIntentParams, CreateDropManageIntentParams } from "../types/api.js";

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
    body: { walletAddress: "0xabc", email: "a@b.co", emailDeadline: "2026-10-10T12:00:00.000Z" },
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



test("account calls without a token send no Authorization header", async () => {
  const calls = scriptFetch(() => ({ status: 200, body: { email: "b@example.com" } }));
  await client().changeMyEmail("b@example.com");
  expect(new Headers(calls[0].init.headers).has("Authorization")).toBe(false);
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

async function headersOf(run: (client: ApiClient) => Promise<unknown>): Promise<Headers> {
  let seen = new Headers();
  const original = globalThis.fetch;
  globalThis.fetch = (async (_url: string, init: RequestInit) => {
    seen = new Headers(init.headers);
    return new Response(JSON.stringify({ data: [] }), { status: 200 });
  }) as unknown as typeof fetch;
  try {
    await run(new ApiClient("https://api.test", "key"));
  } finally {
    globalThis.fetch = original;
  }
  return seen;
}

test("a GET sends no Content-Type", async () => {
  expect((await headersOf((c) => c.getActivities())).has("content-type")).toBe(false);
});

test("a JSON POST still sends Content-Type", async () => {
  const h = await headersOf((c) => c.createMintIntent({ owner: "0x1", recipient: "0x1" }));
  expect(h.get("content-type")).toBe("application/json");
});

test.each([
  ["createTransferTokenIntent", "/v1/intents/transfer-token", { owner: "0x1", token: "0x2", recipient: "0x3", amount: "1" }],
  ["createTransferNftIntent", "/v1/intents/transfer-nft", { owner: "0x1", contractAddress: "0x2", tokenId: "1", recipient: "0x3", tokenStandard: "ERC721" }],
  ["createTransferCollectionOwnershipIntent", "/v1/intents/transfer-collection-ownership", { owner: "0x1", collectionId: "1", newOwner: "0x3" }],
  ["createCommentIntent", "/v1/intents/comment", { author: "0x1", nftContract: "0x2", tokenId: "1", text: "hi" }],
  ["createGenesisMintIntent", "/v1/intents/genesis-mint", { owner: "0x1", recipient: "0x1" }],
  ["createPopClaimIntent", "/v1/intents/pop-claim", { claimer: "0x1", collection: "0x2", proof: [] }],
  ["createPopBurnIntent", "/v1/intents/pop-burn", { owner: "0x1", collection: "0x2", tokenId: "1" }],
  ["createDropClaimIntent", "/v1/intents/drop-claim", { claimer: "0x1", collection: "0x2", quantity: "2", proof: [] }],
  ["createWalletManageIntent", "/v1/intents/wallet-manage", { owner: "0x1", action: "cancel_escape" }],
  ["createSwapIntent", "/v1/intents/swap", { taker: "0x1", sellTokenAddress: "0x2", buyTokenAddress: "0x3", sellAmountRaw: "1" }],
  ["createFundingTransferIntent", "/v1/intents/funding-transfer", { owner: "0x1", asset: "0x2", amountAtomic: "1" }],
  ["createDropManageIntent", "/v1/intents/drop-manage", { owner: "0x1", collection: "0x2", action: "set_allowlist_root", root: "0x0" }],
  ["createPopManageIntent", "/v1/intents/pop-manage", { owner: "0x1", collection: "0x2", action: "set_allowlist_root", root: "0xabc" }],
])("%s posts its params to %s", async (method, path, params) => {
  const calls = scriptFetch(() => ({ status: 201, body: { data: { id: "i", requiresSignature: false, calls: [], expiresAt: "" } } }));
  const c = new ApiClient("https://api.test", "k");
  await (c as unknown as Record<string, (p: unknown) => Promise<unknown>>)[method]!(params);
  expect(calls[0]!.url).toBe(`https://api.test${path}`);
  expect(calls[0]!.init.method).toBe("POST");
  expect(JSON.parse(String(calls[0]!.init.body))).toEqual(params);
});

test("drop intent params carry a quantity, a proof and the issue / allowlist-root actions", () => {
  const claim: CreateDropClaimIntentParams = { claimer: "0x1", collection: "0x2", quantity: "2", proof: ["0xa"] };
  const issue: CreateDropManageIntentParams = { owner: "0x1", collection: "0x2", action: "issue", recipient: "0x3", quantity: "1" };
  const root: CreateDropManageIntentParams = { owner: "0x1", collection: "0x2", action: "set_allowlist_root", root: "0x0" };
  expect([claim.quantity, issue.action, root.action]).toEqual(["2", "issue", "set_allowlist_root"]);
});

const P1 = "0x0000000000000000000000000000000000000000000000000000000000000001";
const PD = "0x000000000000000000000000000000000000000000000000000000000000d409";

test.each([
  ["getDrops", [{ status: "live", organizer: "0x1", page: 2, limit: 10 }], `/v1/drops?status=live&organizer=${P1}&page=2&limit=10`],
  ["getDrops", [], "/v1/drops"],
  ["getDropMints", ["0xd409", { page: 1, limit: 5 }], `/v1/drops/${PD}/mints?page=1&limit=5`],
])("%s requests %#", async (method, args, path) => {
  const calls = scriptFetch(() => ({ status: 200, body: { data: [], meta: { page: 1, limit: 24, total: 0 } } }));
  const c = new ApiClient("https://api.test", "k");
  await (c as unknown as Record<string, (...a: unknown[]) => Promise<unknown>>)[method]!(...(args as unknown[]));
  expect(new URL(calls[0]!.url).pathname + new URL(calls[0]!.url).search).toBe(path);
});

test("getDrop is null for an unknown drop", async () => {
  scriptFetch(() => ({ status: 404, body: { error: "Drop not found" } }));
  expect(await new ApiClient("https://api.test", "k").getDrop("0xd409")).toBeNull();
});
