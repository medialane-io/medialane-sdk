import { test, expect } from "bun:test";
import { isSameOrigin } from "./origin.js";

function req(headers: Record<string, string>): Request {
  return new Request("https://app.test/api/rpc", { method: "POST", headers });
}

test("allows a request with no origin header", () => {
  expect(isSameOrigin(req({ host: "app.test" }))).toBe(true);
});

test("allows an origin whose host matches the host header", () => {
  expect(isSameOrigin(req({ origin: "https://app.test", host: "app.test" }))).toBe(true);
});

test("rejects an origin from a different host", () => {
  expect(isSameOrigin(req({ origin: "https://evil.example", host: "app.test" }))).toBe(false);
});

test("rejects an unparseable origin", () => {
  expect(isSameOrigin(req({ origin: "not-a-url", host: "app.test" }))).toBe(false);
});
