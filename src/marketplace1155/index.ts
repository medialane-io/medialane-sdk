import { type AccountInterface, type TypedData, constants } from "starknet";
import type { ResolvedConfig } from "../config.js";
import type {
  CreateListing1155Params,
  MakeOffer1155Params,
  FulfillOrder1155Params,
  CancelOrder1155Params,
  CartItem,
  TxResult,
} from "../types/marketplace.js";
import {
  build1155OrderTypedData,
  build1155FulfillmentTypedData,
  build1155CancellationTypedData,
} from "./signing.js";
import {
  createListing1155,
  makeOffer1155,
  fulfillOrder1155,
  cancelOrder1155,
  checkoutCart1155,
} from "./orders.js";

export class Medialane1155Module {
  constructor(private readonly config: ResolvedConfig) {}

  // ─── Writes ───────────────────────────────────────────────────────────────

  /**
   * Create an ERC-1155 sell listing.
   * Optionally grants `set_approval_for_all` if not already approved.
   */
  createListing(account: AccountInterface, params: CreateListing1155Params): Promise<TxResult> {
    return createListing1155(account, params, this.config);
  }

  /**
   * Make an offer (bid) on an ERC-1155 token.
   * Approves the ERC-20 spend then calls `register_order` atomically.
   */
  makeOffer(account: AccountInterface, params: MakeOffer1155Params): Promise<TxResult> {
    return makeOffer1155(account, params, this.config);
  }

  /**
   * Fulfill (buy) an ERC-1155 listing.
   * Approves the payment token then calls `fulfill_order` atomically.
   */
  fulfillOrder(account: AccountInterface, params: FulfillOrder1155Params): Promise<TxResult> {
    return fulfillOrder1155(account, params, this.config);
  }

  /**
   * Cancel an ERC-1155 listing (offerer only).
   */
  cancelOrder(account: AccountInterface, params: CancelOrder1155Params): Promise<TxResult> {
    return cancelOrder1155(account, params, this.config);
  }

  /**
   * Checkout a cart of ERC-1155 orders atomically.
   * Signs one fulfillment per item (with quantity), sums ERC-20 approvals by token.
   */
  checkoutCart(account: AccountInterface, items: CartItem[]): Promise<TxResult> {
    return checkoutCart1155(account, items, this.config);
  }

  // ─── Typed data builders (for ChipiPay / custom signing flows) ───────────

  buildListingTypedData(
    params: Record<string, unknown>,
    chainId: constants.StarknetChainId
  ): TypedData {
    return build1155OrderTypedData(params, chainId);
  }

  buildFulfillmentTypedData(
    params: Record<string, unknown>,
    chainId: constants.StarknetChainId
  ): TypedData {
    return build1155FulfillmentTypedData(params, chainId);
  }

  buildCancellationTypedData(
    params: Record<string, unknown>,
    chainId: constants.StarknetChainId
  ): TypedData {
    return build1155CancellationTypedData(params, chainId);
  }
}
