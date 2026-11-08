import { describe, expect, test } from "bun:test";
import type { Call } from "starknet";
import { resolveConfig } from "../../config.js";
import { sameCalls } from "../sponsored-checks.js";
import { buildIntent, canBuildIntent } from "./build.js";
import fixtures from "./transfers.fixtures.json";

const config = resolveConfig({ feeConfig: { fundAddress: fixtures.fund } });
const cases = ["transferToken", "transferNft721", "transferNft1155", "transferCollectionOwnership", "fundingTransfer"] as const;

describe("transfers build what the backend builds", () => {
  for (const name of cases) {
    test(name, () => {
      const c = fixtures[name];
      expect(canBuildIntent(c.kind as never)).toBe(true);
      expect(sameCalls(buildIntent(c.kind as never, c.params, {}, config).calls, c.calls as Call[])).toBe(true);
    });
  }
});

describe("transfers refuse what they can't build", () => {
  test("a token the platform doesn't support is refused", () => {
    expect(() => buildIntent("transfer-token", { ...fixtures.transferToken.params, token: "0x9" }, {}, config)).toThrow(/not supported/);
  });

  test("a funding transfer goes to the platform fund by default", () => {
    const built = buildIntent("funding-transfer", fixtures.fundingTransfer.params, {}, resolveConfig({}));
    expect(sameCalls(built.calls, fixtures.fundingTransfer.calls as Call[])).toBe(true);
  });
});
