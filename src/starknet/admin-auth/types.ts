export const ADMIN_SCOPE = "admin-api";

export interface AdminGrant {
  wallet: string;
  chain: string;
  sessionPublicKey: string;
  sessionKeyHash: string;
  scope: string;
  issuedAt: number;
  expiresAt: number;
  walletSig: string[];
}

export interface AdminSession {
  grant: AdminGrant;
  sessionPrivateKey: string;
}

export interface AdminRequest {
  method: string;
  path: string;
  body: string;
  nonce: string;
  ts: number;
}

export type AdminRequestSig = string;
