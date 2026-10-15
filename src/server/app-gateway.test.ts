import { describe, expect, test } from "bun:test";
import { createAppGateway, ACCOUNT_SESSION_COOKIE } from "./app-gateway.js";

type Seen = { url: string; method: string; headers: Headers; body: string | null };

function gateway(reply: () => Response, extra: Partial<Parameters<typeof createAppGateway>[0]> = {}) {
  const seen: Seen[] = [];
  const handle = createAppGateway({
    appId: "MEDIALANE_IO",
    backendUrl: "https://api.test",
    apiKey: "key",
    allow: { GET: [/^collections$/], POST: [/^auth\/email\/register-account$/, /^auth\/siws\/verify$/, /^rpc$/] },
    fetchImpl: (async (url: string, init: RequestInit) => {
      seen.push({
        url: String(url),
        method: init.method ?? "GET",
        headers: new Headers(init.headers),
        body: init.body ? new TextDecoder().decode(init.body as ArrayBuffer) : null,
      });
      return reply();
    }) as typeof fetch,
    ...extra,
  });
  return { handle, seen };
}

const req = (path: string, init: RequestInit = {}) =>
  new Request(`https://app.test/api/proxy/v1/${path}`, {
    ...init,
    headers: { host: "app.test", ...(init.headers as Record<string, string>) },
  });

describe("app gateway", () => {
  test("adds the key and app id, forwards the session cookie, strips client auth headers", async () => {
    const { handle, seen } = gateway(() => Response.json({ data: [] }));
    await handle(
      req("collections?page=2", {
        headers: { cookie: `${ACCOUNT_SESSION_COOKIE}=sess`, "x-api-key": "evil", "x-app-id": "OTHER", "x-account-session": "forged" },
      }),
      ["collections"],
    );
    expect(seen[0].url).toBe("https://api.test/v1/collections?page=2");
    expect(seen[0].headers.get("x-api-key")).toBe("key");
    expect(seen[0].headers.get("x-app-id")).toBe("MEDIALANE_IO");
    expect(seen[0].headers.get("x-account-session")).toBe("sess");
  });

  test("sends the app secret from config and drops one sent by the browser", async () => {
    const { handle, seen } = gateway(() => Response.json({}), { appSecret: "s3cret" });
    await handle(req("collections", { headers: { "x-app-secret": "forged" } }), ["collections"]);
    expect(seen[0].headers.get("x-app-secret")).toBe("s3cret");
  });

  test("without an app secret configured, no secret header is sent", async () => {
    const { handle, seen } = gateway(() => Response.json({}));
    await handle(req("collections", { headers: { "x-app-secret": "forged" } }), ["collections"]);
    expect(seen[0].headers.get("x-app-secret")).toBeNull();
  });

  test("no cookie means no session header", async () => {
    const { handle, seen } = gateway(() => Response.json({}));
    await handle(req("collections", { headers: { "x-account-session": "forged" } }), ["collections"]);
    expect(seen[0].headers.get("x-account-session")).toBeNull();
  });

  test("a path outside the allowlist is refused without calling the backend", async () => {
    const { handle, seen } = gateway(() => Response.json({}));
    const res = await handle(req("users/me"), ["users", "me"]);
    expect(res.status).toBe(403);
    expect(seen).toHaveLength(0);
  });

  test("a traversal segment is refused", async () => {
    const { handle } = gateway(() => Response.json({}));
    expect((await handle(req("collections"), ["..", "collections"])).status).toBe(400);
  });

  test("cross-origin requests are refused", async () => {
    const { handle } = gateway(() => Response.json({}));
    expect((await handle(req("collections", { headers: { origin: "https://evil.test" } }), ["collections"])).status).toBe(403);
  });

  test("email sign-up sets the cookie and keeps the token out of the body", async () => {
    const { handle } = gateway(() => Response.json({ accountId: "a", accountToken: "tok" }));
    const res = await handle(req("auth/email/register-account", { method: "POST", body: "{}" }), ["auth", "email", "register-account"]);
    expect(await res.json()).toEqual({ accountId: "a" });
    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).toContain(`${ACCOUNT_SESSION_COOKIE}=tok`);
    expect(cookie.toLowerCase()).toContain("httponly");
  });

  test("wallet sign-in sets the cookie and keeps both tokens out of the body", async () => {
    const { handle } = gateway(() => Response.json({ token: "siws", accountId: "a", accountToken: "tok" }));
    const res = await handle(req("auth/siws/verify", { method: "POST", body: "{}" }), ["auth", "siws", "verify"]);
    expect(await res.json()).toEqual({ accountId: "a" });
    expect(res.headers.get("set-cookie") ?? "").toContain(`${ACCOUNT_SESSION_COOKIE}=tok`);
  });

  test("a wallet sign-in token never reaches the browser, even without a session", async () => {
    const { handle } = gateway(() => Response.json({ token: "siws" }));
    const res = await handle(req("auth/siws/verify", { method: "POST", body: "{}" }), ["auth", "siws", "verify"]);
    expect(await res.json()).toEqual({});
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  test("the rpc body is forwarded unchanged", async () => {
    const { handle, seen } = gateway(() => Response.json({ jsonrpc: "2.0", result: "0x1", id: 1 }));
    const body = JSON.stringify({ jsonrpc: "2.0", method: "starknet_chainId", id: 1 });
    await handle(req("rpc", { method: "POST", body }), ["rpc"]);
    expect(seen[0].body).toBe(body);
  });

  test("cacheable public reads get a cache header only without a session", async () => {
    const { handle } = gateway(() => Response.json({ data: [] }), { cacheableGets: [/^collections$/] });
    const anon = await handle(req("collections"), ["collections"]);
    expect(anon.headers.get("cache-control")).toContain("s-maxage");
    const signedIn = await handle(req("collections", { headers: { cookie: `${ACCOUNT_SESSION_COOKIE}=s` } }), ["collections"]);
    expect(signedIn.headers.get("cache-control")).toBeNull();
  });

  test("a missing key is a 500 and nothing is forwarded", async () => {
    const { handle, seen } = gateway(() => Response.json({}), { apiKey: undefined });
    expect((await handle(req("collections"), ["collections"])).status).toBe(500);
    expect(seen).toHaveLength(0);
  });
});
