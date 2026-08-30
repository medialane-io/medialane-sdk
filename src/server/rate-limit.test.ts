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

test("requestIp reads the nearest hop from x-forwarded-for, not the caller-supplied first entry", () => {
  const req = new Request("https://app.test/api/x", {
    headers: { "x-forwarded-for": "5.6.7.8, 9.9.9.9" },
  });
  expect(requestIp(req)).toBe("9.9.9.9");
});

test("requestIp falls back to 'unknown' when the header is missing", () => {
  const req = new Request("https://app.test/api/x");
  expect(requestIp(req)).toBe("unknown");
});

test("requestIp ignores a spoofed leftmost x-forwarded-for entry", () => {
  const req = new Request("https://app.test/x", {
    headers: { "x-forwarded-for": "6.6.6.6, 203.0.113.9" },
  });
  expect(requestIp(req)).toBe("203.0.113.9");
});

test("requestIp cannot be varied by rotating the spoofed prefix", () => {
  const key = (prefix: string) =>
    requestIp(new Request("https://app.test/x", {
      headers: { "x-forwarded-for": `${prefix}, 203.0.113.9` },
    }));
  expect(key("1.1.1.1")).toBe(key("2.2.2.2"));
});

test("requestIp prefers the trusted first-party app header", () => {
  const req = new Request("https://app.test/x", {
    headers: { "x-medialane-client-ip": "203.0.113.9", "x-forwarded-for": "6.6.6.6" },
  });
  expect(requestIp(req)).toBe("203.0.113.9");
});

test("requestIp falls back to unknown with no forwarding headers", () => {
  expect(requestIp(new Request("https://app.test/x"))).toBe("unknown");
});
