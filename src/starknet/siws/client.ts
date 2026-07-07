import type { TypedData } from "starknet";
import type { RequestSiwsTokenArgs } from "./types.js";

const STORAGE_PREFIX = "ml_siws_";

function decodeBase64url(str: string): string {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  return atob(base64 + padding);
}

function readTokenExpiry(token: string): number | null {
  try {
    if (!token.startsWith("siws_")) return null;
    const inner = token.slice(5);
    const dot = inner.lastIndexOf(".");
    if (dot === -1) return null;
    const data = JSON.parse(decodeBase64url(inner.slice(0, dot))) as { exp?: number };
    return typeof data.exp === "number" ? data.exp : null;
  } catch {
    return null;
  }
}

export function getSiwsStorageKey(address: string): string {
  return `${STORAGE_PREFIX}${address.toLowerCase()}`;
}

export function isSiwsTokenValid(token: string | null | undefined): token is string {
  if (!token?.startsWith("siws_")) return false;
  const expiry = readTokenExpiry(token);
  return Boolean(expiry && expiry > Math.floor(Date.now() / 1000));
}

/** Browser-only (returns null server-side, same as a cache miss). */
export function getStoredSiwsToken(address: string): string | null {
  if (typeof window === "undefined") return null;
  const key = getSiwsStorageKey(address);
  const token = localStorage.getItem(key);
  if (isSiwsTokenValid(token)) return token;
  localStorage.removeItem(key);
  return null;
}

/** Browser-only (no-op server-side). */
export function storeSiwsToken(address: string, token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(getSiwsStorageKey(address), token);
}

export function normalizeSiwsSignature(signature: unknown): string[] {
  if (Array.isArray(signature)) {
    return signature.map(String);
  }

  if (signature && typeof signature === "object") {
    const { r, s } = signature as { r?: unknown; s?: unknown };
    if (r !== undefined && s !== undefined) {
      return [String(r), String(s)];
    }
  }

  return [String(signature)];
}

/**
 * Request a nonce, sign it with `signer`, verify with the backend, and cache
 * the resulting token in localStorage (expiry-aware). Single source for the
 * SIWS client protocol — medialane-starknet and medialane-io both delegate
 * to this instead of keeping their own copies (see medialane-core/docs/specs/
 * 2026-06-30-remove-clerk-from-backend-design.md §IX).
 */
export async function requestSiwsToken({
  backendUrl,
  walletAddress,
  signer,
}: RequestSiwsTokenArgs): Promise<string> {
  const base = backendUrl.replace(/\/$/, "");

  const nonceRes = await fetch(`${base}/v1/auth/siws/nonce`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress }),
  });

  if (!nonceRes.ok) {
    throw new Error("Failed to prepare wallet sign-in");
  }

  const { nonce, typedData } = await nonceRes.json() as {
    nonce: string;
    typedData: TypedData;
  };

  const signature = normalizeSiwsSignature(await signer.signMessage(typedData));
  const verifyRes = await fetch(`${base}/v1/auth/siws/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress, nonce, signature }),
  });

  if (!verifyRes.ok) {
    // Backend distinguishes counterfactual-wallet errors with code
    // "account_not_deployed" + a user-facing `message` field so callers can
    // surface "Check if your wallet is deployed on Starknet." instead of the
    // generic "sign-in failed" toast.
    let backendMessage: string | undefined;
    try {
      const body = await verifyRes.json() as { error?: string; message?: string };
      if (body?.message) backendMessage = body.message;
    } catch {
      // body wasn't JSON — fall through to generic message
    }
    throw new Error(backendMessage ?? "Wallet sign-in failed");
  }

  const { token } = await verifyRes.json() as { token?: string };
  if (!isSiwsTokenValid(token)) {
    throw new Error("Wallet sign-in returned an invalid token");
  }

  storeSiwsToken(walletAddress, token);
  return token;
}
