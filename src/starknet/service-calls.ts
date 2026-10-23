import { CairoOption, CairoOptionVariant, CallData, cairo, type Abi, type Call, type RawArgs } from "starknet";
import { normalizeAddress } from "../utils/address.js";
import {
  IPClubCollectionABI,
  IPClubFactoryABI,
  IPCollection1155ABI,
  IPCollection1155FactoryABI,
  IPSponsorshipABI,
  IPTicketCollectionABI,
  IPTicketCollectionFactoryABI,
  POPFactoryABI,
} from "./abis/index.js";
import type {
  CreateMembershipParams,
  CreatePopCollectionParams,
  CreateSponsorshipOfferParams,
  AddSupplyParams,
  BatchMintEditionParams,
  CreateTicketParams,
  MintEditionParams,
  MintMembershipsParams,
  MintTicketsParams,
  ProposeSponsorshipParams,
} from "../types/services.js";

export function populateCall(abi: unknown, contractAddress: string, entrypoint: string, args: unknown[]): Call {
  return { contractAddress, entrypoint, calldata: new CallData(abi as Abi).compile(entrypoint, args as RawArgs) };
}

const addr = (address: string) => normalizeAddress("STARKNET", address);

const optionOf = <T>(value: T | null | undefined) =>
  value != null ? new CairoOption(CairoOptionVariant.Some, value) : new CairoOption(CairoOptionVariant.None);

const deployCollectionCall = (abi: unknown, factory: string, p: { name: string; symbol: string; baseUri: string }) =>
  populateCall(abi, addr(factory), "deploy_collection", [p.name, p.symbol, p.baseUri]);

export interface DeployCollectionArgs {
  name: string;
  symbol: string;
  baseUri: string;
}

export const popFactoryCalls = {
  createCollection: (factory: string, p: CreatePopCollectionParams): Call =>
    populateCall(POPFactoryABI, factory, "create_collection", [p.name, p.symbol, p.baseUri, p.claimEndTime]),
};

export const ticketCalls = {
  deployCollection: (factory: string, p: DeployCollectionArgs): Call =>
    deployCollectionCall(IPTicketCollectionFactoryABI, factory, p),

  createTicket: (p: CreateTicketParams): Call =>
    populateCall(IPTicketCollectionABI, addr(p.collection), "create_ticket", [
      cairo.uint256(p.maxSupply),
      optionOf(p.startTime),
      optionOf(p.endTime),
      p.royaltyBps,
      p.metadataUri,
    ]),

  mint: (p: MintTicketsParams): Call =>
    populateCall(IPTicketCollectionABI, addr(p.collection), "mint", [
      p.to,
      cairo.uint256(p.tokenId),
      cairo.uint256(p.amount),
    ]),
};

export const clubCalls = {
  deployCollection: (factory: string, p: DeployCollectionArgs): Call =>
    deployCollectionCall(IPClubFactoryABI, factory, p),

  createMembership: (p: CreateMembershipParams): Call =>
    populateCall(IPClubCollectionABI, addr(p.collection), "create_membership", [
      cairo.uint256(p.maxSupply),
      optionOf(p.startTime),
      optionOf(p.endTime),
      p.royaltyBps,
      p.metadataUri,
    ]),

  mint: (p: MintMembershipsParams): Call =>
    populateCall(IPClubCollectionABI, addr(p.collection), "mint", [
      p.to,
      cairo.uint256(p.tokenId),
      cairo.uint256(p.amount),
    ]),
};

type Id = bigint | string;

const sponsorship = (contract: string, entrypoint: string, args: unknown[]): Call =>
  populateCall(IPSponsorshipABI, addr(contract), entrypoint, args);

