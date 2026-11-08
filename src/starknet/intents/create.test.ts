import { describe, expect, test } from "bun:test";
import type { RpcProvider } from "starknet";
import { resolveConfig } from "../../config.js";
import { ACTION_PROBLEM, MedialaneApiError, UserFacingError } from "../../errors.js";
import type { ApiIntentCreated, ApiOrder } from "../../types/api.js";
import { buildIntent } from "./build.js";
import { createCheckout, createIntent } from "./create.js";
import fulfillFixtures from "./fulfill.fixtures.json";
import swapFixturesJson from "./swap.fixtures.json";
import { typedDataMatches } from "./compare.js";

const config = resolveConfig({});
const OFFERER = "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const NFT = "0x0222222222222222222222222222222222222222222222222222222222222222";
const STRK = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";
const provider = {
  callContract: async ({ entrypoint }: { entrypoint: string }) => (entrypoint === "get_counter" ? ["0x5"] : ["0x0", "0x1f4"]),
} as unknown as RpcProvider;
const orders = { get: async (): Promise<ApiOrder> => { throw new MedialaneApiError(404, "Not found"); } };

function sources(answer: (body: Record<string, unknown>) => ApiIntentCreated | Promise<ApiIntentCreated>) {
  const sent: Array<{ kind: string; body: Record<string, unknown> }> = [];
  const intents = {
    create: async (kind: string, body: unknown) => {
      sent.push({ kind, body: body as Record<string, unknown> });
      return answer(body as Record<string, unknown>);
    },
  };
  return { sources: { provider, orders, config, intents: intents as never }, sent };
}

const listing = { offerer: OFFERER, nftContract: NFT, tokenId: "42", currency: STRK, price: "1.5", endTime: 1_900_000_000 };

describe("creating an intent", () => {
  test("a listing is built locally and sent with its build", async () => {
    const { sources: s, sent } = sources(() => ({ id: "i1", expiresAt: "x", requiresSignature: true, typedData: { server: true } }));
    const created = await createIntent(s, "listing", listing);
    const body = sent[0]!.body as Record<string, unknown> & { salt: string; startTime: number; built: { typedData: unknown } };
    expect(typeof body.salt).toBe("string");
    expect(Math.abs(body.startTime - (Math.floor(Date.now() / 1000) + 30))).toBeLessThanOrEqual(2);
    const expected = buildIntent("listing", { ...listing, salt: body.salt, startTime: body.startTime }, { counter: "5", royaltyMaxBps: "500" }, config);
    expect(typedDataMatches(body.built.typedData, expected.typedData)).toBe(true);
    expect(created.local?.kind).toBe("listing");
  });

  test("the intent keeps the local typed data even if the server returned different typed data", async () => {
    const { sources: s } = sources(() => ({ id: "i1", expiresAt: "x", requiresSignature: true, typedData: { server: true } }));
    const created = await createIntent(s, "listing", listing);
    expect(created.requiresSignature && created.typedData).toEqual(created.local!.built.typedData);
  });

  test("a salt and start time the app chose are kept", async () => {
    const { sources: s, sent } = sources(() => ({ id: "i1", expiresAt: "x", requiresSignature: true, typedData: {} }));
    const startTime = Math.floor(Date.now() / 1000) + 60;
    await createIntent(s, "listing", { ...listing, salt: "0xabc", startTime });
    expect(sent[0]!.body).toMatchObject({ salt: "0xabc", startTime });
  });

  test("a kind without a builder is created as before", async () => {
    const { sources: s, sent } = sources(() => ({ id: "i2", expiresAt: "x", requiresSignature: false, calls: [] }));
    const params = { author: OFFERER, nftContract: NFT, tokenId: "1", text: "hi" };
    const created = await createIntent(s, "comment", params);
    expect(sent[0]!.body).toEqual(params);
    expect(created.local).toBeUndefined();
  });

  test("an intent_mismatch answer surfaces the neutral message", async () => {
    const { sources: s } = sources(() => {
      throw new MedialaneApiError(422, "The submitted build does not match the request", undefined, undefined, "/v1/intents/listing", "intent_mismatch");
    });
    const failure = await createIntent(s, "listing", listing).catch((e: unknown) => e);
    expect(failure).toBeInstanceOf(UserFacingError);
    expect((failure as Error).message).toBe("We had a problem with this action. If this error persists please contact our support.");
  });
});

describe("creating a checkout", () => {
  const listedOrder = fulfillFixtures.listing721.order;
  const withOrder = { ...{ provider, config }, orders: { get: async () => listedOrder as unknown as ApiOrder } };

  test("each item is built locally, sent with its build, and returned with it", async () => {
    const sent: unknown[] = [];
    const intents = {
      checkout: async (body: unknown) => {
        sent.push(body);
        return [{ id: "c1", orderHash: "0xaa", calls: [{ contractAddress: "0xserver", entrypoint: "x", calldata: [] }] }, { orderHash: "0xbb", error: "gone" }];
      },
    };
    const results = await createCheckout({ ...withOrder, intents: intents as never }, { fulfiller: OFFERER, items: [{ orderHash: "0xaa" }, { orderHash: "0xbb" }] });
    const body = sent[0] as { items: Array<{ orderHash: string; built: { calls: Array<{ entrypoint: string }> } }> };
    expect(body.items.map((i) => i.built.calls.map((c) => c.entrypoint))).toEqual([["approve", "fulfill_order"], ["approve", "fulfill_order"]]);
    expect((results[0]!.calls as Array<{ entrypoint: string }>).map((c) => c.entrypoint)).toEqual(["approve", "fulfill_order"]);
    expect(results[1]).toEqual({ orderHash: "0xbb", error: "gone" });
  });
});

describe("creating a swap", () => {
  const swapFixtures = (swapFixturesJson as unknown) as {
    taker: string; sellToken: string; buyToken: string;
    sell: { request: { sellAmountRaw: string }; calls: Array<{ contractAddress: string; entrypoint: string; calldata: string[] }> };
  };
  const params = {
    taker: swapFixtures.taker,
    sellTokenAddress: swapFixtures.sellToken,
    buyTokenAddress: swapFixtures.buyToken,
    sellAmountRaw: swapFixtures.sell.request.sellAmountRaw,
  };
  const answering = (calls: unknown[]) => sources(() => ({ id: "s1", expiresAt: "x", requiresSignature: false, calls: calls as never }));

  test("a route within bounds is returned as the backend created it", async () => {
    const { sources: s } = answering(swapFixtures.sell.calls);
    const created = await createIntent(s, "swap", params);
    expect(created.requiresSignature === false && created.calls).toEqual(swapFixtures.sell.calls);
  });

  test("a route out of bounds is refused before anything is signed", async () => {
    const tampered = swapFixtures.sell.calls.map((call, i) =>
      i === 1 ? { ...call, calldata: call.calldata.map((v, j) => (j === 8 ? "0x0999" : v)) } : call,
    );
    const { sources: s } = answering(tampered);
    const failure = await createIntent(s, "swap", params).catch((e: unknown) => e);
    expect(failure).toBeInstanceOf(UserFacingError);
    expect((failure as Error).message).toBe(ACTION_PROBLEM);
  });
});
