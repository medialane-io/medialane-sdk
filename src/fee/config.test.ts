import { describe, it, expect } from "bun:test";
import { resolveFeeConfig } from "./config.js";
import { getCoordinates } from "../chains.js";

describe("resolveFeeConfig", () => {
  it("by default no fee is charged", () => {
    const c = resolveFeeConfig(undefined);
    expect(c.enabled).toBe(false);
    expect(c.marketplaceBps).toBe(100);
    expect(c.launchpadBps).toBe(100);
  });

  it("an app that turns fees on pays the platform fund", () => {
    expect(resolveFeeConfig({ enabled: true }).fundAddress).toBe(getCoordinates("STARKNET").feeFundAddress);
    expect(getCoordinates("STARKNET").feeFundAddress).toBe("0x064c51746dbcb7498cc6e4b8abfcacd60805c0762b0411bb0515c611b5ae8223");
  });

  it("an explicit fund address is kept", () => {
    expect(resolveFeeConfig({ enabled: true, fundAddress: "0xfund" }).fundAddress).toBe("0xfund");
  });

  it("passes through provided values", () => {
    const c = resolveFeeConfig({
      enabled: true,
      fundAddress: "0xfund",
      marketplaceBps: 250,
      launchpadBps: 50,
    });
    expect(c.fundAddress).toBe("0xfund");
    expect(c.marketplaceBps).toBe(250);
    expect(c.launchpadBps).toBe(50);
  });

  it("rejects bps outside 0..10000", () => {
    expect(() => resolveFeeConfig({ marketplaceBps: 10001 })).toThrow();
    expect(() => resolveFeeConfig({ launchpadBps: -1 })).toThrow();
  });
});
