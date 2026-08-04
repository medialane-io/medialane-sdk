import { test, expect } from "bun:test";
import { ApiClient } from "./client.js";
import type { CreateCollectionIntentParams, CreateMintIntentParams } from "../types/api.js";

test("CreateCollectionIntentParams accepts a factory-family service", () => {
  const params: CreateCollectionIntentParams = {
    owner: "0x1",
    name: "Test",
    symbol: "TST",
    service: "mip-erc1155",
  };
  expect(params.service).toBe("mip-erc1155");
});

test("CreateMintIntentParams accepts factory-family mint fields (mip-erc1155 shape)", () => {
  const params: CreateMintIntentParams = {
    owner: "0x1",
    recipient: "0x2",
    collectionContract: "0x3",
    tokenUri: "ipfs://x",
    value: "1",
    royaltyBps: 0,
  };
  expect(params.value).toBe("1");
});

test("CreateMintIntentParams accepts factory-family mint fields (ip-tickets/ip-club shape)", () => {
  const params: CreateMintIntentParams = {
    owner: "0x1",
    recipient: "0x2",
    collectionContract: "0x3",
    tokenId: "5",
    amount: "10",
    royaltyBps: 0,
  };
  expect(params.tokenId).toBe("5");
});

test("createCollectionIntent posts service through to the request body", async () => {
  const calls: unknown[] = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (_url: string, init?: RequestInit) => {
    calls.push(init?.body ? JSON.parse(init.body as string) : null);
    return new Response(JSON.stringify({ data: { id: "i1", requiresSignature: false, calls: [], expiresAt: "" } }), { status: 201 });
  }) as typeof fetch;
  try {
    const client = new ApiClient("https://api.test", "key");
    await client.createCollectionIntent({ owner: "0x1", name: "Test", symbol: "TST", service: "ip-tickets" });
    expect((calls[0] as { service?: string }).service).toBe("ip-tickets");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
