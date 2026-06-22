export const ADMIN_SCOPE = "admin-api";

/** The wallet-signed authorization for a session key. */
export interface AdminGrant {
  wallet: string;            // signer wallet address (the admin)
  chain: string;             // "STARKNET"
  sessionPublicKey: string;  // full uncompressed session pubkey hex (0x04…)
  sessionKeyHash: string;    // felt: starknetKeccak(sessionPublicKey) — what the wallet signed
  scope: string;             // ADMIN_SCOPE
  issuedAt: number;          // unix seconds
  expiresAt: number;         // unix seconds
  walletSig: string[];       // wallet's SNIP-12 signature over the grant
}

export interface AdminSession {
  grant: AdminGrant;
  sessionPrivateKey: string; // stays client-side; never sent
}

export interface AdminRequest {
  method: string;            // upper-cased
  path: string;              // backend path incl. query, e.g. "/admin/tenants?x=1"
  body: string;              // raw request body or ""
  nonce: string;             // "0x"-prefixed 128-bit hex, unique per request
  ts: number;                // unix seconds
}

/** Compact session-key signature over adminRequestDigest. */
export type AdminRequestSig = string; // compact hex (r||s)
