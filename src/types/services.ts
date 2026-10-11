export interface CreatePopCollectionParams {
  name: string;
  symbol: string;
  baseUri: string;
  /** Unix seconds; 0 = no deadline. */
  claimEndTime: number;
}

export interface DropTerms {
  /** Unix seconds; 0 = open from creation. */
  startTime: number;
  /** Unix seconds; 0 = never closes. */
  endTime: number;
  /** Per token, in the payment token's smallest unit; 0 = free. */
  price: bigint | string;
  /** Sent as zero when the drop is free. */
  paymentToken: string;
  /** Claims per wallet; 0 = unlimited. */
  maxPerWallet: bigint | string;
}

export interface CreateDropParams {
  name: string;
  symbol: string;
  /** Token URI = baseUri + token id. */
  baseUri: string;
  /** 0 = no cap. */
  maxSupply: bigint | string;
  terms: DropTerms;
  /** Merkle root of the allowlist; absent or 0 = open to everyone. */
  allowlistRoot?: string;
}

export interface CreateTicketParams {

  collection: string;
  maxSupply: bigint | string;

  startTime?: number;

  endTime?: number;

  royaltyBps: number;

  metadataUri: string;
}

export interface MintTicketsParams {
  collection: string;
  tokenId: bigint | string;
  to: string;
  amount: bigint | string;
}

export interface CreateMembershipParams {

  collection: string;
  maxSupply: bigint | string;

  startTime?: number;

  endTime?: number;

  royaltyBps: number;

  metadataUri: string;
}

export interface MintMembershipsParams {
  collection: string;
  tokenId: bigint | string;
  to: string;
  amount: bigint | string;
}

export interface CreateSponsorshipOfferParams {
  nftContract: string;
  tokenId: bigint | string;
  minAmount: bigint | string;

  duration: number;
  paymentToken: string;
  licenseTermsUri: string;
  transferable: boolean;

  royaltyBps: bigint | string;

  specificSponsor?: string;
}

export interface ProposeSponsorshipParams {
  nftContract: string;
  tokenId: bigint | string;

  amount: bigint | string;
  duration: number;

  validUntil?: number;
  paymentToken: string;
  licenseTermsUri: string;
  transferable: boolean;

  royaltyBps: bigint | string;
}
