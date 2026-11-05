import type { FetchLike } from "../../utils/fetch.js";
import type { Call, TypedData } from "starknet";
import { UserFacingError } from "../../errors.js";
import { typedDataMatchesCalls } from "../sponsored-checks.js";

export interface TypedDataSigner {
  address: string;
  signTypedData(typedData: TypedData): Promise<string[]>;
}

export interface SponsoredExecuteConfig {
  proxyUrl: string;
  fetchImpl?: FetchLike;
  headers?: Record<string, string>;
}

export type SponsoredRequest = { intentIds: string[]; calls: readonly Call[] } | { userAddress: string };

export type SponsoredExecuteResult =
  | { status: "sponsored"; transactionHash: string }
  | { status: "unavailable"; reason: string };

export interface SponsoredRejection {
  code?: string;
  detail?: string;
  status?: number;
  stage?: "build" | "execute";
  requestId?: string;
}

export class SponsoredCallRejectedError extends UserFacingError {
  readonly code?: string;
  readonly detail?: string;
  readonly status?: number;
  readonly stage?: "build" | "execute";
  readonly requestId?: string;

  constructor(message: string, info: SponsoredRejection = {}) {
    super(message, { retryable: false });
    this.code = info.code;
    this.detail = info.detail;
    this.status = info.status;
    this.stage = info.stage;
    this.requestId = info.requestId;
  }
}

export type SponsorshipFailureCode =
  | "sponsor_unavailable"
  | "credits_exhausted"
  | "account_not_deployed"
  | "not_executable"
  | "invalid_request"
  | "not_authorized"
  | "rate_limited"
  | "may_have_broadcast"
  | "calls_mismatch";

const FALLBACK_FUNDING_FAILURES: ReadonlySet<string> = new Set(["sponsor_unavailable", "credits_exhausted"]);

export function allowsFallbackFunding(code: string | undefined, status: number, stage: "build" | "execute"): boolean {
  if (code) return FALLBACK_FUNDING_FAILURES.has(code);
  return stage === "build" ? status >= 500 : status === 503;
}

async function failureOf(res: Response, fallback: string): Promise<{ reason: string; code?: string; detail?: string; requestId?: string }> {
  const body = (await res.json().catch(() => null)) as { error?: string; code?: string; detail?: string } | null;
  return {
    reason: body?.error || fallback,
    code: typeof body?.code === "string" ? body.code : undefined,
    detail: typeof body?.detail === "string" ? body.detail : undefined,
    requestId: res.headers.get("x-request-id") ?? undefined,
  };
}

export async function executeSponsored(
  config: SponsoredExecuteConfig,
  signer: TypedDataSigner,
  request: SponsoredRequest,
): Promise<SponsoredExecuteResult> {
  const doFetch = config.fetchImpl ?? fetch;
  const base = config.proxyUrl.replace(/\/$/, "");
  const headers = { "Content-Type": "application/json", ...config.headers };
  const target = "intentIds" in request ? { intentIds: request.intentIds } : { userAddress: request.userAddress };

  const buildRes = await doFetch(`${base}/build`, {
    method: "POST",
    headers,
    body: JSON.stringify(target),
  });
  if (!buildRes.ok) {
    const { reason, code, detail, requestId } = await failureOf(buildRes, "We couldn't prepare this transaction.");
    if (allowsFallbackFunding(code, buildRes.status, "build")) return { status: "unavailable", reason };
    throw new SponsoredCallRejectedError(reason, { code, detail, status: buildRes.status, stage: "build", requestId });
  }
  const { typedData } = (await buildRes.json()) as { typedData: TypedData };
  if ("intentIds" in request && !typedDataMatchesCalls(typedData, request.calls)) {
    throw new SponsoredCallRejectedError("This action couldn't be prepared. Please try again.", { code: "calls_mismatch", stage: "build" });
  }

  const signature = await signer.signTypedData(typedData);

  const executeRes = await doFetch(`${base}/execute`, {
    method: "POST",
    headers,
    body: JSON.stringify({ ...target, typedData, signature }),
  });
  if (!executeRes.ok) {
    const { reason, code, detail, requestId } = await failureOf(executeRes, "We couldn't submit this transaction.");
    if (allowsFallbackFunding(code, executeRes.status, "execute")) {
      return { status: "unavailable", reason };
    }
    throw new SponsoredCallRejectedError(reason, { code, detail, status: executeRes.status, stage: "execute", requestId });
  }
  const { transactionHash } = (await executeRes.json()) as { transactionHash: string };
  return { status: "sponsored", transactionHash };
}
