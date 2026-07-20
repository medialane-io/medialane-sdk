import { test, expect, describe } from "bun:test";
import { chainSlug, chainFromSlug, assetHref, collectionHref, coinHref } from "./routes.js";

describe("chainSlug / chainFromSlug", () => {
  test("round-trips a supported chain", () => {
    expect(chainSlug("STARKNET")).toBe("starknet");
    expect(chainFromSlug("starknet")).toBe("STARKNET");
    expect(chainFromSlug("STARKNET")).toBe("STARKNET");
  });

  test("returns null for an unsupported/unknown slug", () => {
    expect(chainFromSlug("ethereum")).toBeNull();
    expect(chainFromSlug("bogus")).toBeNull();
  });
});

describe("href builders", () => {
  test("assetHref builds the chained path", () => {
    expect(assetHref("STARKNET", "0xabc", "42")).toBe("/asset/starknet/0xabc/42");
  });

  test("collectionHref builds the chained path", () => {
    expect(collectionHref("STARKNET", "0xabc")).toBe("/collections/starknet/0xabc");
  });

  test("coinHref builds the chained path", () => {
    expect(coinHref("STARKNET", "0xabc")).toBe("/coins/starknet/0xabc");
  });

  test("nullish ids coerce to empty segments", () => {
    expect(assetHref("STARKNET", null, undefined)).toBe("/asset/starknet//");
  });
});
