import { describe, expect, test } from "bun:test";
import { resolveFeeConfig } from "../fee/config.js";
import { encodeByteArray } from "./bytearray.js";
import { buildFeeCall, feeBps } from "./fee/build-fee-call.js";
import { DROP_MAX_CLAIM_QUANTITY, dropCalls, dropMintCost } from "./drop-calls.js";

const pad = (h: string) => "0x" + h.replace(/^0x/, "").padStart(64, "0");
const FACTORY = "0x49cae891b9195277e018ae99765a3b0e5f6b0f6a1807c5db789342bccc0e130";
const DROP = "0xd409";
const USDC = "0x033068f6539f8e6e6b131e6b2b814e6c34a5224bc66947c47dab9dfee93b35fb";
const dec = (xs: unknown[]) => xs.map((x) => BigInt(x as string).toString());

describe("dropCalls.create", () => {
  test("encodes every argument in contract order", () => {
    const call = dropCalls.create(FACTORY, {
      name: "Neon Tides", symbol: "NEON", baseUri: "ipfs://cid/", maxSupply: 500n,
      terms: { startTime: 0, endTime: 1800000000, price: 5_000_000n, paymentToken: USDC, maxPerWallet: 5n },
      allowlistRoot: "0x55671b388a2640bb77a4a14b1650b4e2b08731a6e1bd966a642ddbaf2f150cb",
    });
    expect(call.contractAddress).toBe(pad(FACTORY));
    expect(call.entrypoint).toBe("create_drop");
    expect(dec(call.calldata as string[])).toEqual(dec([
      ...encodeByteArray("Neon Tides"), ...encodeByteArray("NEON"), ...encodeByteArray("ipfs://cid/"),
      "500", "0",
      "0", "1800000000", "5000000", "0", USDC, "5", "0",
      "0x55671b388a2640bb77a4a14b1650b4e2b08731a6e1bd966a642ddbaf2f150cb",
    ]));
  });

  test("a free drop sends a zero payment token and an absent root as zero", () => {
    const call = dropCalls.create(FACTORY, {
      name: "Free", symbol: "F", baseUri: "", maxSupply: 10n,
      terms: { startTime: 0, endTime: 0, price: 0n, paymentToken: USDC, maxPerWallet: 0n },
    });
    const tail = dec((call.calldata as string[]).slice(-8));
    expect(tail).toEqual(["0", "0", "0", "0", "0", "0", "0", "0"]);
  });
});

describe("dropCalls.claim", () => {
  test("a paid claim approves price × quantity to the collection, then claims with the proof", () => {
    const calls = dropCalls.claim(DROP, { quantity: 3, proof: ["0xa", "0xb"], price: 5_000_000n, paymentToken: USDC });
    expect(calls.map((c) => c.entrypoint)).toEqual(["approve", "claim"]);
    expect(calls[0]!.contractAddress).toBe(pad(USDC));
    expect(dec(calls[0]!.calldata as string[])).toEqual(dec([pad(DROP), "15000000", "0"]));
    expect(calls[1]!.contractAddress).toBe(pad(DROP));
    expect(dec(calls[1]!.calldata as string[])).toEqual(["3", "0", "2", "10", "11"]);
  });

  test("a free claim has no approve and an empty proof", () => {
    const calls = dropCalls.claim(DROP, { quantity: 1n, price: 0n, paymentToken: "0x0" });
    expect(calls.map((c) => c.entrypoint)).toEqual(["claim"]);
    expect(dec(calls[0]!.calldata as string[])).toEqual(["1", "0", "0"]);
  });

  test("an approve amount beyond 128 bits carries into the high word", () => {
    const price = 2n ** 127n;
    const calls = dropCalls.claim(DROP, { quantity: 4n, price, paymentToken: USDC });
    expect(dec(calls[0]!.calldata as string[]).slice(1)).toEqual(["0", "2"]);
  });
});

describe("dropCalls.issue and setAllowlistRoot", () => {
  test("encode recipient + quantity, and the root", () => {
    const issue = dropCalls.issue(DROP, "0x123", 2);
    expect(issue.entrypoint).toBe("issue");
    expect(dec(issue.calldata as string[])).toEqual(["291", "2", "0"]);
    const root = dropCalls.setAllowlistRoot(DROP, "0x0");
    expect(root.entrypoint).toBe("set_allowlist_root");
    expect(dec(root.calldata as string[])).toEqual(["0"]);
  });
});

describe("dropMintCost", () => {
  test("adds the fee in basis points to price × quantity", () => {
    expect(dropMintCost(5_000_000n, 2, 100)).toEqual({ subtotal: 10_000_000n, fee: 100_000n, total: 10_100_000n });
  });

  test("equals the fee buildFeeCall charges for the same amount", () => {
    const cfg = resolveFeeConfig({ fundAddress: "0x123" });
    const { fee } = dropMintCost(1_234_567n, 3, feeBps("launchpad", cfg));
    const call = buildFeeCall({ surface: "launchpad", token: USDC, grossAmount: 1_234_567n * 3n }, cfg)!;
    expect(BigInt((call.calldata as string[])[1]!)).toBe(fee);
  });

  test("no fee at 0 bps", () => {
    expect(dropMintCost(100n, 1, 0).fee).toBe(0n);
  });
});

describe("quantity guards", () => {
  const p = { price: 0n, paymentToken: "0x0" };
  test("claim refuses 0, negative and above the per-call cap", () => {
    expect(() => dropCalls.claim(DROP, { ...p, quantity: 0 })).toThrow(RangeError);
    expect(() => dropCalls.claim(DROP, { ...p, quantity: -1 })).toThrow(RangeError);
    expect(() => dropCalls.claim(DROP, { ...p, quantity: DROP_MAX_CLAIM_QUANTITY + 1n })).toThrow(RangeError);
    expect(dropCalls.claim(DROP, { ...p, quantity: DROP_MAX_CLAIM_QUANTITY })).toHaveLength(1);
  });
  test("issue refuses 0", () => {
    expect(() => dropCalls.issue(DROP, "0x222", 0)).toThrow(RangeError);
  });
});
