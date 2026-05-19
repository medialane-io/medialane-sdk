import { describe, it, expect } from "bun:test";
import { resolveFeeConfig } from "./config.js";

describe("resolveFeeConfig", () => {
  it("defaults to enabled, 100 bps both surfaces, no fund address", () => {
    const c = resolveFeeConfig(undefined);
    expect(c.enabled).toBe(true);
    expect(c.marketplaceBps).toBe(100);
    expect(c.launchpadBps).toBe(100);
    expect(c.fundAddress).toBeUndefined();
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
