import { z } from "zod";
import { address, felt, uint } from "./primitives.js";

export const FACTORY_FAMILY_SERVICE_IDS = ["mip-erc1155", "ip-tickets", "ip-ticketing", "ip-club"] as const;
export const TIER_SERVICE_IDS = ["ip-tickets", "ip-ticketing", "ip-club"] as const;
export const COLLECTION_SERVICE_IDS = [
  ...FACTORY_FAMILY_SERVICE_IDS,
  "pop-protocol",
  "drop-collection",
  "data-tokenization-erc721",
] as const;

export const listingSchema = z.object({
  offerer: address,
  nftContract: address,
  tokenId: z.string(),
  currency: z.string(),
  price: z.string(),
  endTime: z.number(),
  salt: z.string().optional(),

  amount: z.string().optional(),
});

export const offerSchema = listingSchema.extend({
  tokenStandard: z.enum(["ERC721", "ERC1155"]).optional(),
  quantity: z.string().optional(),
});

export const fulfillSchema = z.object({
  fulfiller: address,
  orderHash: z.string(),
  tokenStandard: z.enum(["ERC721", "ERC1155"]).optional(),
  quantity: z.string().optional(),
});

export const cancelSchema = z.object({
  offerer: address,
  orderHash: z.string(),
  tokenStandard: z.enum(["ERC721", "ERC1155"]).optional(),
});

export const mintSchema = z.object({
  owner: address,
  recipient: address,

  collectionId: z.string().regex(/^\d+$/, "collectionId must be a non-negative integer string").optional(),
  tokenUri: z.string().min(1).optional(),

  royaltyBps: z.number().int().min(0).max(10000).optional().default(0),

  tokenId: z.string().regex(/^\d+$/, "tokenId must be a non-negative integer string").optional(),
  amount: z.string().regex(/^\d+$/, "amount must be a non-negative integer string").optional(),
  value: z.string().regex(/^\d+$/, "value must be a non-negative integer string").optional(),
  collectionContract: address.optional(),
});

export const createCollectionSchema = z.object({
  owner: address,
  name: z.string().min(1),
  symbol: z.string().min(1),
  baseUri: z.string().default(""),
  description: z.string().optional(),
  image: z.string().optional(),
  collectionContract: address.optional(),

  service: z.enum(COLLECTION_SERVICE_IDS).optional(),

  claimEndTimestamp: z.number().int().nonnegative().optional(),

  maxSupply: z.string().regex(/^\d+$/, "maxSupply must be a non-negative integer string").optional(),
  terms: z.object({
    startTime: z.number().int().nonnegative(),
    endTime: z.number().int().nonnegative(),
    price: z.string().regex(/^\d+$/, "price must be a non-negative integer string"),
    paymentToken: address,
    maxPerWallet: z.string().regex(/^\d+$/, "maxPerWallet must be a non-negative integer string"),
  }).optional(),
  allowlistRoot: felt.optional(),
});

export const createTierSchema = z.object({
  owner: address,
  collection: address,
  service: z.enum(TIER_SERVICE_IDS),
  maxSupply: z.string().regex(/^\d+$/, "maxSupply must be a non-negative integer string"),
  startTime: z.number().int().nonnegative().optional(),
  endTime: z.number().int().nonnegative().optional(),
  royaltyBps: z.number().int().min(0).max(10000).default(0),
  metadataUri: z.string().min(1),
});

export const createCoinSchema = z.object({
  owner: address,
  name: z.string().min(1),
  symbol: z.string().min(1),
  initialSupply: z.string().regex(/^\d+$/, "initialSupply must be a non-negative integer string"),
  salt: z.string().optional(),
});

export const launchCoinSchema = z.object({
  owner: address,
  creatorCoin: address,
  quoteToken: address,
  price: z.number().positive(),
  initialHolders: z.array(address).default([]),
  initialHoldersAmounts: z.array(z.string().regex(/^\d+$/, "must be a non-negative integer string")).default([]),
  transferRestrictionDelay: z.number().int().nonnegative().optional(),
  maxPercentageBuyLaunch: z.number().int().nonnegative().optional(),
  quoteFundAmount: z.string().regex(/^\d+$/, "quoteFundAmount must be a non-negative integer string").optional(),
});

export const sponsorshipOfferSchema = z.object({
  author: address,
  nftContract: address,
  tokenId: z.string(),
  minAmount: z.string().regex(/^\d+$/, "minAmount must be a non-negative integer string"),
  duration: z.number().int().positive(),
  paymentToken: address,
  licenseTermsUri: z.string().min(1),
  transferable: z.boolean(),
  royaltyBps: z.number().int().min(0).max(10000).default(0),
  specificSponsor: address.optional(),
});

