import type { Transport } from "../transport.js";
import type { ApiAccount, ApiResponse } from "../../types/api.js";

export interface AccountsApi {
  list(opts?: { search?: string; page?: number; limit?: number }): Promise<ApiResponse<ApiAccount[]>>;
}

export function createAccountsApi(t: Transport): AccountsApi {
  return {
    list(opts = {}) {
      return t.get("/v1/accounts", { search: opts.search, page: opts.page, limit: opts.limit });
    },
  };
}
