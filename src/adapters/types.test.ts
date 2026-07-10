import { describe, it, expect } from "bun:test";
import type { VenueSigner } from "./types.js";

describe("VenueSigner", () => {
  it("is satisfiable by a three-method object", async () => {
    const calls: unknown[] = [];
    const signer: VenueSigner<{ d: string }, { c: string }> = {
      address: "0xabc",
      async signTypedData(data) {
        return [data.d];
      },
      async execute(cs) {
        calls.push(...cs);
        return { txHash: "0xdead" };
      },
    };
    expect(signer.address).toBe("0xabc");
    expect(await signer.signTypedData({ d: "0x1" })).toEqual(["0x1"]);
    expect(await signer.execute([{ c: "x" }])).toEqual({ txHash: "0xdead" });
    expect(calls).toEqual([{ c: "x" }]);
  });
});
