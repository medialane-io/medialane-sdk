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

describe("popCalls", () => {
  const { CallData, byteArray } = require("starknet") as typeof import("starknet");
  const felts = (xs: readonly unknown[]) => xs.map((x) => BigInt(x as string));
  const { popCalls } = require("./pop-claim.js") as typeof import("./pop-claim.js");

  test("claim sends the proof as a span", () => {
    const call = popCalls.claim("0xabc", ["0x1", "0x2"]);
    expect(call.entrypoint).toBe("claim");
    expect(BigInt(call.contractAddress)).toBe(0xabcn);
    expect(felts(call.calldata)).toEqual([2n, 1n, 2n]);
  });

  test("claim with an empty proof sends an empty span", () => {
    expect(felts(popCalls.claim("0xabc", []).calldata)).toEqual([0n]);
  });

  test("issue without a token URI sends an empty ByteArray", () => {
    const call = popCalls.issue("0xabc", "0x5");
    expect(call.entrypoint).toBe("issue");
    expect(felts(call.calldata)).toEqual([5n, ...felts(CallData.compile([byteArray.byteArrayFromString("")]))]);
  });

  test("issue with a token URI encodes it as a ByteArray", () => {
    const call = popCalls.issue("0xabc", "0x5", "ipfs://distinction.json");
    expect(felts(call.calldata)).toEqual([
      5n,
      ...felts(CallData.compile([byteArray.byteArrayFromString("ipfs://distinction.json")])),
    ]);
  });

  test("burn sends the token id as a u256", () => {
    const call = popCalls.burn("0xabc", (1n << 128n) + 7n);
    expect(call.entrypoint).toBe("burn");
    expect(felts(call.calldata)).toEqual([7n, 1n]);
  });

  test("setAllowlistRoot sends the root", () => {
    const call = popCalls.setAllowlistRoot("0xabc", "0x123");
    expect(call.entrypoint).toBe("set_allowlist_root");
    expect(felts(call.calldata)).toEqual([0x123n]);
  });
});
