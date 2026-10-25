import { describe, expect, test } from "bun:test";
import { accountPageUrl, buildAssetMetadata, buildCollectionMetadata } from "./metadata.js";

const OWNER = "0x0123";

describe("buildAssetMetadata", () => {
  test("keeps template traits whatever their length", () => {
    const longName = "n".repeat(200);
    const longValue = "v".repeat(100_000);
    const { attributes } = buildAssetMetadata({ name: "Post", templateTraits: [{ traitType: longName, value: longValue }] });
    expect(attributes).toEqual([{ trait_type: longName, value: longValue }]);
  });

  test("writes no Registration trait", () => {
    const { attributes } = buildAssetMetadata({ name: "Post", licenseType: "CC BY-SA" });
    expect(attributes).toEqual([
      { trait_type: "License", value: "CC BY-SA" },
      { trait_type: "Standard", value: "Berne Convention" },
    ]);
  });
});

describe("buildCollectionMetadata", () => {
  test("writes name, description, image and external_link", () => {
    expect(
      buildCollectionMetadata({ name: "Archive", owner: OWNER, description: "All my work", image: "ipfs://img", externalLink: "https://me.example" }),
    ).toEqual({ name: "Archive", description: "All my work", image: "ipfs://img", external_link: "https://me.example" });
  });

  test("links to the owner's account page when no external link is given", () => {
    expect(buildCollectionMetadata({ name: "Archive", owner: OWNER })).toEqual({
      name: "Archive",
      external_link: `https://www.medialane.io/account/${OWNER}`,
    });
  });

  test("treats empty or whitespace fields as missing", () => {
    expect(buildCollectionMetadata({ name: "Archive", owner: OWNER, description: "  ", image: "", externalLink: " " })).toEqual({
      name: "Archive",
      external_link: `https://www.medialane.io/account/${OWNER}`,
    });
  });

  test("trims the values it keeps", () => {
    expect(buildCollectionMetadata({ name: "Archive", owner: OWNER, description: " d ", externalLink: " https://me.example " })).toEqual({
      name: "Archive",
      description: "d",
      external_link: "https://me.example",
    });
  });
});

describe("accountPageUrl", () => {
  test("is the account page on the canonical host", () => {
    expect(accountPageUrl("0xabc")).toBe("https://www.medialane.io/account/0xabc");
  });
});
