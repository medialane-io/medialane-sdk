import { test, expect } from "bun:test";
import { DEFAULT_STARKNET_RPC_METHODS, createRpcProxyHandler } from "./rpc-proxy.js";

test("DEFAULT_STARKNET_RPC_METHODS is the union of all three apps' current allowlists", () => {
  const expected = [
    "starknet_call",
    "starknet_addInvokeTransaction",
    "starknet_getTransactionReceipt",
    "starknet_getTransactionStatus",
    "starknet_getTransactionByHash",
    "starknet_getTransaction",
    "starknet_getBlockWithReceipts",
    "starknet_estimateFee",
    "starknet_getNonce",
    "starknet_simulateTransactions",
    "starknet_specVersion",
    "starknet_chainId",
    "starknet_blockNumber",
    "starknet_blockHashAndNumber",
    "starknet_getClassAt",
    "starknet_getClass",
    "starknet_getClassHashAt",
    "starknet_getStorageAt",
    "starknet_getBlockWithTxHashes",
    "starknet_getBlockWithTxs",
    "starknet_getEvents",
  ];
  for (const method of expected) {
    expect(DEFAULT_STARKNET_RPC_METHODS).toContain(method);
  }
  expect(DEFAULT_STARKNET_RPC_METHODS.length).toBe(expected.length);
});

test("createRpcProxyHandler rejects when billing fails, without calling any RPC url", async () => {
  let rpcUrlWasCalled = false;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string) => {
    if (String(url).includes("v1/rpc/meter")) {
      return new Response("", { status: 402 });
    }
    rpcUrlWasCalled = true;
    return new Response(JSON.stringify({ jsonrpc: "2.0", result: "0x1", id: 1 }));
  }) as typeof fetch;

  const handler = createRpcProxyHandler({
    rpcUrls: ["https://example-rpc.test"],
    backendUrl: "https://backend.test",
    apiKey: "test-key",
    checkRateLimit: () => true,
  });

  const req = new Request("https://app.test/api/rpc", {
    method: "POST",
    body: JSON.stringify({ jsonrpc: "2.0", method: "starknet_chainId", id: 1 }),
  });
  const res = await handler(req);
  const body = await res.json();

  expect(body.error.code).toBe(-32003);
  expect(rpcUrlWasCalled).toBe(false);

  globalThis.fetch = originalFetch;
});

test("createRpcProxyHandler forwards to the RPC url once billed, and fails over on a transient error", async () => {
  const calledUrls: string[] = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string) => {
    if (String(url).includes("v1/rpc/meter")) return new Response("", { status: 200 });
    calledUrls.push(String(url));
    if (String(url).includes("primary")) {
      return new Response(JSON.stringify({ jsonrpc: "2.0", error: { code: -32603, message: "temporarily unavailable" } }), { status: 200 });
    }
    return new Response(JSON.stringify({ jsonrpc: "2.0", result: "0x534e5f4d41494e", id: 1 }));
  }) as typeof fetch;

  const handler = createRpcProxyHandler({
    rpcUrls: ["https://primary.test", "https://fallback.test"],
    backendUrl: "https://backend.test",
    apiKey: "test-key",
    checkRateLimit: () => true,
  });

  const req = new Request("https://app.test/api/rpc", {
    method: "POST",
    body: JSON.stringify({ jsonrpc: "2.0", method: "starknet_chainId", id: 1 }),
  });
  const res = await handler(req);
  const body = await res.json();

  expect(calledUrls).toEqual(["https://primary.test", "https://fallback.test"]);
  expect(body.result).toBe("0x534e5f4d41494e");

  globalThis.fetch = originalFetch;
});

test("createRpcProxyHandler rejects a disallowed method before billing", async () => {
  let meterWasCalled = false;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string) => {
    if (String(url).includes("v1/rpc/meter")) meterWasCalled = true;
    return new Response("", { status: 200 });
  }) as typeof fetch;

  const handler = createRpcProxyHandler({
    rpcUrls: ["https://example-rpc.test"],
    backendUrl: "https://backend.test",
    apiKey: "test-key",
    checkRateLimit: () => true,
  });

  const req = new Request("https://app.test/api/rpc", {
    method: "POST",
    body: JSON.stringify({ jsonrpc: "2.0", method: "starknet_traceBlockTransactions", id: 1 }),
  });
  const res = await handler(req);
  const body = await res.json();

  expect(body.error.code).toBe(-32601);
  expect(meterWasCalled).toBe(false);

  globalThis.fetch = originalFetch;
});

test("createRpcProxyHandler rejects when the rate limiter says no", async () => {
  const handler = createRpcProxyHandler({
    rpcUrls: ["https://example-rpc.test"],
    backendUrl: "https://backend.test",
    apiKey: "test-key",
    checkRateLimit: () => false,
  });

  const req = new Request("https://app.test/api/rpc", {
    method: "POST",
    headers: { "x-forwarded-for": "1.2.3.4" },
    body: JSON.stringify({ jsonrpc: "2.0", method: "starknet_chainId", id: 1 }),
  });
  const res = await handler(req);

  expect(res.status).toBe(429);
});
