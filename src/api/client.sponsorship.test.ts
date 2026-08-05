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
    const client = new ApiClient("https://api.test", "key");
    const res = await client.createSponsorshipOfferIntent({
      author: "0x1", nftContract: "0x2", tokenId: "5", minAmount: "1000000",
      duration: 86400, paymentToken: "0x3", licenseTermsUri: "ipfs://x",
      transferable: true, royaltyBps: 250,
    });
    expect(String(calls[0].url)).toContain("/v1/intents/sponsorship-offer");
    expect((calls[0].body as { author?: string }).author).toBe("0x1");
    expect(res.data.id).toBe("i1");
  });
});

test("setSponsorshipOfferOpenIntent posts to /v1/intents/sponsorship-offer-open", async () => {
  await withStubbedFetch(stubIntent, async (calls) => {
    const client = new ApiClient("https://api.test", "key");
    const res = await client.setSponsorshipOfferOpenIntent({ author: "0x1", offerId: "1", open: false });
    expect(String(calls[0].url)).toContain("/v1/intents/sponsorship-offer-open");
    expect((calls[0].body as { open?: boolean }).open).toBe(false);
    expect(res.data.id).toBe("i1");
  });
});

test("placeSponsorshipBidIntent posts to /v1/intents/sponsorship-bid", async () => {
  await withStubbedFetch(stubIntent, async (calls) => {
    const client = new ApiClient("https://api.test", "key");
    const res = await client.placeSponsorshipBidIntent({
      sponsor: "0x1", offerId: "1", amount: "1000000", paymentToken: "0x3",
    });
    expect(String(calls[0].url)).toContain("/v1/intents/sponsorship-bid");
    expect(String(calls[0].url)).not.toContain("retract");
    expect(String(calls[0].url)).not.toContain("accept");
    expect((calls[0].body as { sponsor?: string }).sponsor).toBe("0x1");
    expect(res.data.id).toBe("i1");
  });
});

test("retractSponsorshipBidIntent posts to /v1/intents/sponsorship-bid-retract", async () => {
  await withStubbedFetch(stubIntent, async (calls) => {
    const client = new ApiClient("https://api.test", "key");
    const res = await client.retractSponsorshipBidIntent({ sponsor: "0x1", offerId: "1" });
    expect(String(calls[0].url)).toContain("/v1/intents/sponsorship-bid-retract");
    expect(res.data.id).toBe("i1");
  });
});

test("acceptSponsorshipBidIntent posts to /v1/intents/sponsorship-bid-accept", async () => {
  await withStubbedFetch(stubIntent, async (calls) => {
    const client = new ApiClient("https://api.test", "key");
    const res = await client.acceptSponsorshipBidIntent({ author: "0x1", offerId: "1", sponsor: "0x2" });
    expect(String(calls[0].url)).toContain("/v1/intents/sponsorship-bid-accept");
    expect((calls[0].body as { sponsor?: string }).sponsor).toBe("0x2");
    expect(res.data.id).toBe("i1");
  });
});

test("createSponsorshipProposalIntent posts to /v1/intents/sponsorship-proposal", async () => {
  await withStubbedFetch(stubIntent, async (calls) => {
    const client = new ApiClient("https://api.test", "key");
    const res = await client.createSponsorshipProposalIntent({
      proposer: "0x1", nftContract: "0x2", tokenId: "5", amount: "1000000",
      duration: 86400, paymentToken: "0x3", licenseTermsUri: "ipfs://x",
      transferable: true, royaltyBps: 250,
    });
    expect(String(calls[0].url)).toContain("/v1/intents/sponsorship-proposal");
    expect(String(calls[0].url)).not.toContain("withdraw");
    expect(String(calls[0].url)).not.toContain("accept");
    expect(String(calls[0].url)).not.toContain("reject");
    expect((calls[0].body as { proposer?: string }).proposer).toBe("0x1");
    expect(res.data.id).toBe("i1");
  });
});

test("withdrawSponsorshipProposalIntent posts to /v1/intents/sponsorship-proposal-withdraw", async () => {
  await withStubbedFetch(stubIntent, async (calls) => {
    const client = new ApiClient("https://api.test", "key");
    const res = await client.withdrawSponsorshipProposalIntent({ proposer: "0x1", proposalId: "1" });
    expect(String(calls[0].url)).toContain("/v1/intents/sponsorship-proposal-withdraw");
    expect(res.data.id).toBe("i1");
  });
});

test("acceptSponsorshipProposalIntent posts to /v1/intents/sponsorship-proposal-accept", async () => {
  await withStubbedFetch(stubIntent, async (calls) => {
    const client = new ApiClient("https://api.test", "key");
    const res = await client.acceptSponsorshipProposalIntent({ owner: "0x1", proposalId: "1" });
    expect(String(calls[0].url)).toContain("/v1/intents/sponsorship-proposal-accept");
    expect(res.data.id).toBe("i1");
  });
});

test("rejectSponsorshipProposalIntent posts to /v1/intents/sponsorship-proposal-reject", async () => {
  await withStubbedFetch(stubIntent, async (calls) => {
    const client = new ApiClient("https://api.test", "key");
    const res = await client.rejectSponsorshipProposalIntent({ owner: "0x1", proposalId: "1" });
    expect(String(calls[0].url)).toContain("/v1/intents/sponsorship-proposal-reject");
    expect(res.data.id).toBe("i1");
  });
});
