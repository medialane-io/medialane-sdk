import type { Transport } from "../transport.js";
import type { ApiActivitiesQuery, ApiActivity, ApiResponse, ApiSearchResult, ApiWalletActivity, ChainFilter } from "../../types/api.js";

export interface ActivityApi {
  list(query?: ApiActivitiesQuery): Promise<ApiResponse<ApiActivity[]>>;
  byAddress(address: string, opts?: { page?: number; limit?: number }): Promise<ApiResponse<ApiActivity[]>>;
  wallet(address: string, chain?: "STARKNET"): Promise<ApiResponse<ApiWalletActivity[]>>;
}

export interface SearchApi {
  (q: string, limit?: number, chain?: ChainFilter): Promise<ApiResponse<ApiSearchResult> & { query: string }>;
}

export function createActivityApi(t: Transport): ActivityApi {
  return {
    list(query = {}) {
      return t.get("/v1/activities", {
        type: query.type,
        contract: query.contract,
        page: query.page,
        limit: query.limit,
        chain: query.chain,
      });
    },
    byAddress(address, opts = {}) {
      return t.get(`/v1/activities/${t.addr(address)}`, { page: opts.page ?? 1, limit: opts.limit ?? 20 });
    },
    wallet(address, chain = "STARKNET") {
      return t.get("/v1/wallet-activity", { address: t.addr(address), chain });
    },
  };
}

export function createSearchApi(t: Transport): SearchApi {
  return (q, limit = 10, chain) => t.get("/v1/search", { q, limit, chain });
}
