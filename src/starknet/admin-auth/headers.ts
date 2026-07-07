import type { AdminGrant, AdminRequestSig, AdminSession } from "./types.js";
import { signAdminRequest } from "./request.js";

export const ADMIN_HEADERS = {
  grant: "x-ml-admin-grant",
  sig: "x-ml-admin-sig",
  nonce: "x-ml-admin-nonce",
  ts: "x-ml-admin-ts",
} as const;

function b64urlEncode(s: string): string {
  // browser + node/bun safe
  const bytes = new TextEncoder().encode(s);
  let bin = ""; for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlDecode(s: string): string {
  const pad = s.length % 4 ? "=".repeat(4 - (s.length % 4)) : "";
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function randomNonce(): string {
  const b = new Uint8Array(16); crypto.getRandomValues(b);
  let hex = ""; for (const x of b) hex += x.toString(16).padStart(2, "0");
  return "0x" + hex;
}

/** Build the four request headers from a session + (method, path, body). */
export function encodeAdminHeaders(
  session: AdminSession,
  reqInit: { method: string; path: string; body?: string; now?: () => number },
): Record<string, string> {
  const nonce = randomNonce();
  const ts = Math.floor((reqInit.now?.() ?? Date.now()) / 1000);
  const req = { method: reqInit.method, path: reqInit.path, body: reqInit.body ?? "", nonce, ts };
  const sig: AdminRequestSig = signAdminRequest(session.sessionPrivateKey, req);
  return {
    [ADMIN_HEADERS.grant]: b64urlEncode(JSON.stringify(session.grant)),
    [ADMIN_HEADERS.sig]: sig,
    [ADMIN_HEADERS.nonce]: nonce,
    [ADMIN_HEADERS.ts]: String(ts),
  };
}

export interface ParsedAdminHeaders {
  grant: AdminGrant;
  sig: string;
  nonce: string;
  ts: number;
}

/** Parse + shape-check the headers on the backend. Returns null if malformed. */
export function parseAdminHeaders(get: (name: string) => string | null | undefined): ParsedAdminHeaders | null {
  const rawGrant = get(ADMIN_HEADERS.grant);
  const sig = get(ADMIN_HEADERS.sig);
  const nonce = get(ADMIN_HEADERS.nonce);
  const tsRaw = get(ADMIN_HEADERS.ts);
  if (!rawGrant || !sig || !nonce || !tsRaw) return null;
  try {
    const grant = JSON.parse(b64urlDecode(rawGrant)) as AdminGrant;
    if (!grant.wallet || !grant.sessionPublicKey || !grant.sessionKeyHash ||
        !Array.isArray(grant.walletSig) || typeof grant.expiresAt !== "number") return null;
    const ts = Number(tsRaw);
    if (!Number.isFinite(ts)) return null;
    return { grant, sig, nonce, ts };
  } catch {
    return null;
  }
}
