import { test, expect, mock, afterEach } from "bun:test";
import { ApiClient } from "./client.js";
import type { UpdateCollectionProfileInput } from "../types/api.js";

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

test("updateCollectionProfile sends gatedContentUrl/gatedContentType without a cast", async () => {
  let sentBody: string | undefined;
  globalThis.fetch = mock(async (_input: unknown, init?: RequestInit) => {
    sentBody = init?.body as string;
    return new Response(JSON.stringify({ contractAddress: "0x1" }), { status: 200 });
  }) as unknown as typeof fetch;

  const c = new ApiClient("https://api.test", "ml_live_x");
  const payload: UpdateCollectionProfileInput = {
    gatedContentTitle: "Behind the scenes",
    gatedContentUrl: "https://example.com/secret",
    gatedContentType: "VIDEO",
  };
  await c.updateCollectionProfile("0x1", payload, "siws_tok");

  expect(JSON.parse(sentBody!)).toEqual(payload);
});
