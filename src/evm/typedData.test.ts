import { describe, expect, test } from "bun:test";
import { hashTypedData } from "viem";
import { EVM_ORDER_TYPES, evmOrderDigest, type EvmOrderParameters } from "./typedData.js";

// The audited Solidity type strings (Medialane721.sol) — the TS types must
// encode to exactly these.
const OFFER_STR = "OfferItem(uint8 itemType,address token,uint256 identifier,uint256 amount)";
const CONSIDERATION_STR =
  "ConsiderationItem(uint8 itemType,address token,uint256 identifier,uint256 amount,address recipient)";
const ORDER_STR =
  "OrderParameters(address offerer,OfferItem offer,ConsiderationItem consideration,uint256 royaltyMaxBps,uint256 startTime,uint256 endTime,uint256 salt,uint256 counter)" +
  CONSIDERATION_STR + OFFER_STR;

function encodeType(name: keyof typeof EVM_ORDER_TYPES): string {
  const fields = (t: keyof typeof EVM_ORDER_TYPES) =>
    `${t}(${EVM_ORDER_TYPES[t].map((f) => `${f.type} ${f.name}`).join(",")})`;
  if (name === "OrderParameters") return fields("OrderParameters") + fields("ConsiderationItem") + fields("OfferItem");
  return fields(name);
}

const sample: EvmOrderParameters = {
  offerer: "0x0000000000000000000000000000000000000111",
  offer: { itemType: 2, token: "0x0000000000000000000000000000000000000721", identifier: 7n, amount: 1n },
  consideration: {
    itemType: 1,
    token: "0x0000000000000000000000000000000000000020",
    identifier: 0n,
    amount: 1000000n,
    recipient: "0x0000000000000000000000000000000000000111",
  },
  royaltyMaxBps: 1000n,
  startTime: 1000000000n,
  endTime: 1000003600n,
  salt: 42n,
  counter: 0n,
};
const VENUE = "0x00000000000000000000000000000000000000aa" as const;

describe("EVM order typed data", () => {
  test("type strings are byte-equal to the audited Solidity", () => {
    expect(encodeType("OfferItem")).toBe(OFFER_STR);
    expect(encodeType("ConsiderationItem")).toBe(CONSIDERATION_STR);
    expect(encodeType("OrderParameters")).toBe(ORDER_STR);
  });
  test("digest is deterministic and equals viem's hashTypedData", () => {
    const digest = evmOrderDigest(1, VENUE, sample);
    expect(digest).toBe(evmOrderDigest(1, VENUE, sample));
    expect(digest).toBe(
      hashTypedData({
        domain: { name: "Medialane", version: "1", chainId: 1, verifyingContract: VENUE },
        types: EVM_ORDER_TYPES,
        primaryType: "OrderParameters",
        message: sample,
      }),
    );
  });
  test("digest binds chainId and verifyingContract", () => {
    const eth = evmOrderDigest(1, VENUE, sample);
    expect(evmOrderDigest(8453, VENUE, sample)).not.toBe(eth); // Base
    expect(
      evmOrderDigest(1, "0x00000000000000000000000000000000000000bb", sample),
    ).not.toBe(eth);
  });
});