export const sponsorshipOfferOpenSchema = z.object({
  author: address,
  offerId: z.string(),
  open: z.boolean(),
});

export const sponsorshipBidSchema = z.object({
  sponsor: address,
  offerId: z.string(),
  amount: z.string().regex(/^\d+$/, "amount must be a non-negative integer string"),
  paymentToken: address,
});

export const sponsorshipBidRetractSchema = z.object({
  sponsor: address,
  offerId: z.string(),
});

export const sponsorshipBidAcceptSchema = z.object({
  author: address,
  offerId: z.string(),
  sponsor: address,
});

export const sponsorshipProposalSchema = z.object({
  proposer: address,
  nftContract: address,
  tokenId: z.string(),
  amount: z.string().regex(/^\d+$/, "amount must be a non-negative integer string"),
  duration: z.number().int().positive(),
  validUntil: z.number().int().nonnegative().optional(),
  paymentToken: address,
  licenseTermsUri: z.string().min(1),
  transferable: z.boolean(),
  royaltyBps: z.number().int().min(0).max(10000).default(0),
});

export const sponsorshipProposalWithdrawSchema = z.object({
  proposer: address,
  proposalId: z.string(),
});

export const sponsorshipProposalAcceptSchema = z.object({
  owner: address,
  proposalId: z.string(),
});

export const sponsorshipProposalRejectSchema = z.object({
  owner: address,
  proposalId: z.string(),
});

export const counterOfferSchema = z.object({
  sellerAddress:     z.string().min(1),
  originalOrderHash: z.string().min(1),
  durationSeconds:   z.number().int().min(3600).max(2592000),
  priceRaw:          z.string().regex(/^\d+$/, "priceRaw must be a non-negative integer string"),
  message:           z.string().max(500).optional(),
});

const checkoutItemSchema = z.object({
  orderHash: z.string().min(1),
  quantity: z.string().regex(/^[1-9][0-9]*$/).optional(),
});

export const checkoutBodySchema = z
  .object({
    fulfiller: z.string().min(1),
    orderHashes: z.array(z.string().min(1)).min(1).max(20).optional(),
    items: z.array(checkoutItemSchema).min(1).max(20).optional(),
  })
  .refine((b) => Boolean(b.items?.length || b.orderHashes?.length), {
    message: "Provide items or orderHashes",
  });

export const confirmSchema = z.object({
  txHash: z.string().regex(/^0x[0-9a-fA-F]{1,64}$/, "Invalid transaction hash"),
});

export const signatureSchema = z.object({
  signature: z.array(z.string()).min(1, "signature array required"),
});

export const transferTokenSchema = z.object({ owner: address, token: address, recipient: address, amount: uint });
export const transferNftSchema = z.object({
  owner: address,
  contractAddress: address,
  tokenId: uint,
  recipient: address,
  tokenStandard: z.enum(["ERC721", "ERC1155"]),
});
export const transferCollectionOwnershipSchema = z.object({ owner: address, collectionId: uint, newOwner: address });
export const commentSchema = z.object({ author: address, nftContract: address, tokenId: uint, text: z.string().trim().min(1).max(1000) });
export const genesisMintSchema = z.object({ owner: address, recipient: address });

export const popClaimSchema = z.object({ claimer: address, collection: address, proof: z.array(felt) });
export const popBurnSchema = z.object({ owner: address, collection: address, tokenId: uint });
export const dropClaimSchema = z.object({ claimer: address, collection: address, quantity: uint, proof: z.array(felt).optional() });

export const walletManageSchema = z.object({
  owner: address,
  action: z.enum(["add_owner", "remove_owner", "cancel_escape", "set_first_guardian", "trigger_escape", "complete_escape"]),
  pubkey: felt.optional(),
  ownerGuid: felt.optional(),
  newOwnerPubkey: felt.optional(),
});
export const swapIntentSchema = z.object({
  taker: address,
  sellTokenAddress: address,
  buyTokenAddress: address,
  sellAmountRaw: uint.optional(),
  buyAmountRaw: uint.optional(),
});
export const fundingTransferSchema = z.object({ owner: address, asset: address, amountAtomic: uint });

export const dropManageSchema = z.object({
  owner: address,
  collection: address,
  action: z.enum(["issue", "set_allowlist_root"]),
  recipient: address.optional(),
  quantity: uint.optional(),
  root: felt.optional(),
});
export const popManageSchema = z.object({
  owner: address,
  collection: address,
  action: z.enum(["issue", "set_allowlist_root"]),
  recipient: address.optional(),
  tokenUri: z.string().optional(),
  root: felt.optional(),
});
