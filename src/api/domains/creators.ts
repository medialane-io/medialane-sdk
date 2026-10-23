import type { Transport } from "../transport.js";
import type { ApiCreatorListResult, ApiCreatorProfile, ApiUsernameClaim } from "../../types/api.js";

export interface CreatorsApi {
  list(opts?: { search?: string; page?: number; limit?: number }): Promise<ApiCreatorListResult>;
  findProfile(walletAddress: string): Promise<ApiCreatorProfile | null>;
  findByUsername(username: string): Promise<ApiCreatorProfile | null>;
  updateProfile(
    walletAddress: string,
    data: Partial<Omit<ApiCreatorProfile, "walletAddress" | "chain" | "updatedAt">>,
  ): Promise<ApiCreatorProfile>;
  isHidden(wallet: string): Promise<boolean>;
  myUsernameClaim(): Promise<{ username: string | null; claim: ApiUsernameClaim | null }>;
  usernameAvailability(username: string): Promise<{ available: boolean; reason?: string }>;
  submitUsernameClaim(username: string, notifyEmail?: string): Promise<ApiUsernameClaim>;
}

export function createCreatorsApi(t: Transport): CreatorsApi {
  return {
    list(opts = {}) {
      return t.get("/v1/creators", { search: opts.search, page: opts.page || undefined, limit: opts.limit || undefined });
    },
    findProfile(walletAddress) {
      return t.find(`/v1/creators/${t.addr(walletAddress)}/profile`);
    },
    findByUsername(username) {
      return t.find(`/v1/creators/by-username/${encodeURIComponent(username.toLowerCase().trim())}`);
    },
    updateProfile(walletAddress, data) {
      return t.patch(`/v1/creators/${t.addr(walletAddress)}/profile`, data);
    },
    async isHidden(wallet) {
      return (await t.get<{ isHidden: boolean }>(`/v1/creators/${t.addr(wallet)}/hidden`)).isHidden;
    },
    myUsernameClaim() {
      return t.get("/v1/username-claims/me");
    },
    usernameAvailability(username) {
      return t.get(`/v1/username-claims/check/${encodeURIComponent(username)}`);
    },
    async submitUsernameClaim(username, notifyEmail) {
      const res = await t.post<{ claim: ApiUsernameClaim }>("/v1/username-claims", {
        username,
        ...(notifyEmail ? { notifyEmail } : {}),
      });
      return res.claim;
    },
  };
}
