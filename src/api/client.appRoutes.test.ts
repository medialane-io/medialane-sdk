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
    await run(new ApiClient({ baseUrl: "https://api.test", apiKey: "key" }), calls);
  } finally {
    globalThis.fetch = original;
  }
}

const A = "0x" + "a".repeat(64);
const W = "0x" + "b".repeat(64);

test("collections are listed through one method, filtered by standard too", async () => {
  await withStub({ data: [] }, async (client, calls) => {
    await client.collections.list({ service: "drop-collection", standard: "ERC1155" });
    const q = new URL(calls[0].url).searchParams;
    expect(q.get("service")).toBe("drop-collection");
    expect(q.get("standard")).toBe("ERC1155");
  });
});

test("the older collection list methods are gone", () => {
  const client = new ApiClient({ baseUrl: "https://api.test", apiKey: "key" }) as unknown as Record<string, unknown>;
  for (const name of ["getCollections", "getCollectionsByOwner", "getDropCollections", "getPopCollections"]) {
    expect(client[name]).toBeUndefined();
  }
});

test("a club's tier count is read from its count route", async () => {
  await withStub({ data: { count: 4 } }, async (client, calls) => {
    expect(await client.chainReads.clubMembershipCount(A)).toBe(4);
    expect(new URL(calls[0].url).pathname).toBe(`/v1/club/${A}/count`);
  });
});

test("coins can be sorted", async () => {
  await withStub({ data: [] }, async (client, calls) => {
    await client.coins.list({ limit: 24, service: "creator-coin", sort: "recent" });
    expect(calls[0].url).toContain("/v1/coins?");
    expect(calls[0].url).toContain("sort=recent");
    expect(calls[0].url).toContain("service=creator-coin");
  });
});

test("on-chain reads return the route's data", async () => {
  const tier = { maxSupply: "10", minted: "2", startTime: null, endTime: null, royaltyBps: 0 };
  await withStub({ data: tier }, async (client, calls) => {
    expect(await client.chainReads.ticket(A, "1")).toEqual(tier);
    expect(await client.chainReads.clubMembership(A, "1")).toEqual(tier);
    expect(calls.map((c) => new URL(c.url).pathname)).toEqual([`/v1/tickets/${A}/1`, `/v1/club/${A}/1`]);
  });
  await withStub({ data: { isMember: true } }, async (client, calls) => {
    expect(await client.chainReads.isClubMember(A, "1", W)).toBe(true);
    expect(new URL(calls[0].url).pathname).toBe(`/v1/club/${A}/1/member/${W}`);
  });
  await withStub({ data: { count: 3 } }, async (client) => {
    expect(await client.chainReads.ticketCount(A)).toBe(3);
  });
});

test("drop fee reads its route", async () => {
  await withStub({ data: { launchpadBps: 100 } }, async (client, calls) => {
    expect(await client.drops.fee()).toEqual({ launchpadBps: 100 });
    expect(new URL(calls[0].url).pathname).toBe("/v1/drops/fee");
  });
});

test("tokens can be filtered by IP type and derivatives", async () => {
  await withStub({ data: [] }, async (client, calls) => {
    await client.tokens.list({ page: 2, limit: 24, sort: "recent", ipType: "music", derivatives: "allowed" });
    const q = new URL(calls[0].url).searchParams;
    expect(new URL(calls[0].url).pathname).toBe("/v1/tokens");
    expect(q.get("page")).toBe("2");
    expect(q.get("ipType")).toBe("music");
    expect(q.get("derivatives")).toBe("allowed");
  });
});

test("username claims carry the caller's token", async () => {
  await withStub({ claim: { id: "c1" }, username: null }, async (client, calls) => {
    await client.withBearer("t1").creators.myUsernameClaim();
    const claim = await client.withBearer("t1").creators.submitUsernameClaim("ana", "ana@example.com");
    expect(claim.id).toBe("c1");
    expect(calls[0].auth).toBe("Bearer t1");
    expect(calls[1].method).toBe("POST");
    expect(calls[1].body).toEqual({ username: "ana", notifyEmail: "ana@example.com" });
  });
});

