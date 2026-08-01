import { test, expect, mock, afterEach } from "bun:test";
import { ApiClient } from "./client.js";

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

test("registerBusinessProvisioning posts to /v1/business/provisioning", async () => {
  const calls = scriptFetch(() => ({ status: 201, body: { data: { id: "prov-1", status: "DEPLOYED" } } }));
  const client = new ApiClient("https://api.test.invalid", "test-key");
  const res = await client.registerBusinessProvisioning({
    chain: "STARKNET",
    walletAddress: "0x1",
    recipientEmail: "worker@example.com",
    interimOwnerPubkey: "0x2",
  });
  expect(calls[0].url).toBe("https://api.test.invalid/v1/business/provisioning");
  expect(JSON.parse(calls[0].init.body as string)).toEqual({
    chain: "STARKNET",
    walletAddress: "0x1",
    recipientEmail: "worker@example.com",
    interimOwnerPubkey: "0x2",
  });
  expect(res.data.id).toBe("prov-1");
});

test("completeBusinessProvisioning posts to /v1/business/provisioning/:id/complete", async () => {
  const calls = scriptFetch(() => ({ status: 200, body: { data: { id: "prov-1", status: "TRANSFERRED" } } }));
  const client = new ApiClient("https://api.test.invalid", "test-key");
  const res = await client.completeBusinessProvisioning("prov-1");
  expect(calls[0].url).toBe("https://api.test.invalid/v1/business/provisioning/prov-1/complete");
  expect(calls[0].init.method).toBe("POST");
  expect(res.data.status).toBe("TRANSFERRED");
});
