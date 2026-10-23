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

const client = () => new ApiClient({ baseUrl: "https://api.test.invalid" });
const auth = (c: Captured) => (c.init.headers as Record<string, string> | undefined)?.Authorization;

test("getFundingMethods reads /v1/portal/funding/methods with no wallet token", async () => {
  const calls = scriptFetch(() => ({ status: 200, body: { data: [{ id: "chain-transfer", asset: "USDC" }] } }));
  const res = await client().portal.funding.methods();
  expect(calls[0]!.url).toBe("https://api.test.invalid/v1/portal/funding/methods");
  expect(calls[0]!.init.method).toBe("GET");
  expect(auth(calls[0]!)).toBeUndefined();
  expect(res[0]!.id).toBe("chain-transfer");
});

test("createFunding posts the method and parameters, and nothing else", async () => {
  const calls = scriptFetch(() => ({ status: 201, body: { data: { id: "fi1", method: "chain-transfer", status: "PENDING", expiresAt: "2026-10-01T00:00:00Z" } } }));
  await client().portal.funding.create({ method: "chain-transfer", params: { amountUsdc: "5" } });
  expect(calls[0]!.url).toBe("https://api.test.invalid/v1/portal/funding");
  expect(JSON.parse(calls[0]!.init.body as string)).toEqual({ method: "chain-transfer", params: { amountUsdc: "5" } });
});

test("getFundingChallenge, authorizeFunding, submitFunding and cancelFunding hit the intent's own paths", async () => {
  const calls = scriptFetch(() => ({ status: 200, body: { data: {} } }));
  const c = client();
  await c.portal.funding.challenge("fi 1", "0xabc");
  await c.portal.funding.authorize("fi 1", { payer: "0xabc", signature: ["0x1", "0x2"] });
  await c.portal.funding.submit("fi 1", "0xhash");
  await c.portal.funding.cancel("fi 1");
  expect(calls.map((x) => x.url)).toEqual([
    "https://api.test.invalid/v1/portal/funding/fi%201/challenge",
    "https://api.test.invalid/v1/portal/funding/fi%201/authorize",
    "https://api.test.invalid/v1/portal/funding/fi%201/submit",
    "https://api.test.invalid/v1/portal/funding/fi%201/cancel",
  ]);
  expect(JSON.parse(calls[0]!.init.body as string)).toEqual({ payer: "0xabc" });
  expect(JSON.parse(calls[1]!.init.body as string)).toEqual({ payer: "0xabc", signature: ["0x1", "0x2"] });
  expect(JSON.parse(calls[2]!.init.body as string)).toEqual({ txHash: "0xhash" });
});

test("getFunding reads one intent", async () => {
  const calls = scriptFetch(() => ({ status: 200, body: { data: { id: "fi1", method: "chain-transfer", status: "SETTLED", expiresAt: "x" } } }));
  const res = await client().portal.funding.get("fi1");
  expect(calls[0]!.url).toBe("https://api.test.invalid/v1/portal/funding/fi1");
  expect(res.status).toBe("SETTLED");
});

test("a 202 from submit is a pending result, not an error", async () => {
  scriptFetch(() => ({ status: 202, body: { data: { status: "PENDING", reason: "not in a block yet" } } }));
  const res = await client().portal.funding.submit("fi1", "0xhash");
  expect(res).toEqual({ status: "PENDING", reason: "not in a block yet" });
});
