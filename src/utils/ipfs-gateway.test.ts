import { describe, expect, test } from "bun:test";
import { IPFS_PUBLIC_GATEWAYS } from "./ipfs-gateway.js";

describe("IPFS_PUBLIC_GATEWAYS", () => {
  test("lists https gateway roots ending in /ipfs, without a trailing slash", () => {
    expect(IPFS_PUBLIC_GATEWAYS.length).toBeGreaterThan(0);
    for (const gateway of IPFS_PUBLIC_GATEWAYS) {
      expect(gateway).toMatch(/^https:\/\/[^/]+\/ipfs$/);
    }
  });
});