test("a report is posted with the caller's token", async () => {
  await withStub({ data: { id: "r1" } }, async (client, calls) => {
    await client.withBearer("t1").platform.submitReport({ targetType: "TOKEN", targetContract: A, targetTokenId: "1", categories: ["SCAM_FRAUD"] });
    expect(new URL(calls[0].url).pathname).toBe("/v1/reports");
    expect(calls[0].method).toBe("POST");
    expect(calls[0].auth).toBe("Bearer t1");
  });
});

test("generating a wallet posts the new wallet's token", async () => {
  await withStub({ walletAddress: W }, async (client, calls) => {
    expect((await client.withBearer("t1").account.generateWallet("new")).walletAddress).toBe(W);
    expect(calls[0].body).toEqual({ newWalletSiwsToken: "new" });
    expect(calls[0].auth).toBe("Bearer t1");
  });
});

test("sponsorship lists pass their filters", async () => {
  await withStub({ data: [] }, async (client, calls) => {
    await client.sponsorship.offers({ author: W, open: true });
    await client.sponsorship.proposals({ owner: W, open: false });
    await client.sponsorship.licenses({ holder: W });
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
    expect((await client.platform.stats()).sales).toBe(3);
    expect(await client.creators.isHidden(W)).toBe(true);
    await client.coins.sync(A);
    await client.collections.register(A);
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
    await client.orders.receivedBy(W);
    expect((await client.metadata.uploadDirectory([{ name: "1.json", content: {} }])).baseUri).toBe("ipfs://bafy/");
    expect(new URL(calls[0].url).pathname).toBe(`/v1/orders/received/${W}`);
    expect(new URL(calls[0].url).searchParams.get("limit")).toBe("50");
    expect(calls[1].body).toEqual({ files: [{ name: "1.json", content: {} }] });
  });
});

test("coins can be listed by creator", async () => {
  await withStub({ data: [] }, async (client, calls) => {
    await client.coins.list({ creator: W, limit: 100 });
    expect(new URL(calls[0].url).searchParams.get("creator")).toBe(W);
  });
});

test("collections can be listed by owner and service together", async () => {
  await withStub({ data: [] }, async (client, calls) => {
    await client.collections.list({ owner: W, service: "drop-collection", limit: 50 });
    await client.collections.list({ isFeatured: true, hideEmpty: true, sort: "recent", limit: 8 });
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
    await client.withBearer("t1").remix.list({ role: "creator", status: "PENDING" });
    expect(new URL(calls[0].url).searchParams.get("status")).toBe("PENDING");
  });
});

test("a report's target key is built from its target", async () => {
  await withStub({ data: {} }, async (client, calls) => {
    await client.withBearer("t1").platform.submitReport({ targetType: "TOKEN", targetContract: "0x1", targetTokenId: "7", categories: ["SCAM_FRAUD"] });
    await client.withBearer("t1").platform.submitReport({ targetType: "COLLECTION", targetContract: "0x1", categories: ["SCAM_FRAUD"] });
    await client.withBearer("t1").platform.submitReport({ targetType: "CREATOR", targetAddress: "0x2", categories: ["SCAM_FRAUD"] });
    await client.withBearer("t1").platform.submitReport({ targetType: "COMMENT", targetId: "c9", categories: ["SCAM_FRAUD"] });
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
    await expect(client.withBearer("t1").platform.submitReport({ targetType: "TOKEN", targetContract: "0x1", categories: ["X"] })).rejects.toThrow();
    expect(calls).toHaveLength(0);
  });
});

test("pricing is read from the public pricing route", async () => {
  await withStub({ creditsPerUsdc: 100, pricing: { default: 1, rules: [] } }, async (client, calls) => {
    expect((await client.portal.pricing()).creditsPerUsdc).toBe(100);
    expect(new URL(calls[0].url).pathname).toBe("/v1/pricing");
  });
});

