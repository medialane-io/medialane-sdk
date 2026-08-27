

export const PUBLIC_RPC_FALLBACKS: readonly string[] = [
  "https://rpc.starknet.lava.build",
];

const TRANSIENT_BODY_RE =
  /"code"\s*:\s*-32001|"code"\s*:\s*-32603|unable to complete|rate.?limit|too many|throttl|exceed.*quota|temporarily unavailable|service unavailable|overload|gateway.*time|upstream.*time|backend.*error/i;

/**
 * Codes our own proxies emit to *refuse* a call on policy grounds: no API key,
 * insufficient credits, rate limited, wrong origin.
 *
 * These must never be treated as transient. They sit inside the JSON-RPC
 * reserved server-error range and carry messages like "Too many requests", so
 * every generic transient heuristic below would otherwise match them — and a
 * caller with a fallback list would quietly retry the same call against a
 * different upstream. That turns a refusal into a redirect: the harder the
 * meter says no, the faster traffic routes around it. A policy refusal is an
 * answer, not a failure; retrying it elsewhere is always wrong.
 */
export const POLICY_REFUSAL_CODES: readonly number[] = [-32003, -32005, -32600];

export function isPolicyRefusal(input: { body?: unknown }): boolean {
  let body = input.body;
  // Callers hand this an unparsed response body as often as a parsed one
  // (createFailoverFetch reads text before deciding whether to retry).
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return false;
    }
  }
  const err = (body as { error?: { code?: unknown } } | null | undefined)?.error;
  const code = err && typeof err === "object" ? (err as { code?: unknown }).code : undefined;
  return typeof code === "number" && POLICY_REFUSAL_CODES.includes(code);
}

export function isTransientRpcError(input: { status?: number; body?: unknown }): boolean {
  const { status, body } = input;

  if (isPolicyRefusal({ body })) return false;

  if (typeof status === "number" && (status === 429 || status >= 500)) return true;
  if (body == null) return false;

  if (typeof body === "object") {
    const err = (body as { error?: { code?: unknown; message?: unknown } }).error;
    if (!err || typeof err !== "object") return false;
    const code = (err as { code?: unknown }).code;
    if (typeof code === "number") {
      if (code === 429) return true;
      if (code >= -32099 && code <= -32000) return true;
      if (code === -32603) return true;
    }
    const message = (err as { message?: unknown }).message;
    return typeof message === "string" ? TRANSIENT_BODY_RE.test(message) : false;
  }

  return TRANSIENT_BODY_RE.test(String(body));
}

export interface FailoverFetchOptions {

  baseFetch?: typeof fetch;

  onFailover?: (info: { url: string; status?: number; error?: unknown }) => void;
}

export function createFailoverFetch(
  urls: string[],
  options: FailoverFetchOptions = {},
): typeof fetch {
  const endpoints = urls.filter((u): u is string => Boolean(u));
  if (endpoints.length === 0) {
    throw new Error("createFailoverFetch: at least one RPC URL is required");
  }
  const doFetch = options.baseFetch ?? fetch;

  const failover = async (_input: unknown, init?: RequestInit): Promise<Response> => {
    let lastError: unknown;

    for (let i = 0; i < endpoints.length; i++) {
      const url = endpoints[i];
      const isLast = i === endpoints.length - 1;
      try {
        const res = await doFetch(url, init);
        const text = await res.text();
        const rebuilt = () =>
          new Response(text, { status: res.status, statusText: res.statusText, headers: res.headers });

        if (isLast || !isTransientRpcError({ status: res.status, body: text })) {
          return rebuilt();
        }
        options.onFailover?.({ url, status: res.status });
      } catch (err) {
        lastError = err;
        if (isLast) throw err;
        options.onFailover?.({ url, error: err });
      }
    }

    throw lastError ?? new Error("createFailoverFetch: all endpoints failed");
  };

  return failover as unknown as typeof fetch;
}

/**
 * Hostnames and env-var names that reach a paid upstream directly.
 *
 * An app must never name one of these. Everything paid goes through the
 * backend, the only place a call can be authenticated, scoped, rate limited
 * and billed. An app that knows a node's address has a route around all four —
 * and since the address ships in the client bundle, so does every visitor.
 *
 * The list lives here, not in each app, because it is the part that drifts:
 * adding an upstream must protect every consumer at once. Each app keeps its
 * own small test that scans its source for these with its own file APIs.
 */
export const PAID_UPSTREAM_MARKERS: readonly string[] = [
  "rpc.starknet.lava.build",
  "g.alchemy.com",
  "ALCHEMY_RPC_URL",
  "STARKNET_RPC_URL",
  "AVNU_PAYMASTER_API_KEY",
  "@avnu/avnu-sdk",
  "api.pinata.cloud",
  "PINATA_JWT",
];
