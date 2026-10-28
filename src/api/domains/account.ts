import type { Transport } from "../transport.js";
import type { ApiChain, ApiUserWallet } from "../../types/api.js";

export interface RegisteredUser {
  accountId: string;
  publicId: string;
  walletAddress: string;
  chain: string;
  provider: string;
  createdAt: string;
}

export interface WalletRecovery {
  enabled: boolean;
  state: "none" | "waiting" | "ready";
  readyAt: number | null;
  newOwnerGuid: string | null;
  guardianPubkey: string | null;
}

export interface AccountApi {
  registerUser(params: { walletAddress: string; walletType?: string; chain?: ApiChain }): Promise<RegisteredUser>;
  upsertMyWallet(options?: { walletType?: string; chain?: ApiChain; email?: string }): Promise<ApiUserWallet>;
  findMyWallet(): Promise<ApiUserWallet | null>;
  changeMyEmail(email: string): Promise<{ email: string }>;
  sessionWallet(): Promise<{ walletAddress: string; needsKeySetup: boolean } | null>;
  setupWalletKey(params: { newOwnerPubkey: string }): Promise<{ walletAddress: string; removeOwnerGuid: string | null }>;
  generateWallet(newWalletSiwsToken: string): Promise<{ walletAddress: string }>;
  walletRecovery(): Promise<WalletRecovery>;
  startWalletRecovery(params: { newOwnerPubkey: string }): Promise<WalletRecovery>;
  completeWalletRecovery(params: { newOwnerPubkey: string }): Promise<WalletRecovery>;
  emailExists(email: string): Promise<boolean>;
  requestEmailCode(email: string): Promise<void>;
  registerEmailAccount(email: string): Promise<void>;
  verifyEmailCode(email: string, code: string): Promise<void>;
  confirmEmail(token: string): Promise<{ email: string }>;
}

export function createAccountApi(t: Transport): AccountApi {
  return {
    registerUser(params) {
      return t.post("/v1/users/register", params);
    },
    upsertMyWallet(options = {}) {
      const body: Record<string, string> = { walletType: options.walletType ?? "UNKNOWN" };
      if (options.chain) body.chain = options.chain;
      if (options.email) body.email = options.email;
      return t.post("/v1/users/me", body);
    },
    findMyWallet() {
      return t.find("/v1/users/me");
    },
    changeMyEmail(email) {
      return t.post("/v1/users/me/email", { email });
    },
    async sessionWallet() {
      const body = await t.post<{ walletAddress?: string | null; needsKeySetup?: boolean }>("/v1/users/me/wallet", {});
      return body.walletAddress ? { walletAddress: body.walletAddress, needsKeySetup: body.needsKeySetup === true } : null;
    },
    setupWalletKey(params) {
      return t.post("/v1/users/me/wallet/key", params);
    },
    generateWallet(newWalletSiwsToken) {
      return t.post("/v1/users/me/generate-wallet", { newWalletSiwsToken });
    },
    walletRecovery() {
      return t.get("/v1/users/me/wallet/recovery");
    },
    startWalletRecovery(params) {
      return t.post("/v1/users/me/wallet/recovery", params);
    },
    completeWalletRecovery(params) {
      return t.post("/v1/users/me/wallet/recovery/complete", params);
    },
    async emailExists(email) {
      return (await t.get<{ exists: boolean }>("/v1/auth/email/exists", { email })).exists;
    },
    async requestEmailCode(email) {
      await t.post("/v1/auth/email/request-code", { email });
    },
    async registerEmailAccount(email) {
      await t.post("/v1/auth/email/register-account", { email });
    },
    async verifyEmailCode(email, code) {
      await t.post("/v1/auth/email/verify-code", { email, code });
    },
    async confirmEmail(token) {
      const body = await t.post<{ ok: boolean; email: string }>("/v1/auth/email/confirm", { token });
      return { email: body.email };
    },
  };
}
