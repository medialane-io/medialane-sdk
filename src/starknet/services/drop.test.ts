import { expect, test } from "bun:test";
import { resolveConfig } from "../../config.js";
import { DropService } from "./drop.js";

const USDC = "0x033068f6539f8e6e6b131e6b2b814e6c34a5224bc66947c47dab9dfee93b35fb";
const DROP = "0xd409";

function fakeAccount() {
  const executed: { entrypoint: string; calldata: unknown }[][] = [];
  const reads: Record<string, string[]> = {
    organizer: ["0x1"],
    terms: ["0x0", "0x0", "0x4c4b40", "0x0", USDC, "0x5", "0x0"], // price 5_000_000
    allowlist_root: ["0x0"],
    max_supply: ["0x1f4", "0x0"],
    total_minted: ["0x0", "0x0"],
  };
  return {
    executed,
    callContract: async (req: { entrypoint: string }) => reads[req.entrypoint]!,
    execute: async (calls: { entrypoint: string; calldata: unknown }[]) => {
      executed.push(calls);
      return { transaction_hash: "0xabc" };
    },
  };
}

test("claim reads the price from chain and sends approve, claim and the platform fee", async () => {
  const account = fakeAccount();
  const service = new DropService(resolveConfig({ chain: "STARKNET", feeConfig: { fundAddress: "0x999" } }), account as never);
  const res = await service.claim(account as never, { collection: DROP, quantity: 2 });
  expect(res.txHash).toBe("0xabc");
  expect(account.executed[0]!.map((c) => c.entrypoint)).toEqual(["approve", "claim", "transfer"]);
});
