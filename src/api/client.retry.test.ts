import { test, expect } from "bun:test";
import { ApiClient } from "./client.js";

async function countAttempts(status: number, run: (client: ApiClient) => Promise<unknown>): Promise<number> {
  let attempts = 0;
  const original = globalThis.fetch;
  globalThis.fetch = (async () => {
    attempts++;
    return new Response(JSON.stringify({ error: "x" }), { status });
  }) as unknown as typeof fetch;
  try {
    await run(new ApiClient({ baseUrl: "https://api.test", apiKey: "key", retry: { baseDelayMs: 1, maxDelayMs: 1 } })).catch(() => {});
  } finally {
    globalThis.fetch = original;
  }
  return attempts;
}

test("a read is retried after a server error", async () => {
  expect(await countAttempts(502, (c) => c.platform.stats())).toBe(3);
});

test("a write is not retried after a server error, since it may already have happened", async () => {
  expect(await countAttempts(502, (c) => c.intents.create("mint", { owner: "0x1", recipient: "0x1" }))).toBe(1);
  expect(await countAttempts(500, (c) => c.withBearer("t").platform.submitReport({ targetType: "COMMENT", targetId: "c", categories: ["X"] }))).toBe(1);
});

test("a write turned away as too many requests is retried, since nothing happened", async () => {
  expect(await countAttempts(429, (c) => c.intents.create("mint", { owner: "0x1", recipient: "0x1" }))).toBe(3);
});

test("a write whose connection failed is not retried, since it may have arrived", async () => {
  let attempts = 0;
  const original = globalThis.fetch;
  globalThis.fetch = (async () => {
    attempts++;
    throw new TypeError("network down");
  }) as unknown as typeof fetch;
  try {
    const client = new ApiClient({ baseUrl: "https://api.test", apiKey: "key", retry: { baseDelayMs: 1, maxDelayMs: 1 } });
    await client.coins.sync("0x1").catch(() => {});
  } finally {
    globalThis.fetch = original;
  }
  expect(attempts).toBe(1);
});
