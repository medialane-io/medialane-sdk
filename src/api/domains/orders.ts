import type { Transport } from "../transport.js";
import type { ApiOrder, ApiOrdersQuery, ApiCounterOffersQuery, ApiResponse } from "../../types/api.js";

export interface OrdersApi {
  list(query?: ApiOrdersQuery): Promise<ApiResponse<ApiOrder[]>>;
  get(orderHash: string): Promise<ApiOrder>;
  forToken(contract: string, tokenId: string): Promise<ApiResponse<ApiOrder[]>>;
  receivedBy(address: string, opts?: { page?: number; limit?: number }): Promise<ApiResponse<ApiOrder[]>>;
  byUser(address: string, opts?: { page?: number; limit?: number }): Promise<ApiResponse<ApiOrder[]>>;
  counterOffers(query: ApiCounterOffersQuery): Promise<ApiResponse<ApiOrder[]>>;
}

export function createOrdersApi(t: Transport): OrdersApi {
  return {
    list(query = {}) {
      return t.get("/v1/orders", {
        status: query.status,
        collection: query.collection,
        currency: query.currency,
        sort: query.sort,
        page: query.page,
        limit: query.limit,
        offerer: query.offerer ? t.addr(query.offerer) : undefined,
        minPrice: query.minPrice,
        maxPrice: query.maxPrice,
        chain: query.chain,
      });
    },
    async get(orderHash) {
      return (await t.get<ApiResponse<ApiOrder>>(`/v1/orders/${orderHash}`)).data;
    },
    forToken(contract, tokenId) {
      return t.get(`/v1/orders/token/${t.addr(contract)}/${tokenId}`);
    },
    receivedBy(address, opts = {}) {
      return t.get(`/v1/orders/received/${t.addr(address)}`, { page: opts.page ?? 1, limit: opts.limit ?? 50 });
    },
    byUser(address, opts = {}) {
      return t.get(`/v1/orders/user/${t.addr(address)}`, { page: opts.page ?? 1, limit: opts.limit ?? 20 });
    },
    counterOffers(query) {
      return t.get("/v1/orders/counter-offers", {
        originalOrderHash: query.originalOrderHash,
        sellerAddress: query.sellerAddress,
        page: query.page,
        limit: query.limit,
      });
    },
  };
}
