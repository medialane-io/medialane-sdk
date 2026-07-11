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

// SDK-level param types for the public API

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
  /** The offerer's bulk-cancel epoch at registration; re-checked at fulfilment. */
  counter: string;
  /** ERC-1155 only — units still available. */
  remaining_amount?: string;
}

// ─── ERC-1155 Marketplace (Medialane1155) ─────────────────────────────────────

