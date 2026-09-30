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

test("registerBusinessProvisioning sends only the recipient", async () => {
  const calls = scriptFetch(() => ({ status: 201, body: { data: { id: "prov-1", status: "DEPLOYED" } } }));
  const client = new ApiClient("https://api.test.invalid", "test-key");
  const res = await client.registerBusinessProvisioning({ recipientScheme: "email", recipientValue: "worker@example.com" });
  expect(calls[0].url).toBe("https://api.test.invalid/v1/business/provisioning");
  expect(JSON.parse(calls[0].init.body as string)).toEqual({
    chain: "STARKNET",
    recipientScheme: "email",
    recipientValue: "worker@example.com",
  });
  expect(res.data.id).toBe("prov-1");
});

test("registerBusinessProvisioning works with a non-email recipientScheme", async () => {
  const calls = scriptFetch(() => ({ status: 201, body: { data: { id: "prov-2", status: "DEPLOYED" } } }));
  const client = new ApiClient("https://api.test.invalid", "test-key");
  await client.registerBusinessProvisioning({ recipientScheme: "phone", recipientValue: "+15550001111" });
  expect(JSON.parse(calls[0].init.body as string).recipientScheme).toBe("phone");
});

test("completeBusinessProvisioning is gone", () => {
  const client = new ApiClient("https://api.test.invalid", "test-key");
  expect("completeBusinessProvisioning" in client).toBe(false);
});
