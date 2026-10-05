import { afterEach, expect, mock, test } from "bun:test";
import { ApiClient } from "./client.js";

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

function captureHeaders() {
  const seen: Record<string, string>[] = [];
  globalThis.fetch = mock(async (_url: unknown, init?: RequestInit) => {
    seen.push((init?.headers ?? {}) as Record<string, string>);
    return new Response(JSON.stringify({ exists: false, ok: true }), { status: 200 });
  }) as unknown as typeof fetch;
  return seen;
}

test("every request carries x-app-source when the client has an app", async () => {
  const seen = captureHeaders();
  const c = new ApiClient("https://api.test", "ml_live_x", undefined, "STARKNET", "MEDIALANE_IO");
  await c.checkEmail("a@example.test");
  await c.requestEmailCode("a@example.test");
  await c.verifyEmailCode("a@example.test", "123456");
  expect(seen).toHaveLength(3);
  for (const headers of seen) {
    expect(headers["x-app-source"]).toBe("MEDIALANE_IO");
    expect(headers["x-api-key"]).toBe("ml_live_x");
  }
});

test("no x-app-source header is sent when the client has no app", async () => {
  const seen = captureHeaders();
  const c = new ApiClient("https://api.test", "ml_live_x");
  await c.checkEmail("a@example.test");
  expect(seen[0]).not.toHaveProperty("x-app-source");
});
