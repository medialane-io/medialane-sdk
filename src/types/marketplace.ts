export interface OfferItem {
  item_type: string;
  token: string;
  identifier_or_criteria: string;
  amount: string;
}

export interface ConsiderationItem extends OfferItem {
  recipient: string;
}

export interface OrderParameters {
  offerer: string;
  marketplace: string;
  offer: OfferItem;
  consideration: ConsiderationItem;
  royalty_max_bps: string;
  start_time: string;
  end_time: string;
  salt: string;
  counter: string;
}

export interface Order {
  parameters: OrderParameters;
  signature: string[];
}

// Fulfillment type removed — fulfill is unsigned (caller is the fulfiller).

export interface Cancelation {
  order_hash: string;
  offerer: string;
}

// SDK-level param types for the public API

export interface CreateListingParams {
  nftContract: string;
  tokenId: string;
  price: string;
  /** Currency symbol or token address. Defaults to "USDC" (native). */
  currency?: string;
  durationSeconds: number;
  /** Signed EIP-2981 royalty cap in bps. Defaults to the NFT's live 2981 rate. */
  royaltyMaxBps?: string;
}

export interface MakeOfferParams {
  nftContract: string;
  tokenId: string;
  price: string;
  /** Currency symbol or token address. Defaults to "USDC" (native). */
  currency?: string;
  durationSeconds: number;
  /** Signed EIP-2981 royalty cap in bps. Defaults to the NFT's live 2981 rate. */
  royaltyMaxBps?: string;
}

export interface FulfillOrderParams {
  orderHash: string;
  /** ERC-20 payment token address — the consideration token on the listing. */
  paymentToken: string;
  /** Total price in raw token units as a string (e.g. "1000000" for 1 USDC). */
  totalPrice: string;
}

export interface CancelOrderParams {
  orderHash: string;
}

export interface CartItem {
  orderHash: string;
  /** ERC20 token address of the consideration */
  considerationToken: string;
  /** Raw consideration amount (string, e.g. "1000000") */
  considerationAmount: string;
  /** Human-readable identifier for the NFT (for logging) */
  offerIdentifier?: string;
  /** ERC-1155 only: number of units to purchase per item (defaults to "1") */
  quantity?: string;
}

export interface MintParams {
  collectionId: string;
  recipient: string;
  tokenUri: string;
  /**
   * EIP-2981 secondary-sale royalty in basis points (0–10_000). Set once at mint;
   * the receiver is the immutable creator (the minting collection owner). Required
   * since MIP v0.4.0 — pass 0 for no royalty.
   */
  royaltyBps: number;
  /** Optional: override the collection contract from config */
  collectionContract?: string;
}

export interface CreateCollectionParams {
  name: string;
  symbol: string;
  baseUri: string;
  /** Optional: override the collection contract from config */
  collectionContract?: string;
}

export interface TxResult {
  txHash: string;
}

export interface OrderDetails {
  offerer: string;
  offer: OfferItem;
  consideration: ConsiderationItem;
  royalty_max_bps: string;
  start_time: bigint;
  end_time: bigint;
  order_status: string;
  /** ERC-1155 only — units still available. */
  remaining_amount?: string;
}

// ─── ERC-1155 Marketplace (Medialane1155) ─────────────────────────────────────

export interface CreateListing1155Params {
  /** ERC-1155 contract address */
  nftContract: string;
  /** Token type ID */
  tokenId: string;
  /** Number of tokens to sell */
  amount: string;
  /** Human-readable price per token (e.g. "1.5") */
  pricePerUnit: string;
  /** Currency symbol or token address. Defaults to "USDC". */
  currency?: string;
  /** How long the listing is valid, in seconds */
  durationSeconds: number;
  /** Signed EIP-2981 royalty cap in bps. Defaults to the NFT's live 2981 rate. */
  royaltyMaxBps?: string;
}

export interface FulfillOrder1155Params {
  /** On-chain order hash */
  orderHash: string;
  /** ERC-20 payment token address (from order details) */
  paymentToken: string;
  /** Total price in raw token units (pricePerUnit × quantity, as string) */
  totalPrice: string;
  /** Number of units to purchase (1 ≤ quantity ≤ remaining_amount). Defaults to 1. */
  quantity?: string;
}

export interface CancelOrder1155Params {
  /** On-chain order hash */
  orderHash: string;
}

export interface MakeOffer1155Params {
  /** ERC-1155 contract address */
  nftContract: string;
  /** Token type ID */
  tokenId: string;
  /** Number of tokens requested */
  amount: string;
  /** Total offer price in human-readable units (e.g. "1.5") */
  price: string;
  /** Currency symbol or token address. Defaults to "USDC". */
  currency?: string;
  /** How long the offer is valid, in seconds */
  durationSeconds: number;
  /** Signed EIP-2981 royalty cap in bps. Defaults to the NFT's live 2981 rate. */
  royaltyMaxBps?: string;
}
