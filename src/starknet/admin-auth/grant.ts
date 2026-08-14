import { ec, hash, num, encode } from "starknet";
import { ADMIN_SCOPE, type AdminGrant, type AdminSession } from "./types.js";

export interface AdminSessionTypedDataInput {
  sessionKeyHash: string;
  scope: string;
  issuedAt: number;
  expiresAt: number;
  chainId?: string;
}

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

export function sessionKeyHashOf(sessionPublicKey: string): string {
  return num.toHex(hash.starknetKeccak(sessionPublicKey));
}

export interface CreateGrantOpts {
  wallet: string;
  chain?: string;
  chainId?: string;
  ttlSeconds?: number;
  now?: () => number;
}

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
