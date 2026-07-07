import { describe, it, expect } from "bun:test";
import { buildFeeCall } from "./build-fee-call.js";
import { resolveFeeConfig } from "../../fee/config.js";

const TOKEN = "0xusdc";

describe("buildFeeCall", () => {
  it("returns null when no fund address (fail-safe)", () => {
    const cfg = resolveFeeConfig({ enabled: true });
    expect(buildFeeCall({ surface: "marketplace", token: TOKEN, grossAmount: 1_000_000n }, cfg)).toBeNull();
  });

  it("returns null when disabled", () => {
    const cfg = resolveFeeConfig({ enabled: false, fundAddress: "0xfund" });
    expect(buildFeeCall({ surface: "marketplace", token: TOKEN, grossAmount: 1_000_000n }, cfg)).toBeNull();
  });

  it("computes 1% marketplace fee and floors", () => {
    const cfg = resolveFeeConfig({ fundAddress: "0xfund", marketplaceBps: 100 });
    const call = buildFeeCall({ surface: "marketplace", token: TOKEN, grossAmount: 1_000_005n }, cfg);
    // 1_000_005 * 100 / 10000 = 10000.05 -> floor 10000
    expect(call).toEqual({
      contractAddress: TOKEN,
      entrypoint: "transfer",
      calldata: ["0xfund", "10000", "0"],
    });
  });

  it("uses launchpadBps for launchpad surface", () => {
    const cfg = resolveFeeConfig({ fundAddress: "0xfund", launchpadBps: 50 });
    const call = buildFeeCall({ surface: "launchpad", token: TOKEN, grossAmount: 1_000_000n }, cfg);
    // 1_000_000 * 50 / 10000 = 5000
    expect(call?.calldata).toEqual(["0xfund", "5000", "0"]);
  });

  it("returns null when fee floors to zero (no dust transfer)", () => {
    const cfg = resolveFeeConfig({ fundAddress: "0xfund", marketplaceBps: 100 });
    expect(buildFeeCall({ surface: "marketplace", token: TOKEN, grossAmount: 99n }, cfg)).toBeNull();
  });

  it("splits large fee into u256 low/high", () => {
    const cfg = resolveFeeConfig({ fundAddress: "0xfund", marketplaceBps: 10000 });
    const gross = (1n << 130n); // fee == gross when bps == 10000
    const call = buildFeeCall({ surface: "marketplace", token: TOKEN, grossAmount: gross }, cfg);
    const low = (gross % (1n << 128n)).toString();
    const high = (gross >> 128n).toString();
    expect(call?.calldata).toEqual(["0xfund", low, high]);
  });
});
