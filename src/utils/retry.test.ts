import { test, expect, describe } from "bun:test";
import { withRetry } from "./retry.js";
import { MedialaneApiError, parseRetryAfter } from "../api/client.js";

const fast = { baseDelayMs: 1, maxDelayMs: 5 };

describe("withRetry", () => {
  test("retries a 429 and eventually succeeds", async () => {
    let n = 0;
    const out = await withRetry(async () => {
      n++;
      if (n < 3) throw new MedialaneApiError(429, "Too many requests");
      return "ok";
    }, fast);
    expect(out).toBe("ok");
    expect(n).toBe(3);
  });

  test("does NOT retry other 4xx (e.g. 400)", async () => {
    let n = 0;
    await expect(
      withRetry(async () => {
        n++;
        throw new MedialaneApiError(400, "bad input");
      }, fast),
    ).rejects.toBeInstanceOf(MedialaneApiError);
    expect(n).toBe(1);
  });

  test("retries 5xx", async () => {
    let n = 0;
    const out = await withRetry(async () => {
      n++;
      if (n < 2) throw new MedialaneApiError(503, "unavailable");
      return "ok";
    }, fast);
    expect(out).toBe("ok");
    expect(n).toBe(2);
  });

  test("honors Retry-After from a 429 (waits, then succeeds)", async () => {
    let n = 0;
    const started = Date.now();
    const out = await withRetry(async () => {
      n++;
      if (n < 2) throw new MedialaneApiError(429, "slow down", 8); // 8ms
      return "ok";
    }, { baseDelayMs: 1, maxDelayMs: 50 });
    expect(out).toBe("ok");
    expect(Date.now() - started).toBeGreaterThanOrEqual(7);
  });

  test("gives up after maxAttempts on persistent 429", async () => {
    let n = 0;
    await expect(
      withRetry(async () => {
        n++;
        throw new MedialaneApiError(429, "nope");
      }, { ...fast, maxAttempts: 3 }),
    ).rejects.toBeInstanceOf(MedialaneApiError);
    expect(n).toBe(3);
  });
});

describe("parseRetryAfter", () => {
  test("delta-seconds → ms", () => {
    expect(parseRetryAfter("2")).toBe(2000);
    expect(parseRetryAfter("0")).toBe(0);
  });
  test("HTTP-date → ms from now (non-negative)", () => {
    const future = new Date(Date.now() + 3000).toUTCString();
    const ms = parseRetryAfter(future);
    expect(ms).toBeGreaterThan(1000);
    expect(ms).toBeLessThanOrEqual(3000);
  });
  test("null / garbage → undefined", () => {
    expect(parseRetryAfter(null)).toBeUndefined();
    expect(parseRetryAfter("soon")).toBeUndefined();
  });
});
