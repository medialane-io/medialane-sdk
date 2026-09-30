import { test, expect } from "bun:test";
import { buildAssetMetadata } from "./metadata.js";

test("an asset with no external URL gets none, not a Medialane app's URL", () => {
  expect(buildAssetMetadata({ name: "A" })).not.toHaveProperty("external_url");
});

test("an asset keeps the external URL its creator gave", () => {
  expect(buildAssetMetadata({ name: "A", externalUrl: "https://example.com" }).external_url).toBe("https://example.com");
});
