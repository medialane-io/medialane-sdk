import type { Call, TypedData } from "starknet";

export interface TypedDataSigner {
  address: string;
  signTypedData(typedData: TypedData): Promise<string[]>;
}

export interface SponsoredExecuteConfig {
  proxyUrl: string;
  fetchImpl?: typeof fetch;
}

export type SponsoredExecuteResult =
  | { status: "sponsored"; transactionHash: string }
  | { status: "unavailable"; reason: string };

export class SponsoredCallRejectedError extends Error {}

export type SponsorshipFailureCode =
  | "sponsor_unavailable"
  | "credits_exhausted"
  | "account_not_deployed"
  | "not_executable"
  | "invalid_request"
  | "not_eligible"
  | "not_authorized"
  | "rate_limited"
  | "may_have_broadcast";

const USER_MAY_PAY: ReadonlySet<string> = new Set(["sponsor_unavailable", "credits_exhausted"]);

export function userMayPayInstead(code: string | undefined, status: number, stage: "build" | "execute"): boolean {
  if (code) return USER_MAY_PAY.has(code);
  return stage === "build" ? status >= 500 : status === 503;
}

async function failureOf(res: Response, fallback: string): Promise<{ reason: string; code?: string }> {
  const body = (await res.json().catch(() => null)) as { error?: string; code?: string } | null;
  return { reason: body?.error || fallback, code: typeof body?.code === "string" ? body.code : undefined };
}

export async function executeSponsored(
  config: SponsoredExecuteConfig,
  signer: TypedDataSigner,
  calls: Call[],
): Promise<SponsoredExecuteResult> {
  const doFetch = config.fetchImpl ?? fetch;
  const base = config.proxyUrl.replace(/\/$/, "");
  const headers = { "Content-Type": "application/json" };

  const buildRes = await doFetch(`${base}/build`, {
    method: "POST",
    headers,
    body: JSON.stringify({ userAddress: signer.address, calls }),
  });
  if (!buildRes.ok) {
    const { reason, code } = await failureOf(buildRes, "We couldn't prepare this transaction.");
    if (userMayPayInstead(code, buildRes.status, "build")) return { status: "unavailable", reason };
    throw new SponsoredCallRejectedError(reason);
  }
  const { typedData } = (await buildRes.json()) as { typedData: TypedData };

  const signature = await signer.signTypedData(typedData);

  const executeRes = await doFetch(`${base}/execute`, {
    method: "POST",
    headers,
    body: JSON.stringify({ userAddress: signer.address, typedData, signature, calls }),
  });
  if (!executeRes.ok) {
    const { reason, code } = await failureOf(executeRes, "We couldn't submit this transaction.");
    if (userMayPayInstead(code, executeRes.status, "execute")) {
      return { status: "unavailable", reason };
    }
    throw new SponsoredCallRejectedError(reason);
  }
  const { transactionHash } = (await executeRes.json()) as { transactionHash: string };
  return { status: "sponsored", transactionHash };
}
