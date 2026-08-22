import { describe, it, expect } from "bun:test";
import type { ProviderInterface } from "starknet";
import { getCreatorCoinGuarantees, MAX_TEAM_ALLOCATION_PERCENT } from "./creatorCoin.js";

const SUPPLY_1B = (1_000_000_000n * 10n ** 18n).toString();
const ALLOC_10PCT = (100_000_000n * 10n ** 18n).toString();

function providerWith(responses: Record<string, string[] | Error>): ProviderInterface {
  return {
    callContract: async ({ entrypoint }: { entrypoint: string }) => {
      const r = responses[entrypoint];
      if (r === undefined) throw new Error(`unexpected entrypoint ${entrypoint}`);
      if (r instanceof Error) throw r;
      return r;
    },
  } as unknown as ProviderInterface;
}

const launched = {
  is_launched: ["0x1"],
  total_supply: ["0x" + BigInt(SUPPLY_1B).toString(16), "0x0"],
  get_team_allocation: ["0x" + BigInt(ALLOC_10PCT).toString(16), "0x0"],
  launched_at_block_number: ["0x186a0"],

  liquidity_type: ["0x0", "0x0", "0x2a"],
};

describe("getCreatorCoinGuarantees", () => {
  it("reads a launched coin's guarantees from chain", async () => {
    const g = await getCreatorCoinGuarantees("0x1", providerWith(launched));
    expect(g.isLaunched).toBe(true);
    expect(g.totalSupplyRaw).toBe(SUPPLY_1B);
    expect(g.teamAllocationRaw).toBe(ALLOC_10PCT);
    expect(g.teamAllocationPercent).toBe(10);
    expect(g.launchedAtBlock).toBe(100_000);
    expect(g.liquidityPositionId).toBe("42");
  });

  it("never reports an allocation above the contract cap for a valid launch", async () => {
    const g = await getCreatorCoinGuarantees("0x1", providerWith(launched));
    expect(g.teamAllocationPercent!).toBeLessThanOrEqual(MAX_TEAM_ALLOCATION_PERCENT);
  });

  it("reports no liquidity position when the option is None", async () => {
    const g = await getCreatorCoinGuarantees(
      "0x1",
      providerWith({ ...launched, is_launched: ["0x0"], liquidity_type: ["0x1"] })
    );
    expect(g.isLaunched).toBe(false);
    expect(g.liquidityPositionId).toBeNull();
    expect(g.launchedAtBlock).toBeNull();
  });

  it("survives an older coin that does not expose the optional reads", async () => {
    const g = await getCreatorCoinGuarantees(
      "0x1",
      providerWith({
        ...launched,
        launched_at_block_number: new Error("entrypoint not found"),
        liquidity_type: new Error("entrypoint not found"),
      })
    );
    expect(g.isLaunched).toBe(true);
    expect(g.teamAllocationPercent).toBe(10);
    expect(g.launchedAtBlock).toBeNull();
    expect(g.liquidityPositionId).toBeNull();
  });

  it("reports a zero allocation as zero rather than unknown", async () => {
    const g = await getCreatorCoinGuarantees(
      "0x1",
      providerWith({ ...launched, get_team_allocation: ["0x0", "0x0"] })
    );
    expect(g.teamAllocationRaw).toBe("0");
    expect(g.teamAllocationPercent).toBe(0);
  });

  it("handles a u256 supply that spans the high word", async () => {
    const g = await getCreatorCoinGuarantees(
      "0x1",
      providerWith({ ...launched, total_supply: ["0x0", "0x1"], get_team_allocation: ["0x0", "0x0"] })
    );
    expect(g.totalSupplyRaw).toBe((1n << 128n).toString());
  });
});
