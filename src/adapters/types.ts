import type { Chain } from "../chains.js";

export interface VenueSigner<TypedData = unknown, Call = unknown> {
  readonly address: string;
  signTypedData(data: TypedData): Promise<string[]>;
  execute(calls: Call[]): Promise<{ txHash: string }>;
}

export interface AssetRef {
  chain: Chain;
  contract: string;
  tokenId: string;
}

export type OrderRef = string;

export interface RegisterOrderParams {
  asset: AssetRef;

  side: "listing" | "bid";

  paymentToken: string;

  amount: string;

  quantity?: string;
  royaltyMaxBps: number;
  startTime: number;

  endTime: number;
  salt: string;
}

export interface AdapterTxResult {
  txHash: string;
}

export interface VenueAdapter<Signer> {
  readonly chain: Chain;
  registerOrder(signer: Signer, params: RegisterOrderParams): Promise<AdapterTxResult & { orderRef: OrderRef }>;
  fulfillOrder(
    signer: Signer,
    orderRef: OrderRef,
    opts?: { quantity?: string } & Record<string, string | undefined>,
  ): Promise<AdapterTxResult>;
  cancelOrder(
    signer: Signer,
    orderRef: OrderRef,
    opts?: Record<string, string | undefined>,
  ): Promise<AdapterTxResult>;
  incrementCounter(signer: Signer): Promise<AdapterTxResult>;
  getOrderDetails(orderRef: OrderRef): Promise<unknown>;
  getCounter(address: string): Promise<bigint>;
}

export interface CreateCollectionInput {
  name: string;
  symbol: string;
  baseUri: string;
  royaltyBps: number;
}

export interface MintInput {
  collection: string;
  recipient: string;
  tokenUri: string;
}

export interface IssuanceAdapter<Signer> {
  readonly chain: Chain;
  createCollection(signer: Signer, params: CreateCollectionInput): Promise<AdapterTxResult & { collection: string }>;
  mint(signer: Signer, params: MintInput): Promise<AdapterTxResult & { tokenId: string }>;
  batchMint(signer: Signer, params: { collection: string; recipients: string[]; tokenUris: string[] }): Promise<AdapterTxResult>;
}
