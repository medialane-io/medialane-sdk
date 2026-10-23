import { test, expect } from "bun:test";
import { ApiClient } from "./client.js";

function withStubbedFetch(responseData: unknown, run: (calls: Array<{ url: string; body: unknown }>) => Promise<void>) {
  const calls: Array<{ url: string; body: unknown }> = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string, init?: RequestInit) => {
    calls.push({ url, body: init?.body ? JSON.parse(init.body as string) : null });
    return new Response(JSON.stringify({ data: responseData }), { status: 201 });
  }) as typeof fetch;
  return run(calls).finally(() => {
    globalThis.fetch = originalFetch;
  });
}

const stubIntent = { id: "i1", requiresSignature: false, calls: [], expiresAt: "" };

test("createSponsorshipOfferIntent posts to /v1/intents/sponsorship-offer", async () => {
  await withStubbedFetch(stubIntent, async (calls) => {
    const client = new ApiClient({ baseUrl: "https://api.test", apiKey: "key" });
    const res = await client.intents.create("sponsorship-offer", {
      author: "0x1", nftContract: "0x2", tokenId: "5", minAmount: "1000000",
      duration: 86400, paymentToken: "0x3", licenseTermsUri: "ipfs://x",
      transferable: true, royaltyBps: 250,
    });
    expect(String(calls[0].url)).toContain("/v1/intents/sponsorship-offer");
    expect((calls[0].body as { author?: string }).author).toBe("0x1");
    expect(res.id).toBe("i1");
  });
});

test("setSponsorshipOfferOpenIntent posts to /v1/intents/sponsorship-offer-open", async () => {
  await withStubbedFetch(stubIntent, async (calls) => {
    const client = new ApiClient({ baseUrl: "https://api.test", apiKey: "key" });
    const res = await client.intents.create("sponsorship-offer-open", { author: "0x1", offerId: "1", open: false });
    expect(String(calls[0].url)).toContain("/v1/intents/sponsorship-offer-open");
    expect((calls[0].body as { open?: boolean }).open).toBe(false);
    expect(res.id).toBe("i1");
  });
});

test("placeSponsorshipBidIntent posts to /v1/intents/sponsorship-bid", async () => {
  await withStubbedFetch(stubIntent, async (calls) => {
    const client = new ApiClient({ baseUrl: "https://api.test", apiKey: "key" });
    const res = await client.intents.create("sponsorship-bid", {
      sponsor: "0x1", offerId: "1", amount: "1000000", paymentToken: "0x3",
    });
    expect(String(calls[0].url)).toContain("/v1/intents/sponsorship-bid");
    expect(String(calls[0].url)).not.toContain("retract");
    expect(String(calls[0].url)).not.toContain("accept");
    expect((calls[0].body as { sponsor?: string }).sponsor).toBe("0x1");
    expect(res.id).toBe("i1");
  });
});

test("retractSponsorshipBidIntent posts to /v1/intents/sponsorship-bid-retract", async () => {
  await withStubbedFetch(stubIntent, async (calls) => {
    const client = new ApiClient({ baseUrl: "https://api.test", apiKey: "key" });
    const res = await client.intents.create("sponsorship-bid-retract", { sponsor: "0x1", offerId: "1" });
    expect(String(calls[0].url)).toContain("/v1/intents/sponsorship-bid-retract");
    expect(res.id).toBe("i1");
  });
});

test("acceptSponsorshipBidIntent posts to /v1/intents/sponsorship-bid-accept", async () => {
  await withStubbedFetch(stubIntent, async (calls) => {
    const client = new ApiClient({ baseUrl: "https://api.test", apiKey: "key" });
    const res = await client.intents.create("sponsorship-bid-accept", { author: "0x1", offerId: "1", sponsor: "0x2" });
    expect(String(calls[0].url)).toContain("/v1/intents/sponsorship-bid-accept");
    expect((calls[0].body as { sponsor?: string }).sponsor).toBe("0x2");
    expect(res.id).toBe("i1");
  });
});

test("createSponsorshipProposalIntent posts to /v1/intents/sponsorship-proposal", async () => {
  await withStubbedFetch(stubIntent, async (calls) => {
    const client = new ApiClient({ baseUrl: "https://api.test", apiKey: "key" });
    const res = await client.intents.create("sponsorship-proposal", {
      proposer: "0x1", nftContract: "0x2", tokenId: "5", amount: "1000000",
      duration: 86400, paymentToken: "0x3", licenseTermsUri: "ipfs://x",
      transferable: true, royaltyBps: 250,
    });
    expect(String(calls[0].url)).toContain("/v1/intents/sponsorship-proposal");
    expect(String(calls[0].url)).not.toContain("withdraw");
    expect(String(calls[0].url)).not.toContain("accept");
    expect(String(calls[0].url)).not.toContain("reject");
    expect((calls[0].body as { proposer?: string }).proposer).toBe("0x1");
    expect(res.id).toBe("i1");
  });
});

test("withdrawSponsorshipProposalIntent posts to /v1/intents/sponsorship-proposal-withdraw", async () => {
  await withStubbedFetch(stubIntent, async (calls) => {
    const client = new ApiClient({ baseUrl: "https://api.test", apiKey: "key" });
    const res = await client.intents.create("sponsorship-proposal-withdraw", { proposer: "0x1", proposalId: "1" });
    expect(String(calls[0].url)).toContain("/v1/intents/sponsorship-proposal-withdraw");
    expect(res.id).toBe("i1");
  });
});

test("acceptSponsorshipProposalIntent posts to /v1/intents/sponsorship-proposal-accept", async () => {
  await withStubbedFetch(stubIntent, async (calls) => {
    const client = new ApiClient({ baseUrl: "https://api.test", apiKey: "key" });
    const res = await client.intents.create("sponsorship-proposal-accept", { owner: "0x1", proposalId: "1" });
    expect(String(calls[0].url)).toContain("/v1/intents/sponsorship-proposal-accept");
    expect(res.id).toBe("i1");
  });
});

test("rejectSponsorshipProposalIntent posts to /v1/intents/sponsorship-proposal-reject", async () => {
  await withStubbedFetch(stubIntent, async (calls) => {
    const client = new ApiClient({ baseUrl: "https://api.test", apiKey: "key" });
    const res = await client.intents.create("sponsorship-proposal-reject", { owner: "0x1", proposalId: "1" });
    expect(String(calls[0].url)).toContain("/v1/intents/sponsorship-proposal-reject");
    expect(res.id).toBe("i1");
  });
});
