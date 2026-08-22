import { test, expect } from "bun:test";
import {
  isPrivateHost,
  validateUrl,
  ALLOWED_IMAGE_CONTENT_TYPES,
  MAX_IMAGE_PROXY_BYTES,
} from "./ssrf-guard.js";

test("blocks loopback in every notation", () => {
  for (const h of ["localhost", "127.0.0.1", "0.0.0.0", "::1", "2130706433", "0x7f000001", "017700000001".replace("017700000001", "0177.0.0.1")]) {
    expect(isPrivateHost(h)).toBe(true);
  }
});

test("blocks the RFC1918 ranges", () => {
  for (const h of ["10.0.0.1", "172.16.0.1", "172.31.255.255", "192.168.1.1"]) {
    expect(isPrivateHost(h)).toBe(true);
  }
});

test("blocks link-local and carrier-grade NAT", () => {
  expect(isPrivateHost("169.254.169.254")).toBe(true);
  expect(isPrivateHost("100.64.0.1")).toBe(true);
});

test("blocks IPv6 link-local and unique-local", () => {
  expect(isPrivateHost("fe80::1")).toBe(true);
  expect(isPrivateHost("fc00::1")).toBe(true);
  expect(isPrivateHost("fd00::1")).toBe(true);
});

test("blocks IPv4-mapped IPv6 loopback and private ranges", () => {
  expect(isPrivateHost("::ffff:127.0.0.1")).toBe(true);
  expect(isPrivateHost("::ffff:10.0.0.1")).toBe(true);
});

test("blocks cloud metadata endpoints and .local", () => {
  expect(isPrivateHost("metadata.google.internal")).toBe(true);
  expect(isPrivateHost("metadata.azure.internal")).toBe(true);
  expect(isPrivateHost("printer.local")).toBe(true);
});

test("allows ordinary public hosts", () => {
  for (const h of ["ipfs.io", "example.com", "8.8.8.8", "172.32.0.1", "11.0.0.1"]) {
    expect(isPrivateHost(h)).toBe(false);
  }
});

test("validateUrl requires https", () => {
  expect(validateUrl("http://example.com/a.png")).toHaveProperty("error");
  expect(validateUrl("https://example.com/a.png")).toHaveProperty("url");
});

test("validateUrl rejects embedded credentials", () => {
  const out = validateUrl("https://user:pass@example.com/a.png");
  expect(out).toHaveProperty("error");
});

test("validateUrl rejects a private host and unparseable input", () => {
  expect(validateUrl("https://127.0.0.1/a.png")).toHaveProperty("error");
  expect(validateUrl("not a url")).toHaveProperty("error");
});

test("the content-type allowlist covers the common image types and excludes others", () => {
  for (const t of ["image/jpeg", "image/png", "image/webp", "image/avif", "image/svg+xml"]) {
    expect(ALLOWED_IMAGE_CONTENT_TYPES.has(t)).toBe(true);
  }
  for (const t of ["text/html", "application/javascript", "application/pdf"]) {
    expect(ALLOWED_IMAGE_CONTENT_TYPES.has(t)).toBe(false);
  }
});

test("the byte cap is 15MB", () => {
  expect(MAX_IMAGE_PROXY_BYTES).toBe(15 * 1024 * 1024);
});
