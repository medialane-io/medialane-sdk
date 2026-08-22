import { test, expect } from "bun:test";
import { createRpcProxyHandler } from "./rpc-proxy.js";

const allow = () => true;
const deny = () => false;

function request(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request("https://app.test/api/rpc", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

test("forwards the body to the backend RPC endpoint with the api key attached", async () => {
  let seenUrl = "";
  let seenKey: string | null = null;
  let seenBody: unknown;

  const handler = createRpcProxyHandler({
    backendUrl: "https://backend.test",
    apiKey: "secret-key",
    checkRateLimit: allow,
    fetchImpl: (async (url: string, init?: RequestInit) => {
      seenUrl = String(url);
      seenKey = new Headers(init?.headers).get("x-api-key");
      seenBody = JSON.parse(String(init?.body));
      return new Response(JSON.stringify({ jsonrpc: "2.0", result: "0x1", id: 1 }), { status: 200 });
    }) as unknown as typeof fetch,
  });

  const res = await handler(request({ jsonrpc: "2.0", method: "starknet_call", id: 1 }));

  expect(seenUrl).toBe("https://backend.test/v1/rpc");
  expect(seenKey).toBe("secret-key");
  expect(seenBody).toEqual({ jsonrpc: "2.0", method: "starknet_call", id: 1 });
  expect(await res.json()).toEqual({ jsonrpc: "2.0", result: "0x1", id: 1 });
});

test("trims a trailing slash from the backend url", async () => {
  let seenUrl = "";
  const handler = createRpcProxyHandler({
    backendUrl: "https://backend.test/",
    apiKey: "k",
    checkRateLimit: allow,
    fetchImpl: (async (url: string) => {
      seenUrl = String(url);
      return new Response("{}", { status: 200 });
    }) as unknown as typeof fetch,
  });
  await handler(request({ method: "starknet_call" }));
  expect(seenUrl).toBe("https://backend.test/v1/rpc");
});

test("refuses cross-origin requests without calling the backend", async () => {
  let called = false;
  const handler = createRpcProxyHandler({
    backendUrl: "https://backend.test",
    apiKey: "k",
    checkRateLimit: allow,
    fetchImpl: (async () => {
      called = true;
      return new Response("{}");
    }) as unknown as typeof fetch,
  });

  const res = await handler(
    request({ method: "starknet_call" }, { origin: "https://evil.example", host: "app.test" }),
  );

  expect(called).toBe(false);
  expect(res.status).toBe(403);
});

test("refuses when the rate limiter says no, without calling the backend", async () => {
  let called = false;
  const handler = createRpcProxyHandler({
    backendUrl: "https://backend.test",
    apiKey: "k",
    checkRateLimit: deny,
    fetchImpl: (async () => {
      called = true;
      return new Response("{}");
    }) as unknown as typeof fetch,
  });

  const res = await handler(request({ method: "starknet_call" }));
  expect(called).toBe(false);
  expect(res.status).toBe(429);
});

test("refuses when no api key is configured, so an unbilled call is impossible", async () => {
  let called = false;
  const handler = createRpcProxyHandler({
    backendUrl: "https://backend.test",
    apiKey: undefined,
    checkRateLimit: allow,
    fetchImpl: (async () => {
      called = true;
      return new Response("{}");
    }) as unknown as typeof fetch,
  });

  const res = await handler(request({ method: "starknet_call" }));
  expect(called).toBe(false);
  const json = await res.json();
  expect(json.error.code).toBe(-32003);
});

test("surfaces a 402 from the backend to the caller", async () => {
  const handler = createRpcProxyHandler({
    backendUrl: "https://backend.test",
    apiKey: "k",
    checkRateLimit: allow,
    fetchImpl: (async () =>
      new Response(JSON.stringify({ error: "Payment required" }), { status: 402 })) as unknown as typeof fetch,
  });

  const res = await handler(request({ method: "starknet_call" }));
  expect(res.status).toBe(402);
});

test("reports an unreachable backend as a JSON-RPC error rather than throwing", async () => {
  const handler = createRpcProxyHandler({
    backendUrl: "https://backend.test",
    apiKey: "k",
    checkRateLimit: allow,
    fetchImpl: (async () => {
      throw new Error("backend unreachable");
    }) as unknown as typeof fetch,
  });

  const res = await handler(request({ method: "starknet_call" }));
  const json = await res.json();
  expect(json.error.code).toBe(-32603);
});

test("rejects an unparseable body", async () => {
  const handler = createRpcProxyHandler({
    backendUrl: "https://backend.test",
    apiKey: "k",
    checkRateLimit: allow,
    fetchImpl: (async () => new Response("{}")) as unknown as typeof fetch,
  });

  const res = await handler(
    new Request("https://app.test/api/rpc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{not json",
    }),
  );
  const json = await res.json();
  expect(json.error.code).toBe(-32700);
});
