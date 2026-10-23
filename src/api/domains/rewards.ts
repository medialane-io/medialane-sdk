import type { Transport } from "../transport.js";
import type {
  ApiPointEvent,
  ApiResponse,
  ApiRewardsBatchEntry,
  ApiRewardsConfig,
  ApiRewardsLeaderboardEntry,
  ApiUserRewards,
} from "../../types/api.js";

export interface RewardsApi {
  get(address: string): Promise<ApiUserRewards>;
  leaderboard(opts?: { page?: number; limit?: number }): Promise<ApiResponse<ApiRewardsLeaderboardEntry[]>>;
  events(address: string, opts?: { page?: number; limit?: number }): Promise<ApiResponse<ApiPointEvent[]>>;
  config(): Promise<ApiRewardsConfig>;
  batch(addresses: string[]): Promise<ApiRewardsBatchEntry[]>;
}

export function createRewardsApi(t: Transport): RewardsApi {
  return {
    async get(address) {
      return (await t.get<{ data: ApiUserRewards }>(`/v1/rewards/${t.addr(address)}`)).data;
    },
    leaderboard(opts = {}) {
      return t.get("/v1/rewards", { page: opts.page ?? 1, limit: opts.limit ?? 50 });
    },
    events(address, opts = {}) {
      return t.get(`/v1/rewards/${t.addr(address)}/events`, { page: opts.page ?? 1, limit: opts.limit ?? 20 });
    },
    async config() {
      return (await t.get<{ data: ApiRewardsConfig }>("/v1/rewards/config")).data;
    },
    async batch(addresses) {
      if (addresses.length === 0) return [];
      const res = await t.get<{ data: ApiRewardsBatchEntry[] }>("/v1/rewards/batch", {
        addresses: addresses.map((a) => t.addr(a)).join(","),
      });
      return res.data;
    },
  };
}
