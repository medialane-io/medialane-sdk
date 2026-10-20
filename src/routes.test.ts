import { test, expect, describe } from "bun:test";
import { chainSlug, chainFromSlug, assetHref, collectionHref, coinHref, profileHref } from "./routes.js";

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

describe("profileHref", () => {
  test("links to the username page when a username is set", () => {
    expect(profileHref({ username: "drummer", address: "0x1" })).toBe("/creator/drummer");
  });

  test("links to the account page without a username", () => {
    expect(profileHref({ username: null, address: "0x1" })).toBe("/account/0x1");
    expect(profileHref({ username: "  ", address: "0x1" })).toBe("/account/0x1");
  });

  test("falls back to the creators list with neither", () => {
    expect(profileHref({})).toBe("/creators");
  });
});
