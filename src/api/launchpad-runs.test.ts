import { expect, test } from "bun:test";
import { createLaunchpadRunsClient } from "./launchpad-runs.js";

const BASE = "https://portal.test/api/proxy";
const make = (impl: typeof fetch) => createLaunchpadRunsClient({ baseUrl: BASE, getToken: () => null, fetchImpl: impl });

function recordingFetch() {
  const bodies: unknown[] = [];
  const urls: string[] = [];
  const impl = (async (input: unknown, init?: RequestInit) => {
    urls.push(String(input));
    bodies.push(init?.body === undefined ? undefined : JSON.parse(String(init.body)));
    return new Response(JSON.stringify({ data: { id: "run1", status: "PAID" } }), { status: 200 });
  }) as unknown as typeof fetch;
  return { impl, bodies, urls };
}

test("paying a run from a settled top-up sends the intent, never a transaction hash", async () => {
  const { impl, bodies, urls } = recordingFetch();
  await make(impl).checkoutFromWallet("run1", "fi_123");
  expect(urls[0]).toBe(`${BASE}/v1/portal/runs/run1/checkout`);
  expect(bodies[0]).toEqual({ method: "wallet", intentId: "fi_123" });
});

test("paying from credits is unchanged", async () => {
  const { impl, bodies } = recordingFetch();
  await make(impl).checkoutWithCredits("run1");
  expect(bodies[0]).toEqual({ method: "credits" });
});

test("ticketing steps are called under the run's ticketing path", async () => {
  const { impl, bodies, urls } = recordingFetch();
  const client = make(impl);

  await client.ticketing.uploadUrl("run1", "a.png");
  await client.ticketing.uploaded("run1", "a.png", "bafy-cid-123456");
  await client.ticketing.metadata("run1", "0xowner");
  await client.ticketing.resolveWallets("run1");
  await client.ticketing.registerWallet("run1", { recipient: "ana@x.com" });
  await client.ticketing.confirmCollection("run1");
  await client.ticketing.confirmTier("run1");
  await client.ticketing.confirmBatch("run1", 2);

  const base = `${BASE}/v1/portal/runs/run1`;
  expect(urls).toEqual([
    `${base}/files/upload-url`,
    `${base}/files/uploaded`,
    `${base}/metadata`,
    `${base}/wallets/resolve`,
    `${base}/wallets`,
    `${base}/collection/confirm`,
    `${base}/tier/confirm`,
    `${base}/batches/2/confirm`,
  ]);
  expect(bodies[0]).toEqual({ name: "a.png" });
  expect(bodies[2]).toEqual({ userAddress: "0xowner" });
  expect(bodies[4]).toEqual({ recipient: "ana@x.com" });
  expect("buildWallet" in client.ticketing).toBe(false);
});

test("a ticketing run's sponsored steps post to the same bases as any other run", () => {
  const client = make(recordingFetch().impl);
  expect(client.runCollectionBase("run1")).toBe(`${BASE}/v1/portal/runs/run1/collection`);
  expect(client.runTierBase("run1")).toBe(`${BASE}/v1/portal/runs/run1/tier`);
  expect(client.runBatchBase("run1", 3)).toBe(`${BASE}/v1/portal/runs/run1/batches/3`);
});

test("a base URL with a trailing slash does not double the slash", () => {
  const client = createLaunchpadRunsClient({ baseUrl: `${BASE}/`, getToken: () => null, fetchImpl: recordingFetch().impl });
  expect(client.runBase("run1")).toBe(`${BASE}/v1/portal/runs/run1`);
});
