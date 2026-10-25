import { describe, expect, test } from "bun:test";
import { collectionSchema, orderSchema, tokenSchema } from "./responses.js";

const order = {
  id: "o1",
  chain: "STARKNET",
  orderHash: "0xabc",
  parentOrderHash: null,
  offerer: "0x1",
  offer: { itemType: "ERC721", token: "0x2", identifier: "1", startAmount: "1", endAmount: "1" },
  consideration: { itemType: "ERC20", token: "0x3", identifier: "0", startAmount: "100", endAmount: "100", recipient: "0x1" },
  startTime: "1",
  endTime: "2",
  status: "ACTIVE",
  fulfiller: null,
  nftContract: "0x2",
  nftTokenId: "1",
  price: { raw: "100", formatted: "0.0001", currency: "USDC", decimals: 6 },
  txHash: { created: "0xt", fulfilled: null, cancelled: null },
  createdBlockNumber: "10",
  remainingAmount: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  token: { name: "n", image: null, description: null, animationUrl: null },
};

const token = {
  id: "t1",
  chain: "STARKNET",
  contractAddress: "0x2",
  tokenId: "1",
  owner: null,
  tokenUri: null,
  metadataStatus: "FETCHED",
  standard: null,
  metadata: { name: "n", description: null, image: null, animationUrl: null, attributes: null, ipType: null, licenseType: null, commercialUse: null, author: null, externalUrl: null },
  balances: null,
  activeOrders: [order],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const collection = {
  id: "c1",
  chain: "STARKNET",
  contractAddress: "0x2",
  collectionId: null,
  name: "n",
  symbol: "s",
  description: null,
  image: null,
  attributes: null,
  owner: null,
  startBlock: "1",
  metadataStatus: "FETCHED",
  standard: "ERC721",
  isFeatured: false,
  isHidden: false,
  service: null,
  claimedBy: null,
  floorPrice: null,
  totalVolume: null,
  holderCount: 0,
  totalSupply: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  profile: null,
};

describe("response schemas", () => {
  test("a representative order, token and collection parse", () => {
    expect(orderSchema.safeParse(order).success).toBe(true);
    expect(tokenSchema.safeParse(token).success).toBe(true);
    expect(collectionSchema.safeParse(collection).success).toBe(true);
  });

  test("strict parsing refuses a field the schema does not document", () => {
    expect(orderSchema.strict().safeParse({ ...order, buyerEmail: "a@b.test" }).success).toBe(false);
    expect(tokenSchema.strict().safeParse({ ...token, ownerEmail: "a@b.test" }).success).toBe(false);
    expect(collectionSchema.strict().safeParse({ ...collection, notifyEmail: "a@b.test" }).success).toBe(false);
  });

  test("a missing required field is refused", () => {
    const { status: _status, ...withoutStatus } = order;
    expect(orderSchema.safeParse(withoutStatus).success).toBe(false);
  });
});
