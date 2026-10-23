import { test, expect, mock, afterEach } from "bun:test";
import { ApiClient } from "./client.js";
import { INTENT_KINDS, intentPath, type IntentKind } from "../contract/intents.js";
import type { IntentParamsByKind } from "../types/api.js";
import { MedialaneApiError, MedialaneError } from "../errors.js";

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

interface Seen { url: string; init: RequestInit }

function respond(status: number, body: unknown) {
  const seen: Seen[] = [];
  globalThis.fetch = mock(async (input: unknown, init?: RequestInit) => {
    seen.push({ url: String(input), init: init ?? {} });
    return new Response(JSON.stringify(body), { status });
  }) as unknown as typeof fetch;
  return seen;
}

const client = () => new ApiClient({ baseUrl: "https://api.test", apiKey: "k", retry: { maxAttempts: 1 } });

test("every intent kind has a params type, and every params type is an intent kind", () => {
  const params: Record<keyof IntentParamsByKind, true> = Object.fromEntries(INTENT_KINDS.map((k) => [k, true])) as Record<IntentKind, true>;
  expect(Object.keys(params).sort()).toEqual([...INTENT_KINDS].sort());
});

test("intents.create posts to the kind's path and returns the created intent", async () => {
  const seen = respond(201, { data: { id: "i1", expiresAt: "", requiresSignature: false, calls: [] } });
  const intent = await client().intents.create("pop-claim", { claimer: "0x1", collection: "0x2", proof: [] });
  expect(seen[0].url).toBe("https://api.test/v1/intents/pop-claim");
  expect(seen[0].init.method).toBe("POST");
  expect(intent.id).toBe("i1");
});

test("intents.create sends the bearer it is given", async () => {
  const seen = respond(201, { data: { id: "i1", expiresAt: "", requiresSignature: false, calls: [] } });
  await client().intents.create("counter-offer", {} as never, { bearer: "tok" });
  expect((seen[0].init.headers as Record<string, string>).Authorization).toBe("Bearer tok");
});

test("intent paths are built from the kind", () => {
  expect(intentPath("listing")).toBe("/v1/intents/listing");
  expect(intentPath("checkout")).toBe("/v1/intents/checkout");
});

test("single resources come back unwrapped, lists keep their page meta", async () => {
  respond(200, { data: { orderHash: "0x1" } });
  expect(await client().orders.get("0x1")).toEqual({ orderHash: "0x1" } as never);
  respond(200, { data: [{ orderHash: "0x1" }], meta: { page: 1, limit: 20, total: 1 } });
  const page = await client().orders.list();
  expect(page.meta?.total).toBe(1);
  expect(page.data).toHaveLength(1);
});

test("find methods return null for a missing resource and get methods throw", async () => {
  respond(404, { error: "not found" });
  expect(await client().drops.find("0x1")).toBeNull();
  await expect(client().orders.get("0x1")).rejects.toBeInstanceOf(MedialaneApiError);
});

test("a bearer set on the client reaches every domain", async () => {
  const seen = respond(200, { data: {} });
  await client().withBearer("tok").portal.me();
  await client().withBearer(() => "fn").creators.myUsernameClaim();
  expect((seen[0].init.headers as Record<string, string>).Authorization).toBe("Bearer tok");
  expect((seen[1].init.headers as Record<string, string>).Authorization).toBe("Bearer fn");
});

test("the positional and the options constructors build the same client", async () => {
  const seen = respond(200, { data: [] });
  await new ApiClient({ baseUrl: "https://api.test", apiKey: "k" }).orders.list();
  await new ApiClient({ baseUrl: "https://api.test", apiKey: "k" }).orders.list();
  expect(seen[0].url).toBe(seen[1].url);
  expect(seen[0].init.headers).toEqual(seen[1].init.headers);
});

test("chain read amounts become bigint at the edge", async () => {
  respond(200, { data: { isLive: true, price: "5", maxPerWallet: "2", maxSupply: "9", totalMinted: "1" } });
  const state = await client().chainReads.dropState("0x1");
  expect(state?.price).toBe(5n);
  expect(state?.totalMinted).toBe(1n);
});

test("api errors are Medialane errors", async () => {
  respond(401, { error: "no" });
  const err = await client().portal.me().catch((e) => e);
  expect(err).toBeInstanceOf(MedialaneApiError);
  expect(err).toBeInstanceOf(MedialaneError);
  expect(err.code).toBe("UNAUTHORIZED");
});
