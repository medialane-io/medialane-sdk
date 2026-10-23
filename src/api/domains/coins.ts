import type { Transport } from "../transport.js";
import type {
  ApiCoin,
  ApiCoinClaimResult,
  ApiCoinPrices,
  ApiCoinsQuery,
  ApiCollectionClaim,
  ApiResponse,
} from "../../types/api.js";

export interface CoinsApi {
  list(opts?: ApiCoinsQuery): Promise<ApiResponse<ApiCoin[]>>;
  get(contract: string): Promise<ApiCoin>;
  prices(): Promise<ApiCoinPrices>;
  claim(coinAddress: string): Promise<ApiCoinClaimResult>;
  claims(status?: string): Promise<ApiResponse<ApiCollectionClaim[]>>;
  updateProfile(contract: string, data: { image?: string | null; description?: string | null }): Promise<ApiCoin>;
  sync(coinAddress: string, owner?: string): Promise<ApiCoin>;
}

export function createCoinsApi(t: Transport): CoinsApi {
  return {
    list(opts = {}) {
      return t.get("/v1/coins", {
        page: opts.page || undefined,
        limit: opts.limit || undefined,
        service: opts.service,
        sort: opts.sort,
        creator: opts.creator ? t.addr(opts.creator) : undefined,
        chain: opts.chain,
      });
    },
    async get(contract) {
      return (await t.get<{ data: ApiCoin }>(`/v1/coins/${t.addr(contract)}`)).data;
    },
    async prices() {
      return (await t.get<ApiResponse<ApiCoinPrices>>("/v1/coins/prices")).data;
    },
    claim(coinAddress) {
      return t.post("/v1/coins/claim", { coinAddress });
    },
    claims(status = "PENDING") {
      return t.get("/v1/coins/claims", { status });
    },
    async updateProfile(contract, data) {
      return (await t.patch<ApiResponse<ApiCoin>>(`/v1/coins/${t.addr(contract)}`, data)).data;
    },
    async sync(coinAddress, owner) {
      return (await t.post<{ data: ApiCoin }>("/v1/coins/sync", { coinAddress, ...(owner ? { owner } : {}) })).data;
    },
  };
}
