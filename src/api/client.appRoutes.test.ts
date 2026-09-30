import { test, expect } from "bun:test";
import { ApiClient } from "./client.js";

type Call = { url: string; method: string; auth: string | null; body: unknown };

async function withStub(response: unknown, run: (client: ApiClient, calls: Call[]) => Promise<void>) {
  const calls: Call[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = (async (url: string, init?: RequestInit) => {
    const headers = (init?.headers ?? {}) as Record<string, string>;
    calls.push({
      url: String(url),
      method: init?.method ?? "GET",
      auth: headers.Authorization ?? null,
      body: init?.body ? JSON.parse(init.body as string) : null,
    });
    return new Response(JSON.stringify(response), { status: 200 });
  }) as typeof fetch;
  try {
    await run(new ApiClient("https://api.test", "key"), calls);
  } finally {
    globalThis.fetch = original;
  }
}

const A = "0x" + "a".repeat(64);
const W = "0x" + "b".repeat(64);

test("drop collections are asked for by their canonical service id", async () => {
  await withStub({ data: [] }, async (client, calls) => {
    await client.getDropCollections();
    await client.getPopCollections();
    expect(calls[0].url).toContain("service=drop-collection");
    expect(calls[1].url).toContain("service=pop-protocol");
  });
});

test("coins can be sorted", async () => {
  await withStub({ data: [] }, async (client, calls) => {
    await client.getCoins({ limit: 24, service: "creator-coin", sort: "recent" });
    expect(calls[0].url).toContain("/v1/coins?");
    expect(calls[0].url).toContain("sort=recent");
    expect(calls[0].url).toContain("service=creator-coin");
  });
});

test("on-chain reads return the route's data", async () => {
  const tier = { maxSupply: "10", minted: "2", startTime: null, endTime: null, royaltyBps: 0 };
  await withStub({ data: tier }, async (client, calls) => {
    expect(await client.getTicket(A, "1")).toEqual(tier);
    expect(await client.getClubMembership(A, "1")).toEqual(tier);
    expect(calls.map((c) => new URL(c.url).pathname)).toEqual([`/v1/tickets/${A}/1`, `/v1/club/${A}/1`]);
  });
  await withStub({ data: { isMember: true } }, async (client, calls) => {
    expect(await client.isClubMember(A, "1", W)).toBe(true);
    expect(new URL(calls[0].url).pathname).toBe(`/v1/club/${A}/1/member/${W}`);
  });
  await withStub({ data: { count: 3 } }, async (client) => {
    expect(await client.getTicketCount(A)).toBe(3);
  });
});

test("drop info and state read their routes", async () => {
  await withStub({ data: { contractAddress: A } }, async (client, calls) => {
    expect((await client.getDropInfo(A))?.contractAddress).toBe(A);
    await client.getDropState(A);
    expect(calls.map((c) => new URL(c.url).pathname)).toEqual([`/v1/drop/${A}/info`, `/v1/drop/${A}/state`]);
  });
});

test("tokens can be filtered by IP type and derivatives", async () => {
  await withStub({ data: [] }, async (client, calls) => {
    await client.getTokens({ page: 2, limit: 24, sort: "recent", ipType: "music", derivatives: "allowed" });
    const q = new URL(calls[0].url).searchParams;
    expect(new URL(calls[0].url).pathname).toBe("/v1/tokens");
    expect(q.get("page")).toBe("2");
    expect(q.get("ipType")).toBe("music");
    expect(q.get("derivatives")).toBe("allowed");
  });
});

test("username claims carry the caller's token", async () => {
  await withStub({ claim: { id: "c1" }, username: null }, async (client, calls) => {
    await client.getMyUsernameClaim("t1");
    const claim = await client.submitUsernameClaim("ana", "t1", "ana@example.com");
    expect(claim.id).toBe("c1");
    expect(calls[0].auth).toBe("Bearer t1");
    expect(calls[1].method).toBe("POST");
    expect(calls[1].body).toEqual({ username: "ana", notifyEmail: "ana@example.com" });
  });
});

test("a report is posted with the caller's token", async () => {
  await withStub({ data: { id: "r1" } }, async (client, calls) => {
    await client.submitReport({ targetType: "TOKEN", targetContract: A, targetTokenId: "1", categories: ["SCAM_FRAUD"] }, "t1");
    expect(new URL(calls[0].url).pathname).toBe("/v1/reports");
    expect(calls[0].method).toBe("POST");
    expect(calls[0].auth).toBe("Bearer t1");
  });
});

test("generating a wallet posts the new wallet's token", async () => {
  await withStub({ walletAddress: W }, async (client, calls) => {
    expect((await client.generateWallet("new", "t1")).walletAddress).toBe(W);
    expect(calls[0].body).toEqual({ newWalletSiwsToken: "new" });
    expect(calls[0].auth).toBe("Bearer t1");
  });
});

test("sponsorship lists pass their filters", async () => {
  await withStub({ data: [] }, async (client, calls) => {
    await client.getSponsorshipOffers({ author: W, open: true });
    await client.getSponsorshipProposals({ owner: W, open: false });
    await client.getSponsorshipLicenses({ holder: W });
    const [o, p, l] = calls.map((c) => new URL(c.url));
    expect(o.pathname).toBe("/v1/sponsorship/offers");
    expect(o.searchParams.get("open")).toBe("true");
    expect(p.searchParams.get("owner")).toBe(W);
    expect(l.searchParams.get("holder")).toBe(W);
    expect(o.searchParams.get("limit")).toBe("50");
  });
});

test("platform stats, hidden creators, coin sync and collection register use their routes", async () => {
  await withStub({ data: { collections: 1, tokens: 2, sales: 3 }, isHidden: true }, async (client, calls) => {
    expect((await client.getPlatformStats()).sales).toBe(3);
    expect(await client.isCreatorHidden(W)).toBe(true);
    await client.syncCoin(A);
    await client.registerCollection(A);
    expect(calls.map((c) => `${c.method} ${new URL(c.url).pathname}`)).toEqual([
      "GET /v1/stats",
      `GET /v1/creators/${W}/hidden`,
      "POST /v1/coins/sync",
      "POST /v1/collections/register",
    ]);
  });
});

test("received offers and directory uploads use their routes", async () => {
  await withStub({ data: { cid: "bafy", baseUri: "ipfs://bafy/" } }, async (client, calls) => {
    await client.getReceivedOffers(W);
    expect((await client.uploadMetadataDirectory([{ name: "1.json", content: {} }])).baseUri).toBe("ipfs://bafy/");
    expect(new URL(calls[0].url).pathname).toBe(`/v1/orders/received/${W}`);
    expect(new URL(calls[0].url).searchParams.get("limit")).toBe("50");
    expect(calls[1].body).toEqual({ files: [{ name: "1.json", content: {} }] });
  });
});

test("coins can be listed by creator", async () => {
  await withStub({ data: [] }, async (client, calls) => {
    await client.getCoins({ creator: W, limit: 100 });
    expect(new URL(calls[0].url).searchParams.get("creator")).toBe(W);
  });
});

test("collections can be listed by owner and service together", async () => {
  await withStub({ data: [] }, async (client, calls) => {
    await client.listCollections({ owner: W, service: "drop-collection", limit: 50 });
    await client.listCollections({ isFeatured: true, hideEmpty: true, sort: "recent", limit: 8 });
    const [a, b] = calls.map((c) => new URL(c.url));
    expect(a.pathname).toBe("/v1/collections");
    expect(a.searchParams.get("owner")).toBe(W);
    expect(a.searchParams.get("service")).toBe("drop-collection");
    expect(b.searchParams.get("isFeatured")).toBe("true");
    expect(b.searchParams.get("hideEmpty")).toBe("true");
  });
});

test("remix offers can be filtered by status", async () => {
  await withStub({ data: [] }, async (client, calls) => {
    await client.getRemixOffers({ role: "creator", status: "PENDING" }, "t1");
    expect(new URL(calls[0].url).searchParams.get("status")).toBe("PENDING");
  });
});

test("a report's target key is built from its target", async () => {
  await withStub({ data: {} }, async (client, calls) => {
    await client.submitReport({ targetType: "TOKEN", targetContract: "0x1", targetTokenId: "7", categories: ["SCAM_FRAUD"] }, "t1");
    await client.submitReport({ targetType: "COLLECTION", targetContract: "0x1", categories: ["SCAM_FRAUD"] }, "t1");
    await client.submitReport({ targetType: "CREATOR", targetAddress: "0x2", categories: ["SCAM_FRAUD"] }, "t1");
    await client.submitReport({ targetType: "COMMENT", targetId: "c9", categories: ["SCAM_FRAUD"] }, "t1");
    const pad = (h: string) => "0x" + h.replace(/^0x/, "").padStart(64, "0");
    expect(calls.map((c) => (c.body as { targetKey: string }).targetKey)).toEqual([
      `TOKEN:${pad("0x1")}:7`,
      `COLLECTION:${pad("0x1")}`,
      `CREATOR:${pad("0x2")}`,
      "COMMENT::c9",
    ]);
    expect((calls[0].body as { targetContract: string }).targetContract).toBe(pad("0x1"));
  });
});

test("a report with no usable target is refused before any request", async () => {
  await withStub({ data: {} }, async (client, calls) => {
    await expect(client.submitReport({ targetType: "TOKEN", targetContract: "0x1", categories: ["X"] }, "t1")).rejects.toThrow();
    expect(calls).toHaveLength(0);
  });
});

test("pricing is read from the public pricing route", async () => {
  await withStub({ creditsPerUsdc: 100, pricing: { default: 1, rules: [] } }, async (client, calls) => {
    expect((await client.getPricing()).creditsPerUsdc).toBe(100);
    expect(new URL(calls[0].url).pathname).toBe("/v1/pricing");
  });
});
