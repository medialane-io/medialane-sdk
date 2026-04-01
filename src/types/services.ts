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
