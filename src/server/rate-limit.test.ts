import { test, expect } from "bun:test";
import { createRateLimiter, requestIp } from "./rate-limit.js";

test("allows requests under the limit within the window", () => {
  const checkRateLimit = createRateLimiter(60_000, 3);
  expect(checkRateLimit("1.2.3.4")).toBe(true);
  expect(checkRateLimit("1.2.3.4")).toBe(true);
  expect(checkRateLimit("1.2.3.4")).toBe(true);
});

test("rejects once the limit is exceeded within the window", () => {
  const checkRateLimit = createRateLimiter(60_000, 2);
  expect(checkRateLimit("1.2.3.4")).toBe(true);
  expect(checkRateLimit("1.2.3.4")).toBe(true);
  expect(checkRateLimit("1.2.3.4")).toBe(false);
});

test("tracks each key independently", () => {
  const checkRateLimit = createRateLimiter(60_000, 1);
  expect(checkRateLimit("a")).toBe(true);
  expect(checkRateLimit("b")).toBe(true);
  expect(checkRateLimit("a")).toBe(false);
  expect(checkRateLimit("b")).toBe(false);
});

test("resets a key once its window has fully elapsed", () => {
  const realNow = Date.now;
  let now = realNow();
  Date.now = () => now;

  const checkRateLimit = createRateLimiter(1000, 1);
  expect(checkRateLimit("a")).toBe(true);
  expect(checkRateLimit("a")).toBe(false);

  now += 1001;
  expect(checkRateLimit("a")).toBe(true);

  Date.now = realNow;
});

test("sweeps expired entries out of the internal map after a full window passes", () => {
  const realNow = Date.now;
  let now = realNow();
  Date.now = () => now;

  const checkRateLimit = createRateLimiter(1000, 1);
  checkRateLimit("stale-key");

  now += 1001;
  checkRateLimit("triggers-a-sweep");

  now += 1001;
  expect(checkRateLimit("stale-key")).toBe(true);

  Date.now = realNow;
});

test("requestIp reads the first address from x-forwarded-for", () => {
  const req = new Request("https://app.test/api/x", {
    headers: { "x-forwarded-for": "5.6.7.8, 9.9.9.9" },
  });
  expect(requestIp(req)).toBe("5.6.7.8");
});

test("requestIp falls back to 'unknown' when the header is missing", () => {
  const req = new Request("https://app.test/api/x");
  expect(requestIp(req)).toBe("unknown");
});
