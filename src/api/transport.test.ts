import { test, expect, mock, afterEach } from "bun:test";
import { Transport, queryString } from "./transport.js";
import { MedialaneApiError } from "../errors.js";

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

interface Seen { url: string; init: RequestInit }

function respond(status: number, body?: unknown, headers: Record<string, string> = {}) {
  const seen: Seen[] = [];
  globalThis.fetch = mock(async (input: unknown, init?: RequestInit) => {
    seen.push({ url: String(input), init: init ?? {} });
    return new Response(body === undefined ? "" : JSON.stringify(body), { status, headers });
  }) as unknown as typeof fetch;
  return seen;
}

const failure = async (p: Promise<unknown>) => (await p.then(() => null, (e) => e)) as MedialaneApiError;

const transport = (extra: Partial<ConstructorParameters<typeof Transport>[0]> = {}) =>
  new Transport({ baseUrl: "https://api.test/", apiKey: "k", retry: { maxAttempts: 1 }, ...extra });

test("queryString drops undefined, null and empty values and keeps falsy numbers and booleans", () => {
  expect(queryString({ a: "x", b: undefined, c: null, d: "", e: 0, f: false })).toBe("?a=x&e=0&f=false");
  expect(queryString({})).toBe("");
  expect(queryString(undefined)).toBe("");
});

test("requests carry the api key, join the base url once, and send JSON bodies with a content type", async () => {
  const seen = respond(200, { ok: true });
  await transport().post("/v1/x", { a: 1 });
  expect(seen[0].url).toBe("https://api.test/v1/x");
  const headers = seen[0].init.headers as Record<string, string>;
  expect(headers["x-api-key"]).toBe("k");
  expect(headers["Content-Type"]).toBe("application/json");
  expect(seen[0].init.body).toBe('{"a":1}');
});

test("a GET sends neither a body nor a content type", async () => {
  const seen = respond(200, {});
  await transport().get("/v1/x", { q: "a b" });
  expect(seen[0].url).toBe("https://api.test/v1/x?q=a+b");
  expect((seen[0].init.headers as Record<string, string>)["Content-Type"]).toBeUndefined();
  expect(seen[0].init.body).toBeUndefined();
});

test("a bearer set on the transport is sent, and a per-request bearer overrides it", async () => {
  const seen = respond(200, {});
  const t = transport({ bearer: "base" });
  await t.get("/v1/x");
  await t.request("/v1/x", { bearer: "call" });
  expect((seen[0].init.headers as Record<string, string>).Authorization).toBe("Bearer base");
  expect((seen[1].init.headers as Record<string, string>).Authorization).toBe("Bearer call");
});

test("a bearer function is read on every request", async () => {
  const seen = respond(200, {});
  let token = "one";
  const t = transport({ bearer: () => token });
  await t.get("/v1/x");
  token = "two";
  await t.get("/v1/x");
  expect((seen[0].init.headers as Record<string, string>).Authorization).toBe("Bearer one");
  expect((seen[1].init.headers as Record<string, string>).Authorization).toBe("Bearer two");
});

test("withBearer returns a scoped transport and leaves the original anonymous", async () => {
  const seen = respond(200, {});
  const t = transport();
  await t.withBearer("scoped").get("/v1/x");
  await t.get("/v1/x");
  expect((seen[0].init.headers as Record<string, string>).Authorization).toBe("Bearer scoped");
  expect((seen[1].init.headers as Record<string, string>).Authorization).toBeUndefined();
});

test("find returns null for 404 and rethrows other failures", async () => {
  respond(404, { error: "missing" });
  expect(await transport().find("/v1/x")).toBeNull();
  respond(500, { error: "boom" });
  await expect(transport().find("/v1/x")).rejects.toBeInstanceOf(MedialaneApiError);
});

test("find can also treat extra statuses as absent", async () => {
  respond(403, { error: "no" });
  expect(await transport().find("/v1/x", { also: [403] })).toBeNull();
});

test("a failure carries status, message, retry-after, details and the server's own code", async () => {
  respond(429, { error: "slow down", code: "credits_exhausted" }, { "retry-after": "2" });
  const err = await failure(transport().get("/v1/orders"));
  expect(err).toBeInstanceOf(MedialaneApiError);
  expect(err.status).toBe(429);
  expect(err.message).toBe("slow down");
  expect(err.retryAfterMs).toBe(2000);
  expect(err.serverCode).toBe("credits_exhausted");
  expect(err.code).toBe("RATE_LIMITED");
  expect(err.details).toEqual({ error: "slow down", code: "credits_exhausted" });
});

test("a 404 names the resource that was missing", async () => {
  respond(404, {});
  const missing = (path: string) => failure(transport().get(path));
  expect((await missing("/v1/orders/0x1")).code).toBe("ORDER_NOT_FOUND");
  expect((await missing("/v1/tokens/0x1/1")).code).toBe("TOKEN_NOT_FOUND");
  expect((await missing("/v1/collections/0x1")).code).toBe("COLLECTION_NOT_FOUND");
  expect((await missing("/v1/intents/abc")).code).toBe("INTENT_NOT_FOUND");
  expect((await missing("/v1/drops/0x1")).code).toBe("NOT_FOUND");
});

test("a non-JSON failure body is kept as text in details", async () => {
  globalThis.fetch = mock(async () => new Response("plain failure", { status: 502 })) as unknown as typeof fetch;
  const err = await failure(transport().get("/v1/x"));
  expect(err.message).toBe("Request failed with status 502");
  expect(err.details).toBe("plain failure");
});

test("an injected fetch is used instead of the global one", async () => {
  const calls: string[] = [];
  const t = transport({ fetch: async (input) => { calls.push(String(input)); return new Response("{}"); } });
  await t.get("/v1/x");
  expect(calls).toEqual(["https://api.test/v1/x"]);
});

test("addr normalizes with the transport's chain", () => {
  expect(transport().addr("0x0ABC")).toBe(transport().addr("0xabc"));
});
