import type { Transport } from "../transport.js";
import type {
  ApiActivity,
  ApiComment,
  ApiPublicRemix,
  ApiResponse,
  ApiToken,
  ApiTokenBalance,
  ApiTokensQuery,
} from "../../types/api.js";

interface Paging {
  page?: number;
  limit?: number;
}

export interface TokensApi {
  list(query?: ApiTokensQuery): Promise<ApiResponse<ApiToken[]>>;
  get(contract: string, tokenId: string, opts?: { wait?: boolean }): Promise<ApiToken>;
  balance(contract: string, tokenId: string, owner: string): Promise<ApiTokenBalance>;
  ownedBy(address: string, opts?: Paging): Promise<ApiResponse<ApiToken[]>>;
  history(contract: string, tokenId: string, opts?: Paging): Promise<ApiResponse<ApiActivity[]>>;
  comments(contract: string, tokenId: string, opts?: Paging): Promise<ApiResponse<ApiComment[]>>;
  remixes(contract: string, tokenId: string, opts?: Paging): Promise<ApiResponse<ApiPublicRemix[]>>;
}

export function createTokensApi(t: Transport): TokensApi {
  return {
    list(query = {}) {
      return t.get("/v1/tokens", {
        page: query.page,
        limit: query.limit,
        sort: query.sort,
        ipType: query.ipType,
        derivatives: query.derivatives,
      });
    },
    async get(contract, tokenId, opts = {}) {
      const res = await t.get<ApiResponse<ApiToken>>(`/v1/tokens/${contract}/${tokenId}`, opts.wait ? { wait: "true" } : undefined);
      return res.data;
    },
    async balance(contract, tokenId, owner) {
      return (await t.get<ApiResponse<ApiTokenBalance>>(`/v1/tokens/${contract}/${tokenId}/balances/${t.addr(owner)}`)).data;
    },
    ownedBy(address, opts = {}) {
      return t.get(`/v1/tokens/owned/${t.addr(address)}`, { page: opts.page ?? 1, limit: opts.limit ?? 20 });
    },
    history(contract, tokenId, opts = {}) {
      return t.get(`/v1/tokens/${contract}/${tokenId}/history`, { page: opts.page ?? 1, limit: opts.limit ?? 20 });
    },
    comments(contract, tokenId, opts = {}) {
      return t.get(`/v1/tokens/${t.addr(contract)}/${tokenId}/comments`, { page: opts.page, limit: opts.limit });
    },
    remixes(contract, tokenId, opts = {}) {
      return t.get(`/v1/tokens/${t.addr(contract)}/${tokenId}/remixes`, { page: opts.page, limit: opts.limit });
    },
  };
}
