import { describe, test, expect } from "bun:test";
import {
  isTransientRpcError,
  isPolicyRefusal,
  POLICY_REFUSAL_CODES,
  PUBLIC_RPC_FALLBACKS,
  PAID_UPSTREAM_MARKERS,
} from "./rpc.js";

describe("policy refusals are terminal", () => {
  const refusals = [
    { code: -32003, message: "Insufficient credits or billing unavailable — RPC call not forwarded" },
    { code: -32005, message: "Too many requests" },
    { code: -32600, message: "Cross-origin requests are not allowed" },
  ];

  test("our own refusal codes are never transient, as objects", () => {
    for (const error of refusals) {
      expect(`${error.code}:${isTransientRpcError({ status: 402, body: { error } })}`).toBe(`${error.code}:false`);
    }
  });

  test("our own refusal codes are never transient, as unparsed text", () => {
    for (const error of refusals) {
      const body = JSON.stringify({ jsonrpc: "2.0", error, id: null });
      expect(`${error.code}:${isTransientRpcError({ status: 429, body })}`).toBe(`${error.code}:false`);
    }
  });

  test("genuine upstream flakiness is still transient", () => {
    expect(isTransientRpcError({ status: 503, body: "service unavailable" })).toBe(true);
    expect(isTransientRpcError({ status: 200, body: { error: { code: -32603, message: "internal" } } })).toBe(true);
    expect(isTransientRpcError({ status: 429, body: { error: { code: -32001, message: "rate limit" } } })).toBe(true);
  });
});

test("no keyless endpoint is offered as a fallback", () => {
  expect(PUBLIC_RPC_FALLBACKS).toEqual([]);
});

test("the lava gateway is treated as a paid upstream", () => {
  expect(PAID_UPSTREAM_MARKERS).toContain("g.w.lavanet.xyz");
});

test("the retired public endpoint is gone from every list", () => {
  expect(PUBLIC_RPC_FALLBACKS).not.toContain("https://rpc.starknet.lava.build");
  expect(PAID_UPSTREAM_MARKERS).not.toContain("rpc.starknet.lava.build");
});
