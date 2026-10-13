import { describe, expect, test } from "bun:test";
import { buildCollectionMetadata } from "./metadata.js";

const OWNER = "0x0123";

describe("buildCollectionMetadata", () => {
  test("writes name, description, image and external_link", () => {
    expect(
      buildCollectionMetadata({ name: "Archive", owner: OWNER, description: "All my work", image: "ipfs://img", externalLink: "https://me.example" }),
    ).toEqual({ name: "Archive", description: "All my work", image: "ipfs://img", external_link: "https://me.example" });
  });

  test("links to the owner's account page when no external link is given", () => {
    expect(buildCollectionMetadata({ name: "Archive", owner: OWNER })).toEqual({
      name: "Archive",
      external_link: `https://medialane.io/account/${OWNER}`,
    });
  });

  test("treats empty or whitespace fields as missing", () => {
    expect(buildCollectionMetadata({ name: "Archive", owner: OWNER, description: "  ", image: "", externalLink: " " })).toEqual({
      name: "Archive",
      external_link: `https://medialane.io/account/${OWNER}`,
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
