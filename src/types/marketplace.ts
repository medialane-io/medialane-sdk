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

  counter: string;

  remaining_amount?: string;
}

