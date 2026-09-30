import { test, expect } from "bun:test";
import { createBackendProxyHandler } from "./backend-proxy.js";

function request(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request("https://app.test/api/wallet/sponsored-invoke/build", {
    method: "POST",
    headers: { "Content-Type": "application/json", origin: "https://app.test", host: "app.test", ...headers },
    body: JSON.stringify(body),
  });
}

test("forwards the named cookie's value under the configured header when present", async () => {
  let seenHeader: string | null = null;
  const handler = createBackendProxyHandler({
    path: "/v1/paymaster/invoke/build",
    backendUrl: "https://backend.test",
    apiKey: "k",
    forwardCookie: { name: "ml_account_session", header: "x-account-session" },
    fetchImpl: (async (_url: string, init?: RequestInit) => {
      seenHeader = new Headers(init?.headers).get("x-account-session");
      return new Response("{}", { status: 200 });
    }) as unknown as typeof fetch,
  });

  await handler(request({ userAddress: "0x1" }, { cookie: "ml_account_session=abc123; other=1" }));

  expect(seenHeader).toBe("abc123");
});

test("omits the attribution header when the named cookie is absent", async () => {
  let seenHeader: string | null | "unset" = "unset";
  const handler = createBackendProxyHandler({
    path: "/v1/paymaster/invoke/build",
    backendUrl: "https://backend.test",
    apiKey: "k",
    forwardCookie: { name: "ml_account_session", header: "x-account-session" },
    fetchImpl: (async (_url: string, init?: RequestInit) => {
      seenHeader = new Headers(init?.headers).get("x-account-session");
      return new Response("{}", { status: 200 });
    }) as unknown as typeof fetch,
  });

  await handler(request({ userAddress: "0x1" }));

  expect(seenHeader).toBeNull();
});

test("behaves exactly as before when forwardCookie isn't configured", async () => {
  let seenHeader: string | null | "unset" = "unset";
  const handler = createBackendProxyHandler({
    path: "/v1/rpc",
    backendUrl: "https://backend.test",
    apiKey: "k",
    fetchImpl: (async (_url: string, init?: RequestInit) => {
      seenHeader = new Headers(init?.headers).get("x-account-session");
      return new Response("{}", { status: 200 });
    }) as unknown as typeof fetch,
  });

  await handler(request({ userAddress: "0x1" }, { cookie: "ml_account_session=abc123" }));

  expect(seenHeader).toBeNull();
});

test("forwards every request, with no volume limit", async () => {
  let forwarded = 0;
  const handler = createBackendProxyHandler({
    path: "/v1/paymaster/invoke/build",
    backendUrl: "https://backend.test",
    apiKey: "k",
    fetchImpl: (async () => {
      forwarded += 1;
      return new Response("{}", { status: 200 });
    }) as unknown as typeof fetch,
  });
  for (let i = 0; i < 5; i++) expect((await handler(request({ userAddress: "0x1" }))).status).toBe(200);
  expect(forwarded).toBe(5);
});
