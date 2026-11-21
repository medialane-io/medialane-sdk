export interface CreatePopCollectionParams {
  name: string;
  symbol: string;
  baseUri: string;
  claimEndTime: number;
}

export interface DropTerms {
  startTime: number;
  endTime: number;
  price: bigint | string;
  paymentToken: string;
  maxPerWallet: bigint | string;
}

export interface CreateDropParams {
  name: string;
  symbol: string;
  baseUri: string;
  maxSupply: bigint | string;
  terms: DropTerms;
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

export interface DeployCollectionParams {

  name: string;

  symbol: string;

  baseUri: string;
}

export interface MintEditionParams {

  collection: string;

  to: string;

  value: bigint | string;

  tokenUri: string;
}

export interface BatchMintEditionParams {

  collection: string;

  to: string;

  items: Array<{
    value: bigint | string;
    tokenUri: string;
  }>;
}

export interface AddSupplyParams {

  collection: string;

  to: string;

  tokenId: bigint | string;

  value: bigint | string;
}
