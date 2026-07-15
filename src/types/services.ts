import type { PopEventType } from "./api.js";

// ─── POP Protocol ──────────────────────────────────────────────────────────────

export interface CreatePopCollectionParams {
  name: string;
  symbol: string;
  baseUri: string;
  claimEndTime: number;
  eventType: PopEventType;
}

// ─── Collection Drop ───────────────────────────────────────────────────────────

export interface ClaimConditions {
  /** Unix timestamp when minting opens. 0 = open immediately. */
  startTime: number;
  /** Unix timestamp when minting closes. 0 = never closes. */
  endTime: number;
  /** Price per token in payment_token units. 0 = free mint. */
  price: bigint | string;
  /** ERC-20 token address for payment. Must be non-zero if price > 0. */
  paymentToken: string;
  /** Max tokens a single wallet may mint across all phases. 0 = unlimited. */
  maxQuantityPerWallet: bigint | string;
}

export interface CreateDropParams {
  name: string;
  symbol: string;
  baseUri: string;
  maxSupply: bigint | string;
  initialConditions: ClaimConditions;
}

// ─── IP Tickets ────────────────────────────────────────────────────────────────

export interface CreateTicketParams {
  /** Address of the deployed IPTicketCollection contract. */
  collection: string;
  maxSupply: bigint | string;
  /** Unix timestamp (seconds). Omit for "open immediately". */
  startTime?: number;
  /** Unix timestamp (seconds). Omit for "never expires". */
  endTime?: number;
  /** Basis points, 0–10000. */
  royaltyBps: number;
  /** ipfs:// or ar:// — enforced on-chain. */
  metadataUri: string;
}

export interface MintTicketsParams {
  collection: string;
  tokenId: bigint | string;
  to: string;
  amount: bigint | string;
}

// ─── IP Club ───────────────────────────────────────────────────────────────────

export interface CreateClubParams {
  name: string;
  symbol: string;
  /** ipfs:// or ar:// only — enforced on-chain. */
  metadataUri: string;
  maxMembers?: number;
  /** Required (non-zero) with paymentToken set; omit for a free club. */
  entryFee?: bigint | string;
  paymentToken?: string;
}

/** Factory-pattern deploy — one ERC-721 collection per creator. */
export interface DeployClubParams {
  name: string;
  symbol: string;
  /** ipfs:// base URI for the collection. */
  baseUri: string;
  /** Max token supply; defaults to u128 max (effectively unlimited). */
  maxSupply?: bigint | string;
  /** Entry fee in payment token units; 0 = free. */
  entryFee?: bigint | string;
  /** Required when entryFee > 0. */
  paymentToken?: string;
  /** Royalty in basis points (0–10 000). */
  royaltyBps?: bigint | string;
  /** Override factory address. */
  factoryAddress?: string;
}

// ─── IP Sponsorship ────────────────────────────────────────────────────────────
// v3: transferable/expiry are declarative terms only (never contract-enforced —
// carried in license_terms_uri metadata + the LicenseMinted event, read back by
// the indexer, not by an on-chain is_license_valid()). Either side can initiate:
// an owner creates an offer and sponsors bid on it, or a sponsor proposes terms
// directly and the owner accepts/rejects.

export interface CreateSponsorshipOfferParams {
  nftContract: string;
  tokenId: bigint | string;
  minAmount: bigint | string;
  /** Seconds, applied from acceptance (not from offer creation). */
  duration: number;
  paymentToken: string;
  licenseTermsUri: string;
  transferable: boolean;
  /** Basis points, 0–10000. EIP-2981 royalty to the author on license resale. */
  royaltyBps: bigint | string;
  /** Restricts acceptance to one sponsor address; omit for open bidding. */
  specificSponsor?: string;
}

/** Sponsor-initiated — the symmetric counterpart to CreateSponsorshipOfferParams. */
export interface ProposeSponsorshipParams {
  nftContract: string;
  tokenId: bigint | string;
  /** Fixed take-it-or-leave-it amount (not a bid floor). */
  amount: bigint | string;
  duration: number;
  /** Unix seconds; the deadline for the asset owner to accept. 0 = no deadline. */
  validUntil?: number;
  paymentToken: string;
  licenseTermsUri: string;
  transferable: boolean;
  /** Basis points, 0–10000. */
  royaltyBps: bigint | string;
}
