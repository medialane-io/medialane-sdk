import { describe, expect, test } from "bun:test";
import type { ZodTypeAny } from "zod";
import * as S from "./intents.js";

const A = "0x1";
const B = "0x2";
const C = "0x3";

const cases: Array<[string, ZodTypeAny, Record<string, unknown>, string]> = [
  ["listingSchema", S.listingSchema, { offerer: A, nftContract: B, tokenId: "1", currency: C, price: "100", endTime: 1900000000 }, "price"],
  ["offerSchema", S.offerSchema, { offerer: A, nftContract: B, tokenId: "1", currency: C, price: "100", endTime: 1900000000, tokenStandard: "ERC721" }, "offerer"],
  ["fulfillSchema", S.fulfillSchema, { fulfiller: A, orderHash: "0xabc" }, "fulfiller"],
  ["cancelSchema", S.cancelSchema, { offerer: A, orderHash: "0xabc" }, "orderHash"],
  ["mintSchema", S.mintSchema, { owner: A, recipient: B }, "recipient"],
  ["createCollectionSchema", S.createCollectionSchema, { owner: A, name: "n", symbol: "s" }, "name"],
  ["createTierSchema", S.createTierSchema, { owner: A, collection: B, service: "ip-club", maxSupply: "10", metadataUri: "ipfs://x" }, "metadataUri"],
  ["createCoinSchema", S.createCoinSchema, { owner: A, name: "n", symbol: "s", initialSupply: "1" }, "symbol"],
  ["launchCoinSchema", S.launchCoinSchema, { owner: A, creatorCoin: B, quoteToken: C, price: 1.5 }, "quoteToken"],
  ["sponsorshipOfferSchema", S.sponsorshipOfferSchema, { author: A, nftContract: B, tokenId: "1", minAmount: "1", duration: 1, paymentToken: C, licenseTermsUri: "u", transferable: true }, "author"],
  ["sponsorshipOfferOpenSchema", S.sponsorshipOfferOpenSchema, { author: A, offerId: "1", open: true }, "offerId"],
  ["sponsorshipBidSchema", S.sponsorshipBidSchema, { sponsor: A, offerId: "1", amount: "1", paymentToken: B }, "amount"],
  ["sponsorshipBidRetractSchema", S.sponsorshipBidRetractSchema, { sponsor: A, offerId: "1" }, "sponsor"],
  ["sponsorshipBidAcceptSchema", S.sponsorshipBidAcceptSchema, { author: A, offerId: "1", sponsor: B }, "sponsor"],
  ["sponsorshipProposalSchema", S.sponsorshipProposalSchema, { proposer: A, nftContract: B, tokenId: "1", amount: "1", duration: 1, paymentToken: C, licenseTermsUri: "u", transferable: false }, "proposer"],
  ["sponsorshipProposalWithdrawSchema", S.sponsorshipProposalWithdrawSchema, { proposer: A, proposalId: "1" }, "proposalId"],
  ["sponsorshipProposalAcceptSchema", S.sponsorshipProposalAcceptSchema, { owner: A, proposalId: "1" }, "owner"],
  ["sponsorshipProposalRejectSchema", S.sponsorshipProposalRejectSchema, { owner: A, proposalId: "1" }, "owner"],
  ["counterOfferSchema", S.counterOfferSchema, { sellerAddress: "s", originalOrderHash: "h", durationSeconds: 3600, priceRaw: "1" }, "priceRaw"],
  ["checkoutBodySchema", S.checkoutBodySchema, { fulfiller: A, orderHashes: ["0x1"] }, "fulfiller"],
  ["confirmSchema", S.confirmSchema, { txHash: "0x1" }, "txHash"],
  ["signatureSchema", S.signatureSchema, { signature: ["0x1"] }, "signature"],
  ["transferTokenSchema", S.transferTokenSchema, { owner: A, token: B, recipient: C, amount: "1" }, "amount"],
  ["transferNftSchema", S.transferNftSchema, { owner: A, contractAddress: B, tokenId: "1", recipient: C, tokenStandard: "ERC721" }, "tokenStandard"],
  ["transferCollectionOwnershipSchema", S.transferCollectionOwnershipSchema, { owner: A, collectionId: "1", newOwner: B }, "newOwner"],
  ["commentSchema", S.commentSchema, { author: A, nftContract: B, tokenId: "1", text: "hi" }, "text"],
  ["genesisMintSchema", S.genesisMintSchema, { owner: A, recipient: B }, "recipient"],
  ["popClaimSchema", S.popClaimSchema, { claimer: A, collection: B, proof: ["0x1"] }, "proof"],
  ["popBurnSchema", S.popBurnSchema, { owner: A, collection: B, tokenId: "1" }, "tokenId"],
  ["dropClaimSchema", S.dropClaimSchema, { claimer: A, collection: B, quantity: "1" }, "quantity"],
  ["walletManageSchema", S.walletManageSchema, { owner: A, action: "add_owner" }, "action"],
  ["swapIntentSchema", S.swapIntentSchema, { taker: A, sellTokenAddress: B, buyTokenAddress: C }, "taker"],
  ["fundingTransferSchema", S.fundingTransferSchema, { owner: A, asset: B, amountAtomic: "1" }, "amountAtomic"],
  ["dropManageSchema", S.dropManageSchema, { owner: A, collection: B, action: "issue" }, "collection"],
  ["popManageSchema", S.popManageSchema, { owner: A, collection: B, action: "issue" }, "action"],
];

