import { test, expect, mock, afterEach } from "bun:test";
import { ApiClient } from "./client.js";

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

function mockFetch(calls: string[], body: unknown = { data: [] }) {
  globalThis.fetch = mock(async (input: unknown) => {
    calls.push(String(input));
    return new Response(JSON.stringify(body), { status: 200 });
  }) as unknown as typeof fetch;
}

const PADDED_1 = "0x" + "0".repeat(63) + "1";
const PADDED_2 = "0x" + "0".repeat(63) + "2";

test("getRewards normalizes the address and unwraps data", async () => {
  const calls: string[] = [];
  mockFetch(calls, { data: { address: PADDED_1, totalXp: 42 } });
  const c = new ApiClient("https://api.test", "ml_live_x");
  const rewards = await c.getRewards("0x1");
  expect(calls[0]).toContain(`/v1/rewards/${PADDED_1}`);
  expect(rewards.totalXp).toBe(42);
});

test("getRewardsLeaderboard builds paging params", async () => {
  const calls: string[] = [];
  mockFetch(calls, { data: [], meta: { page: 3, limit: 25, total: 0 } });
  const c = new ApiClient("https://api.test", "ml_live_x");
  await c.getRewardsLeaderboard(3, 25);
  expect(calls[0]).toContain("/v1/rewards?page=3&limit=25");
});

test("getRewardsEvents hits /:address/events with paging", async () => {
  const calls: string[] = [];
  mockFetch(calls, { data: [], meta: { page: 1, limit: 20, total: 0 } });
  const c = new ApiClient("https://api.test", "ml_live_x");
  await c.getRewardsEvents("0x1");
  expect(calls[0]).toContain(`/v1/rewards/${PADDED_1}/events?page=1&limit=20`);
});

test("getRewardsConfig unwraps data", async () => {
  const calls: string[] = [];
  mockFetch(calls, { data: { levels: [], actions: [], badges: [] } });
  const c = new ApiClient("https://api.test", "ml_live_x");
  const config = await c.getRewardsConfig();
  expect(calls[0]).toContain("/v1/rewards/config");
  expect(config.levels).toEqual([]);
});

test("getRewardsBatch normalizes and joins addresses; empty input skips the request", async () => {
  const calls: string[] = [];
  mockFetch(calls, { data: [] });
  const c = new ApiClient("https://api.test", "ml_live_x");
  await c.getRewardsBatch(["0x1", "0x2"]);
  expect(decodeURIComponent(calls[0])).toContain(`/v1/rewards/batch?addresses=${PADDED_1},${PADDED_2}`);

  const before = calls.length;
  const empty = await c.getRewardsBatch([]);
  expect(empty).toEqual([]);
  expect(calls.length).toBe(before);
});
