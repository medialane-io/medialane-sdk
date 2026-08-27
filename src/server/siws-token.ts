import { hmac } from "@noble/hashes/hmac.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { base64urlnopad } from "@scure/base";
import type { Chain } from "../chains.js";

/**
 * Issues and verifies the two bearer tokens the platform signs with its own
 * secret: wallet identity tokens and account session tokens.
 *
 * This lives here because the verification had drifted into three independent
 * copies — the backend that issues them, and each app that checks them on its
 * own routes — all sharing one secret with no shared implementation. Changing
 * how the signature was computed in one place silently invalidated every token
 * for the others, which would have returned 401 on every SIWS-gated route in
 * both apps.
 *
 * Deliberately dependency-free: HMAC and base64url come from packages this SDK
 * already ships, so the module stays isomorphic and no consumer needs Node
 * builtins. Output is byte-identical to the previous `node:crypto` version.
 */

const IDENTITY_PREFIX = "siws_";
const ACCOUNT_SESSION_PREFIX = "account_session_";

/**
 * Domain tags bind a signature to the *kind* of token. Without one the
 * signature covers only the payload, so the two families are distinguishable
 * only by which fields each happens to carry — which stops being true the
 * moment either gains a field the other verifier reads, letting a short-lived
 * wallet token stand in for a long-lived account session.
 */
const IDENTITY_DOMAIN = "siws-identity-v1";
const ACCOUNT_SESSION_DOMAIN = "account-session-v1";

export const IDENTITY_TTL_SECONDS = 86_400;
export const ACCOUNT_SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;

/** Tolerance for a token minted by a host whose clock runs slightly ahead. */
const CLOCK_SKEW_SECONDS = 60;

export interface SiwsIdentity {
  address: string;
  chain: Chain;
}

interface IdentityPayload {
  sub?: string;
  chain?: Chain;
  iat?: number;
  exp?: number;
}

interface AccountSessionPayload {
  accountId?: string;
  iat?: number;
  exp?: number;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toHex(bytes: Uint8Array): string {
  let out = "";
  for (const b of bytes) out += b.toString(16).padStart(2, "0");
  return out;
}

function sign(secret: string, domain: string | null, payload: string): string {
  const message = domain === null ? payload : `${domain}.${payload}`;
  return toHex(hmac(sha256, encoder.encode(secret), encoder.encode(message)));
}

/** Compares in time independent of how many leading characters match. */
function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Accepts the domain-tagged signature and, during rollout, the untagged one
 * that predates it. Drop the untagged branch once the longest TTL above has
 * elapsed since every issuer and verifier was updated.
 */
function signatureMatches(secret: string, domain: string, payload: string, provided: string): boolean {
  return (
    constantTimeEquals(provided, sign(secret, domain, payload)) ||
    constantTimeEquals(provided, sign(secret, null, payload))
  );
}

function encodePayload(value: unknown): string {
  return base64urlnopad.encode(encoder.encode(JSON.stringify(value)));
}

function decodePayload<T>(payload: string): T | null {
  try {
    return JSON.parse(decoder.decode(base64urlnopad.decode(payload))) as T;
  } catch {
    return null;
  }
}

function splitToken(raw: string, prefix: string): { payload: string; signature: string } | null {
  if (!raw.startsWith(prefix)) return null;
  const inner = raw.slice(prefix.length);
  const dot = inner.lastIndexOf(".");
  if (dot === -1) return null;
  return { payload: inner.slice(0, dot), signature: inner.slice(dot + 1) };
}

function withinLifetime(iat: number | undefined, exp: number | undefined): boolean {
  if (!iat || !exp) return false;
  const now = Math.floor(Date.now() / 1000);
  return exp >= now && iat <= now + CLOCK_SKEW_SECONDS;
}

export function issueSiwsToken(
  secret: string,
  chain: Chain,
  wallet: string,
  ttlSeconds: number = IDENTITY_TTL_SECONDS,
): string {
  const iat = Math.floor(Date.now() / 1000);
  const payload = encodePayload({ sub: wallet, chain, iat, exp: iat + ttlSeconds });
  return `${IDENTITY_PREFIX}${payload}.${sign(secret, IDENTITY_DOMAIN, payload)}`;
}

export function verifySiwsToken(secret: string, raw: string): SiwsIdentity | null {
  const parts = splitToken(raw, IDENTITY_PREFIX);
  if (!parts) return null;
  if (!signatureMatches(secret, IDENTITY_DOMAIN, parts.payload, parts.signature)) return null;

  const data = decodePayload<IdentityPayload>(parts.payload);
  if (!data?.sub || !withinLifetime(data.iat, data.exp)) return null;

  return { address: data.sub, chain: data.chain ?? "STARKNET" };
}

export function issueAccountSessionToken(
  secret: string,
  accountId: string,
  ttlSeconds: number = ACCOUNT_SESSION_TTL_SECONDS,
): string {
  const iat = Math.floor(Date.now() / 1000);
  const payload = encodePayload({ accountId, iat, exp: iat + ttlSeconds });
  return `${ACCOUNT_SESSION_PREFIX}${payload}.${sign(secret, ACCOUNT_SESSION_DOMAIN, payload)}`;
}

export function verifyAccountSessionToken(secret: string, raw: string): string | null {
  const parts = splitToken(raw, ACCOUNT_SESSION_PREFIX);
  if (!parts) return null;
  if (!signatureMatches(secret, ACCOUNT_SESSION_DOMAIN, parts.payload, parts.signature)) return null;

  const data = decodePayload<AccountSessionPayload>(parts.payload);
  if (!data?.accountId || !withinLifetime(data.iat, data.exp)) return null;

  return data.accountId;
}
