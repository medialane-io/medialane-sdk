import { describe, expect, test } from "bun:test";
import { resolveConfig } from "../../config.js";
import { buildIntent, canBuildIntent } from "./build.js";

const config = resolveConfig({});
const owner = "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const registry = "0x0225c3ae09506b8d97adc39649ca740dad5aac195b7f5f0441cc1852947acaea";

describe("the archive intent", () => {
  test("can be built locally", () => {
    expect(canBuildIntent("archive-nft")).toBe(true);
  });

  test("calls archive on the registry with the collection id and token id as u256 pairs", () => {
    const { calls } = buildIntent("archive-nft", { owner, collectionId: "7", tokenId: "9" }, {}, config);
    expect(calls).toEqual([{ contractAddress: registry, entrypoint: "archive", calldata: ["7", "0", "9", "0"] }]);
  });

  test("splits a token id above 2^128 into low and high", () => {
    const tokenId = (2n ** 128n + 5n).toString();
    const { calls } = buildIntent("archive-nft", { owner, collectionId: "1", tokenId }, {}, config);
    expect(calls[0]?.calldata).toEqual(["1", "0", "5", "1"]);
  });
});
