import { describe, expect, test } from "bun:test";
import { buildPopAllowlist } from "./pop-allowlist.js";
import { popClaimInfo, popClaimLinks, popClaimLinksCsv, popClaimState } from "./pop-claim.js";

const COLLECTION = "0x0abc";
const list = buildPopAllowlist(["0x111", "0x222"]);
const pad = (a: string) => "0x" + a.slice(2).padStart(64, "0");

describe("claim links", () => {
  test("one link per participant, to the collection page with the proof in the fragment", () => {
    const links = popClaimLinks("https://medialane.io", COLLECTION, list);
    expect(links.map((l) => l.address).sort()).toEqual([pad("0x111"), pad("0x222")]);
    for (const link of links) {
      expect(link.url.startsWith("https://medialane.io/collections/")).toBe(true);
      expect(link.url).toContain("#pop-proof=");
    }
  });

  test("the CSV has a header and one row per link", () => {
    const rows = popClaimLinksCsv(popClaimLinks("https://medialane.io", COLLECTION, list)).split("\n");
    expect(rows[0]).toBe("address,claim_link");
    expect(rows).toHaveLength(3);
  });
});

describe("claim state", () => {
  const root = list.root;
  const proof = list.proofs[pad("0x111")]!;
  const open = { root, claimEndTime: 0, now: 1_000 };

  test("waits while the claim status or the collection's settings are loading", () => {
    expect(popClaimState({ hasClaimed: null, proof, wallet: "0x111", info: open })).toBe("loading");
    expect(popClaimState({ hasClaimed: false, proof, wallet: "0x111", info: null })).toBe("loading");
  });

  test("a holder sees that they hold it", () => {
    expect(popClaimState({ hasClaimed: true, proof: null, wallet: "0x111", info: open })).toBe("claimed");
  });

  test("with no published list, claims are closed rather than blamed on the wallet", () => {
    expect(popClaimState({ hasClaimed: false, proof, wallet: "0x111", info: { ...open, root: "0x0" } })).toBe("closed");
  });

  test("after the deadline, the window has ended", () => {
    const info = { root, claimEndTime: 999, now: 1_000 };
    expect(popClaimState({ hasClaimed: false, proof, wallet: "0x111", info })).toBe("ended");
  });

  test("the deadline second itself is still open", () => {
    const info = { root, claimEndTime: 1_000, now: 1_000 };
    expect(popClaimState({ hasClaimed: false, proof, wallet: "0x111", info })).toBe("ready");
  });

  test("without a claim link there is nothing to claim with", () => {
    expect(popClaimState({ hasClaimed: false, proof: null, wallet: "0x111", info: open })).toBe("no-link");
  });

  test("a link opened by another wallet is refused before any transaction", () => {
    expect(popClaimState({ hasClaimed: false, proof, wallet: "0x999", info: open })).toBe("wrong-wallet");
  });

  test("the listed wallet with its link can claim", () => {
    expect(popClaimState({ hasClaimed: false, proof, wallet: "0x111", info: open })).toBe("ready");
  });
});

describe("popClaimInfo", () => {
  test("reads the allowlist root and the claim deadline", async () => {
    const provider = {
      callContract: async (req: { entrypoint: string }) =>
        req.entrypoint === "allowlist_root" ? ["0xabc"] : ["0x64"],
    };
    expect(await popClaimInfo(provider as never, COLLECTION)).toEqual({ root: "0xabc", claimEndTime: 100 });
  });
});
