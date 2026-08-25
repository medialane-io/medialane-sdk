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

// AVNU processed the request and rejected it (422 — simulation failure,
// account not deployed) or the failure is otherwise genuinely ambiguous
// about broadcast state (502). Neither is safe to silently retry
// self-funded: a 422 will fail identically regardless of payer, and a 502
// might already have broadcast — thrown so the caller treats it as a hard
// error, not an "ask the user to self-fund" moment.
export class SponsoredCallRejectedError extends Error {}

const PRE_BROADCAST_EXECUTE_STATUSES = new Set([400, 429, 503]);

async function errorReason(res: Response, fallback: string): Promise<string> {
  const body = (await res.json().catch(() => null)) as { error?: string } | null;
  return body?.error || fallback;
}

export async function executeSponsored(
  config: SponsoredExecuteConfig,
  signer: TypedDataSigner,
  calls: Call[],
): Promise<SponsoredExecuteResult> {
  const doFetch = config.fetchImpl ?? fetch;
  const base = config.proxyUrl.replace(/\/$/, "");

  const buildRes = await doFetch(`${base}/build`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userAddress: signer.address, calls }),
  });
  if (!buildRes.ok) {
    return { status: "unavailable", reason: await errorReason(buildRes, "We couldn't prepare this transaction.") };
  }
  const { typedData } = (await buildRes.json()) as { typedData: TypedData };

  const signature = await signer.signTypedData(typedData);

  const executeRes = await doFetch(`${base}/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userAddress: signer.address, typedData, signature, calls }),
  });
  if (!executeRes.ok) {
    const reason = await errorReason(executeRes, "We couldn't submit this transaction.");
    if (PRE_BROADCAST_EXECUTE_STATUSES.has(executeRes.status)) {
      return { status: "unavailable", reason };
    }
    throw new SponsoredCallRejectedError(reason);
  }
  const { transactionHash } = (await executeRes.json()) as { transactionHash: string };
  return { status: "sponsored", transactionHash };
}