export const sponsorshipCalls = {
  createOffer: (contract: string, p: CreateSponsorshipOfferParams): Call =>
    sponsorship(contract, "create_offer", [
      p.nftContract,
      cairo.uint256(p.tokenId),
      cairo.uint256(p.minAmount),
      p.duration,
      p.paymentToken,
      p.licenseTermsUri,
      p.transferable,
      cairo.uint256(p.royaltyBps),
      p.specificSponsor ? new CairoOption(CairoOptionVariant.Some, p.specificSponsor) : new CairoOption(CairoOptionVariant.None),
    ]),

  setOfferOpen: (contract: string, p: { offerId: Id; open: boolean }): Call =>
    sponsorship(contract, "set_offer_open", [cairo.uint256(p.offerId), p.open]),

  placeBid: (contract: string, p: { offerId: Id; amount: Id; paymentToken: string }): Call[] => {
    const amount = cairo.uint256(p.amount);
    return [
      {
        contractAddress: p.paymentToken,
        entrypoint: "approve",
        calldata: [addr(contract), amount.low.toString(), amount.high.toString()],
      },
      sponsorship(contract, "place_bid", [cairo.uint256(p.offerId), amount]),
    ];
  },

  retractBid: (contract: string, p: { offerId: Id }): Call =>
    sponsorship(contract, "retract_bid", [cairo.uint256(p.offerId)]),

  acceptBid: (contract: string, p: { offerId: Id; sponsor: string }): Call =>
    sponsorship(contract, "accept_bid", [cairo.uint256(p.offerId), p.sponsor]),

  propose: (contract: string, p: ProposeSponsorshipParams): Call =>
    sponsorship(contract, "propose_sponsorship", [
      p.nftContract,
      cairo.uint256(p.tokenId),
      cairo.uint256(p.amount),
      p.duration,
      p.validUntil ?? 0,
      p.paymentToken,
      p.licenseTermsUri,
      p.transferable,
      cairo.uint256(p.royaltyBps),
    ]),

  withdrawProposal: (contract: string, p: { proposalId: Id }): Call =>
    sponsorship(contract, "withdraw_proposal", [cairo.uint256(p.proposalId)]),

  acceptProposal: (contract: string, p: { proposalId: Id }): Call =>
    sponsorship(contract, "accept_proposal", [cairo.uint256(p.proposalId)]),

  rejectProposal: (contract: string, p: { proposalId: Id }): Call =>
    sponsorship(contract, "reject_proposal", [cairo.uint256(p.proposalId)]),
};

const edition = (collection: string, entrypoint: string, args: unknown[]): Call =>
  populateCall(IPCollection1155ABI, addr(collection), entrypoint, args);

export const editionCalls = {
  deployCollection: (factory: string, p: DeployCollectionArgs): Call =>
    deployCollectionCall(IPCollection1155FactoryABI, factory, p),

  mintEdition: (p: MintEditionParams): Call =>
    edition(p.collection, "mint_edition", [p.to, BigInt(p.value), p.tokenUri]),

  batchMintEdition: (p: BatchMintEditionParams): Call =>
    edition(p.collection, "batch_mint_edition", [
      p.to,
      p.items.map((i) => BigInt(i.value)),
      p.items.map((i) => i.tokenUri),
    ]),

  addSupply: (p: AddSupplyParams): Call =>
    edition(p.collection, "add_supply", [p.to, BigInt(p.tokenId), BigInt(p.value)]),

  setDefaultRoyalty: (p: { collection: string; receiver: string; feeNumerator: number }): Call =>
    edition(p.collection, "set_default_royalty", [p.receiver, BigInt(p.feeNumerator)]),

  setTokenRoyalty: (p: { collection: string; tokenId: Id; receiver: string; feeNumerator: number }): Call =>
    edition(p.collection, "set_token_royalty", [BigInt(p.tokenId), p.receiver, BigInt(p.feeNumerator)]),

  setApprovalForAll: (p: { collection: string; operator: string; approved: boolean }): Call =>
    edition(p.collection, "set_approval_for_all", [p.operator, p.approved]),
};