describe("intent request schemas", () => {
  test.each(cases)("%s accepts a valid body", (_name, schema, valid) => {
    expect(schema.safeParse(valid).success).toBe(true);
  });

  test.each(cases)("%s rejects a body without its required field", (_name, schema, valid, required) => {
    const { [required]: _dropped, ...rest } = valid;
    const result = schema.safeParse(rest);
    expect(result.success).toBe(false);
    if (!result.success && _name !== "checkoutBodySchema") {
      expect(result.error.issues.some((i) => i.path[0] === required)).toBe(true);
    }
  });

  test("defaults are applied", () => {
    expect(S.mintSchema.parse({ owner: A, recipient: B }).royaltyBps).toBe(0);
    expect(S.createCollectionSchema.parse({ owner: A, name: "n", symbol: "s" }).baseUri).toBe("");
    expect(S.createTierSchema.parse({ owner: A, collection: B, service: "ip-club", maxSupply: "1", metadataUri: "u" }).royaltyBps).toBe(0);
    const coin = S.launchCoinSchema.parse({ owner: A, creatorCoin: B, quoteToken: C, price: 1 });
    expect([coin.initialHolders, coin.initialHoldersAmounts]).toEqual([[], []]);
  });

  test("a token standard other than ERC721 and ERC1155 is rejected", () => {
    expect(S.fulfillSchema.safeParse({ fulfiller: A, orderHash: "0x1", tokenStandard: "ERC20" }).success).toBe(false);
    expect(S.fulfillSchema.safeParse({ fulfiller: A, orderHash: "0x1", tokenStandard: "ERC1155" }).success).toBe(true);
  });

  test("a checkout needs items or order hashes", () => {
    const result = S.checkoutBodySchema.safeParse({ fulfiller: A });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.message).toBe("Provide items or orderHashes");
  });

  test("a comment is trimmed and cannot be blank", () => {
    expect(S.commentSchema.parse({ author: A, nftContract: B, tokenId: "1", text: "  hi  " }).text).toBe("hi");
    expect(S.commentSchema.safeParse({ author: A, nftContract: B, tokenId: "1", text: "   " }).success).toBe(false);
  });

  test("a service outside the lists is rejected", () => {
    expect(S.createTierSchema.safeParse({ owner: A, collection: B, service: "mip-erc1155", maxSupply: "1", metadataUri: "u" }).success).toBe(false);
    expect(S.createCollectionSchema.safeParse({ owner: A, name: "n", symbol: "s", service: "drop-collection" }).success).toBe(true);
  });
});
