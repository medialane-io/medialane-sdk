import { z } from "zod";

export const orderStatusSchema = z.enum(["ACTIVE", "FULFILLED", "CANCELLED", "EXPIRED"]);

export const orderOfferSchema = z.object({
  itemType: z.string(),
  token: z.string(),
  identifier: z.string(),
  startAmount: z.string(),
  endAmount: z.string(),
});

export const orderConsiderationSchema = orderOfferSchema.extend({ recipient: z.string() });

export const orderSchema = z.object({
  id: z.string(),
  chain: z.string(),
  orderHash: z.string(),
  parentOrderHash: z.string().nullable().optional(),
  counterOfferMessage: z.string().nullable().optional(),
  hasActiveCounterOffer: z.boolean().optional(),
  offerer: z.string(),
  offer: orderOfferSchema,
  consideration: orderConsiderationSchema,
  startTime: z.string(),
  endTime: z.string(),
  status: orderStatusSchema,
  fulfiller: z.string().nullable(),
  nftContract: z.string().nullable(),
  nftTokenId: z.string().nullable(),
  price: z.object({
    raw: z.string().nullable(),
    formatted: z.string().nullable(),
    currency: z.string().nullable(),
    decimals: z.number(),
  }),
  txHash: z.object({
    created: z.string().nullable(),
    fulfilled: z.string().nullable(),
    cancelled: z.string().nullable(),
  }),
  createdBlockNumber: z.string(),
  remainingAmount: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  token: z
    .object({
      name: z.string().nullable(),
      image: z.string().nullable(),
      description: z.string().nullable(),
      animationUrl: z.string().nullable(),
    })
    .nullable(),
});

export const metadataStatusSchema = z.enum(["PENDING", "FETCHING", "FETCHED", "FAILED"]);

export const tokenAttributeSchema = z
  .object({
    trait_type: z.string(),
    value: z.union([z.string(), z.number(), z.boolean()]),
    display_type: z.string().optional(),
  })
  .passthrough();

export const tokenSchema = z.object({
  id: z.string(),
  chain: z.string(),
  contractAddress: z.string(),
  tokenId: z.string(),
  owner: z.string().nullable(),
  tokenUri: z.string().nullable(),
  metadataStatus: metadataStatusSchema,
  standard: z.enum(["ERC721", "ERC1155"]).nullable(),
  metadata: z.object({
    name: z.string().nullable(),
    description: z.string().nullable(),
    image: z.string().nullable(),
    animationUrl: z.string().nullable(),
    attributes: z.array(tokenAttributeSchema).nullable(),
    ipType: z.string().nullable(),
    licenseType: z.string().nullable(),
    commercialUse: z.boolean().nullable(),
    author: z.string().nullable(),
  }),
  balances: z.array(z.object({ owner: z.string(), amount: z.string() })).nullable(),
  holderCount: z.number().optional(),
  supply: z.string().optional(),
  activeOrders: z.array(orderSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const collectionSchema = z.object({
  id: z.string(),
  chain: z.string(),
  contractAddress: z.string(),
  collectionId: z.string().nullable(),
  name: z.string().nullable(),
  symbol: z.string().nullable(),
  description: z.string().nullable(),
  image: z.string().nullable(),
  attributes: z.array(tokenAttributeSchema).nullable(),
  owner: z.string().nullable(),
  startBlock: z.string(),
  metadataStatus: metadataStatusSchema,
  standard: z.enum(["ERC721", "ERC1155"]),
  isFeatured: z.boolean(),
  isHidden: z.boolean(),
  service: z.string().nullable(),
  claimedBy: z.string().nullable(),
  floorPrice: z.string().nullable(),
  totalVolume: z.string().nullable(),
  holderCount: z.number(),
  totalSupply: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  profile: z
    .object({
      hasGatedContent: z.boolean(),
      gatedContentTitle: z.string().nullable(),
      slug: z.string().nullable(),
      image: z.string().nullable(),
      displayName: z.string().nullable(),
      description: z.string().nullable(),
    })
    .nullable(),
});
