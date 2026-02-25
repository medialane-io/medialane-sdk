export type OrderStatus = "ACTIVE" | "FULFILLED" | "CANCELLED" | "EXPIRED";
export type SortOrder = "price_asc" | "price_desc" | "recent";

export interface ApiOrdersQuery {
  status?: OrderStatus;
  collection?: string;
  currency?: string;
  sort?: SortOrder;
  page?: number;
  limit?: number;
  offerer?: string;
}

export interface ApiOrderOffer {
  itemType: string;
  token: string;
  identifier: string;
  startAmount: string;
  endAmount: string;
}

export interface ApiOrderConsideration extends ApiOrderOffer {
  recipient: string;
}

export interface ApiOrderPrice {
  raw: string;
  formatted: string;
  currency: string;
}

export interface ApiOrderTxHash {
  created: string | null;
  fulfilled: string | null;
  cancelled: string | null;
}

export interface ApiOrder {
  id: string;
  orderHash: string;
  offerer: string;
  offer: ApiOrderOffer;
  consideration: ApiOrderConsideration;
  startTime: string;
  endTime: string;
  status: OrderStatus;
  fulfiller: string | null;
  nftContract: string;
  nftTokenId: string;
  price: ApiOrderPrice;
  txHash: ApiOrderTxHash;
  createdBlockNumber: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiTokenMetadata {
  name: string | null;
  description: string | null;
  image: string | null;
  attributes: unknown | null;
  ipType: string | null;
  licenseType: string | null;
  commercialUse: boolean | null;
  author: string | null;
}

export interface ApiToken {
  id: string;
  contractAddress: string;
  tokenId: string;
  owner: string;
  tokenUri: string | null;
  metadataStatus: "PENDING" | "FETCHED" | "FAILED";
  metadata: ApiTokenMetadata;
  activeOrders: ApiOrder[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiCollection {
  id: string;
  contractAddress: string;
  name: string | null;
  startBlock: string;
  isKnown: boolean;
  floorPrice: string | null;
  totalVolume: string | null;
  holderCount: number | null;
  totalSupply: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiMeta {
  page: number;
  limit: number;
  total: number;
}

export interface ApiResponse<T> {
  data: T;
  meta?: ApiMeta;
}
