import { expect, test } from "bun:test";
import { resolveConfig } from "../config.js";
import { buildDropClaimCalls } from "./drop-state.js";

const USDC = "0x033068f6539f8e6e6b131e6b2b814e6c34a5224bc66947c47dab9dfee93b35fb";
const DROP = "0xd409";

function fakeProvider(price = "0x4c4b40") {
  const reads: Record<string, string[]> = {
    organizer: ["0x1"],
    terms: ["0x0", "0x0", price, "0x0", USDC, "0x5", "0x0"],
    allowlist_root: ["0x0"],
    max_supply: ["0x1f4", "0x0"],
    total_minted: ["0x0", "0x0"],
  };
  return { callContract: async (req: { entrypoint: string }) => reads[req.entrypoint]! };
}

test("a paid claim is priced from the chain and sends approve, claim and the platform fee", async () => {
  const { feeConfig } = resolveConfig({ chain: "STARKNET", feeConfig: { fundAddress: "0x999" } });
  const calls = await buildDropClaimCalls(fakeProvider(), DROP, { quantity: 2 }, feeConfig);
  expect(calls.map((c) => c.entrypoint)).toEqual(["approve", "claim", "transfer"]);
});

test("a free claim sends only the claim", async () => {
  const { feeConfig } = resolveConfig({ chain: "STARKNET", feeConfig: { fundAddress: "0x999" } });
  const calls = await buildDropClaimCalls(fakeProvider("0x0"), DROP, { quantity: 1 }, feeConfig);
  expect(calls.map((c) => c.entrypoint)).toEqual(["claim"]);
});
