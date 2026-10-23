import type { Transport } from "../transport.js";
import type { ApiDrop, ApiDropFee, ApiDropListStatus, ApiDropMint, ApiResponse } from "../../types/api.js";

export interface DropsApi {
  fee(): Promise<ApiDropFee>;
  list(query?: { status?: ApiDropListStatus; organizer?: string; page?: number; limit?: number }): Promise<ApiResponse<ApiDrop[]>>;
  find(contract: string): Promise<ApiDrop | null>;
  mints(contract: string, opts?: { page?: number; limit?: number }): Promise<ApiResponse<ApiDropMint[]>>;
}

export function createDropsApi(t: Transport): DropsApi {
  return {
    async fee() {
      return (await t.get<{ data: ApiDropFee }>("/v1/drops/fee")).data;
    },
    list(query = {}) {
      return t.get("/v1/drops", {
        status: query.status,
        organizer: query.organizer ? t.addr(query.organizer) : undefined,
        page: query.page,
        limit: query.limit,
      });
    },
    async find(contract) {
      const res = await t.find<{ data: ApiDrop }>(`/v1/drops/${t.addr(contract)}`);
      return res?.data ?? null;
    },
    mints(contract, opts = {}) {
      return t.get(`/v1/drops/${t.addr(contract)}/mints`, { page: opts.page, limit: opts.limit });
    },
  };
}
