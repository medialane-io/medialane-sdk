import { ec, hash, num, encode } from "starknet";
import { ADMIN_SCOPE, type AdminGrant, type AdminSession } from "./types.js";

export interface AdminSessionTypedDataInput {
  sessionKeyHash: string;
  scope: string;
  issuedAt: number;
  expiresAt: number;
  chainId?: string;
}

/** The SNIP-12 typed data the wallet signs — rebuilt identically on the backend. */
export function buildAdminSessionTypedData(p: AdminSessionTypedDataInput) {
  return {
    types: {
      StarknetDomain: [
        { name: "name", type: "shortstring" },
        { name: "version", type: "shortstring" },
        { name: "chainId", type: "shortstring" },
        { name: "revision", type: "shortstring" },
      ],
      AdminSession: [
        { name: "sessionKeyHash", type: "felt" },
        { name: "scope", type: "shortstring" },
        { name: "issuedAt", type: "felt" },
        { name: "expiresAt", type: "felt" },
      ],
    },
    primaryType: "AdminSession",
    domain: { name: "Medialane Admin", version: "1", chainId: p.chainId ?? "SN_MAIN", revision: "1" },
    message: {
      sessionKeyHash: p.sessionKeyHash,
      scope: p.scope,
      issuedAt: String(p.issuedAt),
      expiresAt: String(p.expiresAt),
    },
  } as const;
}

/** felt commitment to a full session public key (fits in the signed message). */
export function sessionKeyHashOf(sessionPublicKey: string): string {
  return num.toHex(hash.starknetKeccak(sessionPublicKey));
}

export interface CreateGrantOpts {
  wallet: string;
  chain?: string;       // default "STARKNET"
  chainId?: string;     // default "SN_MAIN"
  ttlSeconds?: number;  // default 7200 (2h)
  now?: () => number;   // injectable for tests
}

/**
 * Generate an ephemeral session keypair and have `signTypedData` (the connected
 * wallet's signMessage) sign the grant. The private key never leaves the caller.
 */
export async function createAdminSessionGrant(
  signTypedData: (data: ReturnType<typeof buildAdminSessionTypedData>) => Promise<string[]>,
  opts: CreateGrantOpts,
): Promise<AdminSession> {
  const priv = ec.starkCurve.utils.randomPrivateKey();
  const sessionPrivateKey = "0x" + encode.buf2hex(priv);
  const sessionPublicKey = "0x" + encode.buf2hex(ec.starkCurve.getPublicKey(sessionPrivateKey, false));
  const sessionKeyHash = sessionKeyHashOf(sessionPublicKey);

  const nowSec = Math.floor((opts.now?.() ?? Date.now()) / 1000);
  const issuedAt = nowSec;
  const expiresAt = nowSec + (opts.ttlSeconds ?? 7200);

  const data = buildAdminSessionTypedData({ sessionKeyHash, scope: ADMIN_SCOPE, issuedAt, expiresAt, chainId: opts.chainId });
  const walletSig = await signTypedData(data);

  const grant: AdminGrant = {
    wallet: opts.wallet,
    chain: opts.chain ?? "STARKNET",
    sessionPublicKey,
    sessionKeyHash,
    scope: ADMIN_SCOPE,
    issuedAt,
    expiresAt,
    walletSig,
  };
  return { grant, sessionPrivateKey };
}
