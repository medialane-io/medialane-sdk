import { describe, expect, test } from "bun:test";
import { createAppSessionHandler } from "./app-session.js";
import { ACCOUNT_SESSION_COOKIE } from "./app-gateway.js";

function handler(status: number, body: unknown, appSecret?: string) {
  const seen: Headers[] = [];
  const h = createAppSessionHandler({
    appId: "MEDIALANE_STARKNET",
    backendUrl: "https://api.test",
    apiKey: "key",
    appSecret,
    fetchImpl: (async (_url: string, init: RequestInit) => {
      seen.push(new Headers(init.headers));
      return Response.json(body, { status });
    }) as typeof fetch,
  });
  return { h, seen };
}

const withCookie = (v?: string) =>
  new Request("https://app.test/api/session", { headers: v ? { cookie: `${ACCOUNT_SESSION_COOKIE}=${v}` } : {} });

describe("app session handler", () => {
  test("no cookie is a visitor and the backend is not called", async () => {
    const { h, seen } = handler(200, {});
    expect(await (await h.GET(withCookie())).json()).toBeNull();
    expect(seen).toHaveLength(0);
  });

  test("a cookie returns the account with the app id", async () => {
    const { h, seen } = handler(200, { accountId: "a", walletAddress: "0x1" });
    expect(await (await h.GET(withCookie("s"))).json()).toEqual({ accountId: "a", walletAddress: "0x1" });
    expect(seen[0].get("x-app-id")).toBe("MEDIALANE_STARKNET");
    expect(seen[0].get("x-account-session")).toBe("s");
  });

  test("a refused session is a visitor and the cookie is cleared", async () => {
    const { h } = handler(401, { error: "no" });
    const res = await h.GET(withCookie("s"));
    expect(await res.json()).toBeNull();
    expect(res.headers.get("set-cookie") ?? "").toContain("Max-Age=0");
  });

  test("sign-out clears the cookie", async () => {
    const { h } = handler(200, {});
    const res = await h.DELETE(withCookie("s"));
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie") ?? "").toContain(`${ACCOUNT_SESSION_COOKIE}=; `);
  });

  test("sends the app secret on the session check", async () => {
    const { h, seen } = handler(200, { accountId: "a" }, "s3cret");
    await h.GET(withCookie("s"));
    expect(seen[0].get("x-app-secret")).toBe("s3cret");
  });

  test("refused app credentials (400) keep the session cookie", async () => {
    const { h } = handler(400, { error: "invalid_app_credentials" }, "wrong");
    const res = await h.GET(withCookie("s"));
    expect(res.status).toBe(502);
    expect(res.headers.get("set-cookie")).toBeNull();
  });
});