test("a single sponsorship offer and proposal are read, and a missing one is null", async () => {
  await withStub({ data: { offerId: "1" } }, async (client, calls) => {
    expect((await client.sponsorship.findOffer("1"))?.offerId).toBe("1");
    await client.sponsorship.findProposal("2");
    expect(calls.map((c) => new URL(c.url).pathname)).toEqual(["/v1/sponsorship/offers/1", "/v1/sponsorship/proposals/2"]);
  });
  const original = globalThis.fetch;
  globalThis.fetch = (async () => new Response(JSON.stringify({ error: "Offer not found" }), { status: 404 })) as unknown as typeof fetch;
  try {
    const client = new ApiClient({ baseUrl: "https://api.test", apiKey: "key" });
    expect(await client.sponsorship.findOffer("9")).toBeNull();
    expect(await client.sponsorship.findProposal("9")).toBeNull();
  } finally {
    globalThis.fetch = original;
  }
});

test("a collection looked up by slug is the collection, not its response envelope", async () => {
  await withStub({ data: { contractAddress: A, name: "C" } }, async (client) => {
    expect((await client.collections.findBySlug("c"))?.contractAddress).toBe(A);
  });
});

test("coin guarantees are read from the backend", async () => {
  await withStub({ data: { isLaunched: true } }, async (client, calls) => {
    expect(await client.chainReads.coinGuarantees(A)).toEqual({ isLaunched: true } as never);
    expect(new URL(calls[0].url).pathname).toBe(`/v1/coins/${A}/guarantees`);
  });
});

test("POP claim info is read from the backend", async () => {
  await withStub({ data: { root: "0x5", claimEndTime: 0 } }, async (client, calls) => {
    expect(await client.chainReads.popClaimInfo(W)).toEqual({ root: "0x5", claimEndTime: 0 });
    expect(new URL(calls[0].url).pathname).toBe(`/v1/pop/${W}/claim-info`);
  });
});

test("a swap quote is requested from the backend", async () => {
  const quote = { quoteId: "q", sellTokenAddress: A, sellAmount: "1", buyTokenAddress: W, buyAmount: "2" };
  await withStub({ quote }, async (client, calls) => {
    expect(await client.platform.swapQuote({ sellSymbol: "USDC", buySymbol: "STRK", buyAmountRaw: "2" })).toEqual(quote);
    expect(calls[0]).toMatchObject({ method: "POST", body: { sellSymbol: "USDC", buySymbol: "STRK", buyAmountRaw: "2" } });
    expect(new URL(calls[0].url).pathname).toBe("/v1/swap/quote");
  });
});

test("a drop's state is read from the backend, amounts as bigints", async () => {
  await withStub(
    { data: { organizer: A, startTime: 1, endTime: 2, price: "5", paymentToken: W, maxPerWallet: "3", allowlistRoot: "0x0", maxSupply: "10", totalMinted: "4" } },
    async (client, calls) => {
      expect(await client.chainReads.dropState(A)).toEqual({
        organizer: A, startTime: 1, endTime: 2, price: 5n, paymentToken: W, maxPerWallet: 3n, allowlistRoot: "0x0", maxSupply: 10n, totalMinted: 4n,
      });
      expect(new URL(calls[0].url).pathname).toBe(`/v1/drops/${A}/state`);
    },
  );
});

test("a drop the backend cannot read is null", async () => {
  await withStub({ data: null }, async (client) => {
    expect(await client.chainReads.dropState(A)).toBeNull();
  });
});

test("a token balance is read for one owner", async () => {
  await withStub({ data: { owner: W, amount: "3" } }, async (client, calls) => {
    const res = await client.tokens.balance(A, "7", W);
    expect(new URL(calls[0].url).pathname).toBe(`/v1/tokens/${A}/7/balances/${W}`);
    expect(res.amount).toBe("3");
  });
});
