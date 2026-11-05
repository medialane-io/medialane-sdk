import { describe, expect, test } from "bun:test";
import { typedDataMatches } from "./compare.js";

const order = {
  types: { Order: [{ name: "price", type: "felt" }] },
  primaryType: "Order",
  domain: { name: "Medialane", version: "1", chainId: "SN_MAIN", revision: "1" },
  message: { price: "0x01", offer: { item_type: "ERC721", amount: "1" } },
};

describe("typedDataMatches", () => {
  test("typed data compares felts by value", () => {
    const sameValues = { ...order, message: { price: "1", offer: { item_type: "ERC721", amount: "0x1" } } };
    expect(typedDataMatches(order, sameValues)).toBe(true);
  });

  test("a changed price does not match", () => {
    expect(typedDataMatches(order, { ...order, message: { ...order.message, price: "0x02" } })).toBe(false);
  });

  test("typed data with an extra message field does not match", () => {
    expect(typedDataMatches(order, { ...order, message: { ...order.message, recipient: "0x9" } })).toBe(false);
  });

  test("text compares exactly", () => {
    expect(typedDataMatches(order, { ...order, message: { ...order.message, offer: { item_type: "ERC1155", amount: "1" } } })).toBe(false);
  });

  test("arrays must have the same length and items", () => {
    expect(typedDataMatches({ a: ["0x1", "0x2"] }, { a: ["1", "2"] })).toBe(true);
    expect(typedDataMatches({ a: ["0x1"] }, { a: ["0x1", "0x2"] })).toBe(false);
  });
});
