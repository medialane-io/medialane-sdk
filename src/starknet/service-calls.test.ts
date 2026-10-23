import { describe, test, expect } from "bun:test";
import type { Call } from "starknet";
import { getStarknetCoordinates } from "../chains.js";
import { buildCreateCreatorCoinCall, buildLaunchOnEkuboCalls, VALIDATED_EKUBO_PARAMS } from "./services/creatorCoin.js";
import { clubCalls, editionCalls, popFactoryCalls, sponsorshipCalls, ticketCalls } from "./service-calls.js";
import golden from "./service-calls.golden.json";

const plain = (value: unknown) => JSON.parse(JSON.stringify(value, (_k, v) => (typeof v === "bigint" ? `${v}n` : v)));
const list = (calls: Call | Call[]) => (Array.isArray(calls) ? calls : [calls]);

describe("call builders produce the calldata the service classes produced before they were removed", () => {
  const sn = getStarknetCoordinates("STARKNET");
  const A = "0x0a1", B = "0x0b2", C = "0x0c3", D = "0x0d4";
  const deploy = { name: "N", symbol: "S", baseUri: "ipfs://b" };
  const out: Record<string, unknown> = {
    "ticket.deploy": list(ticketCalls.deployCollection(sn.ipTicketsFactory, deploy)),
    "ticket.deploy.factory": list(ticketCalls.deployCollection(D, deploy)),
    "ticket.create": list(ticketCalls.createTicket({ collection: A, maxSupply: 100n, startTime: 5, endTime: 9, royaltyBps: 250, metadataUri: "ipfs://m" })),
    "ticket.create.none": list(ticketCalls.createTicket({ collection: A, maxSupply: "100", royaltyBps: 0, metadataUri: "ipfs://m" })),
    "ticket.mint": list(ticketCalls.mint({ collection: A, tokenId: 3n, to: B, amount: "7" })),
    "club.deploy": list(clubCalls.deployCollection(sn.ipClubFactory, deploy)),
    "club.create": list(clubCalls.createMembership({ collection: A, maxSupply: 100n, startTime: 5, royaltyBps: 250, metadataUri: "ipfs://m" })),
    "club.mint": list(clubCalls.mint({ collection: A, tokenId: 3n, to: B, amount: "7" })),
    "sp.createOffer": list(sponsorshipCalls.createOffer(sn.ipSponsorship, { nftContract: A, tokenId: 1n, minAmount: 5n, duration: 86400, paymentToken: B, licenseTermsUri: "ipfs://l", transferable: true, royaltyBps: 500n, specificSponsor: C })),
    "sp.createOffer.open": list(sponsorshipCalls.createOffer(sn.ipSponsorship, { nftContract: A, tokenId: "1", minAmount: "5", duration: 86400, paymentToken: B, licenseTermsUri: "ipfs://l", transferable: false, royaltyBps: 0n })),
    "sp.setOfferOpen": list(sponsorshipCalls.setOfferOpen(sn.ipSponsorship, { offerId: 4n, open: false })),
    "sp.placeBid": list(sponsorshipCalls.placeBid(sn.ipSponsorship, { offerId: 4n, amount: 2n ** 130n, paymentToken: B })),
    "sp.retractBid": list(sponsorshipCalls.retractBid(sn.ipSponsorship, { offerId: "4" })),
    "sp.acceptBid": list(sponsorshipCalls.acceptBid(sn.ipSponsorship, { offerId: 4n, sponsor: C })),
    "sp.propose": list(sponsorshipCalls.propose(sn.ipSponsorship, { nftContract: A, tokenId: 1n, amount: 5n, duration: 86400, validUntil: 99, paymentToken: B, licenseTermsUri: "ipfs://l", transferable: true, royaltyBps: 100n })),
    "sp.propose.noValid": list(sponsorshipCalls.propose(sn.ipSponsorship, { nftContract: A, tokenId: 1n, amount: 5n, duration: 86400, paymentToken: B, licenseTermsUri: "ipfs://l", transferable: true, royaltyBps: 100n })),
    "sp.withdraw": list(sponsorshipCalls.withdrawProposal(sn.ipSponsorship, { proposalId: 8n })),
    "sp.acceptProposal": list(sponsorshipCalls.acceptProposal(sn.ipSponsorship, { proposalId: 8n })),
    "sp.rejectProposal": list(sponsorshipCalls.rejectProposal(sn.ipSponsorship, { proposalId: 8n })),
    "sp.override": list(sponsorshipCalls.retractBid(D, { offerId: 4n })),
    "ed.deploy": list(editionCalls.deployCollection(sn.collection1155, deploy)),
    "ed.mintEdition": list(editionCalls.mintEdition({ collection: A, to: B, value: 10n, tokenUri: "ipfs://t" })),
    "ed.batch": list(editionCalls.batchMintEdition({ collection: A, to: B, items: [{ value: 1n, tokenUri: "ipfs://1" }, { value: "2", tokenUri: "ipfs://2" }] })),
    "ed.addSupply": list(editionCalls.addSupply({ collection: A, to: B, tokenId: 3n, value: "4" })),
    "ed.defaultRoyalty": list(editionCalls.setDefaultRoyalty({ collection: A, receiver: B, feeNumerator: 250 })),
    "ed.tokenRoyalty": list(editionCalls.setTokenRoyalty({ collection: A, tokenId: 3n, receiver: B, feeNumerator: 250 })),
    "ed.approval": list(editionCalls.setApprovalForAll({ collection: A, operator: B, approved: true })),
    "coin.create": [buildCreateCreatorCoinCall({ owner: A, name: "Coin", symbol: "CN", initialSupply: 1000n, salt: 77n })],
    "coin.launch": buildLaunchOnEkuboCalls({ creatorCoin: A, quoteToken: B, initialHolders: [C, D], initialHoldersAmounts: [1n, "2"], ekubo: VALIDATED_EKUBO_PARAMS, quoteFundAmount: 5n }),
    "coin.launch.nofund": buildLaunchOnEkuboCalls({ creatorCoin: A, quoteToken: B, initialHolders: [], initialHoldersAmounts: [], transferRestrictionDelay: 3, maxPercentageBuyLaunch: 100, ekubo: VALIDATED_EKUBO_PARAMS }),
    "pop.create": list(popFactoryCalls.createCollection(sn.popFactory, { name: "N", symbol: "S", baseUri: "ipfs://b", claimEndTime: 99 })),
  };

  for (const name of Object.keys(golden)) {
    test(name, () => {
      expect(plain(out[name])).toEqual(golden[name as keyof typeof golden]);
    });
  }

  test("every golden entry has a case and every case has a golden entry", () => {
    expect(Object.keys(out).sort()).toEqual(Object.keys(golden).sort());
  });
});
