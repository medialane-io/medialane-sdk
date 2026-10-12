import { describe, expect, test } from "bun:test";
import { resolveFeeConfig } from "../fee/config.js";
import { buildPopAllowlist } from "./pop-allowlist.js";
import { DROP_MAX_CLAIM_QUANTITY, dropClaimLinks, dropClaimedBy, dropMintState, readDrop, type DropOnchain } from "./drop-state.js";

const pad = (h: string) => "0x" + h.replace(/^0x/, "").padStart(64, "0");
const USDC = "0x033068f6539f8e6e6b131e6b2b814e6c34a5224bc66947c47dab9dfee93b35fb";
const cfg = resolveFeeConfig({ fundAddress: "0x123" }); // launchpad 100 bps

const drop = (over: Partial<DropOnchain> = {}): DropOnchain => ({
  organizer: pad("0x1"), startTime: 0, endTime: 0, price: 0n, paymentToken: pad("0x0"),
  maxPerWallet: 0n, allowlistRoot: "0x0", maxSupply: 500n, totalMinted: 0n, ...over,
});
const base = { wallet: "0x222", claimed: 0n, proof: null, balance: null, feeConfig: cfg, now: 1000 };

describe("readDrop / dropClaimedBy", () => {
  test("decode terms, root and supply from the collection's views", async () => {
    const reads: Record<string, string[]> = {
      organizer: ["0x1"],
      terms: ["0x64", "0xc8", "0x4c4b40", "0x0", USDC, "0x5", "0x0"],
      allowlist_root: ["0xabc"],
      max_supply: ["0x1f4", "0x0"],
      total_minted: ["0x7", "0x0"],
    };
    const provider = { callContract: async (r: { entrypoint: string }) => reads[r.entrypoint]! };
    expect(await readDrop(provider as never, "0xd409")).toEqual({
      organizer: pad("0x1"), startTime: 100, endTime: 200, price: 5_000_000n, paymentToken: pad(USDC),
      maxPerWallet: 5n, allowlistRoot: "0xabc", maxSupply: 500n, totalMinted: 7n,
    });
  });

  test("claimed_by is read for the normalized wallet", async () => {
    const seen: unknown[] = [];
    const provider = { callContract: async (r: unknown) => { seen.push(r); return ["0x3", "0x0"]; } };
    expect(await dropClaimedBy(provider as never, "0xd409", "0x222")).toBe(3n);
    expect(seen[0]).toEqual({ contractAddress: pad("0xd409"), entrypoint: "claimed_by", calldata: [pad("0x222")] });
  });
});

describe("dropMintState — sale window and supply", () => {
  test("loading until the drop is read", () => {
    expect(dropMintState({ ...base, drop: null }).state).toBe("loading");
  });
  test("upcoming before start; live at the start second", () => {
    expect(dropMintState({ ...base, drop: drop({ startTime: 1001 }) }).state).toBe("upcoming");
    expect(dropMintState({ ...base, drop: drop({ startTime: 1000 }) }).state).toBe("ready");
  });
  test("live at the end second; ended one second after", () => {
    expect(dropMintState({ ...base, drop: drop({ endTime: 1000 }) }).state).toBe("ready");
    expect(dropMintState({ ...base, drop: drop({ endTime: 999 }) }).state).toBe("ended");
  });
  test("sold out at the cap; no cap when max supply is 0", () => {
    expect(dropMintState({ ...base, drop: drop({ maxSupply: 5n, totalMinted: 5n }) }).state).toBe("sold-out");
    expect(dropMintState({ ...base, drop: drop({ maxSupply: 0n, totalMinted: 10_000n }) })).toEqual({ state: "ready", maxQuantity: DROP_MAX_CLAIM_QUANTITY });
  });
  test("no wallet", () => {
    expect(dropMintState({ ...base, wallet: null, drop: drop() }).state).toBe("no-wallet");
  });
});

describe("dropMintState — allowlist", () => {
  const list = buildPopAllowlist(["0x111", "0x222", "0x333"]);
  const listed = drop({ allowlistRoot: list.root });
  test("no-link without a proof; not-on-list with a proof for another wallet", () => {
    expect(dropMintState({ ...base, drop: listed }).state).toBe("no-link");
    expect(dropMintState({ ...base, drop: listed, proof: list.proofs[pad("0x111")]! }).state).toBe("not-on-list");
  });
  test("ready with the wallet's own proof, whatever the address padding", () => {
    const proof = list.proofs[pad("0x222")]!;
    expect(dropMintState({ ...base, wallet: "0x222", drop: listed, proof }).state).toBe("ready");
    expect(dropMintState({ ...base, wallet: pad("0x222"), drop: listed, proof }).state).toBe("ready");
  });
  test("root 0 ignores the proof", () => {
    expect(dropMintState({ ...base, drop: drop(), proof: ["0xdead"] }).state).toBe("ready");
  });
});

describe("dropMintState — limits and balance", () => {
  test("wallet limit caps the quantity, then blocks", () => {
    expect(dropMintState({ ...base, claimed: 3n, drop: drop({ maxPerWallet: 5n }) })).toEqual({ state: "ready", maxQuantity: 2n });
    expect(dropMintState({ ...base, claimed: 5n, drop: drop({ maxPerWallet: 5n }) }).state).toBe("limit-reached");
  });
  test("remaining supply caps the quantity", () => {
    expect(dropMintState({ ...base, drop: drop({ maxSupply: 10n, totalMinted: 7n }) }).maxQuantity).toBe(3n);
  });
  test("loading until claimed_by is read", () => {
    expect(dropMintState({ ...base, claimed: null, drop: drop() }).state).toBe("loading");
  });
  test("a paid drop caps the quantity to what the balance covers including the fee", () => {
    const paid = drop({ price: 5_000_000n, paymentToken: pad(USDC) });
    expect(dropMintState({ ...base, drop: paid, balance: 10_100_000n }).maxQuantity).toBe(2n);
    expect(dropMintState({ ...base, drop: paid, balance: 10_099_999n }).maxQuantity).toBe(1n);
    expect(dropMintState({ ...base, drop: paid, balance: 5_049_999n }).state).toBe("insufficient-balance");
    expect(dropMintState({ ...base, drop: paid, balance: null }).state).toBe("loading");
  });
});

describe("dropClaimLinks", () => {
  test("one drop-page link per address, proof in the fragment", () => {
    const list = buildPopAllowlist(["0x111"]);
    const [link] = dropClaimLinks("https://medialane.io", "0xd409", list);
    expect(link!.address).toBe(pad("0x111"));
    expect(link!.url).toBe("https://medialane.io/launchpad/drop/0xd409#pop-proof=");
  });
});
