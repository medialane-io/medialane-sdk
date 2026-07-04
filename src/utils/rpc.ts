/**
 * Resilient Starknet RPC helpers — the single source of truth for "what counts
 * as a transient RPC failure" and the public fallback endpoint list, shared by
 * every Medialane app:
 *   - dapp / io `starknetProvider` singletons (RpcProvider.baseFetch)
 *   - io `/api/rpc` server-side proxy (upstream rotation)
 *   - backend circuit breaker + receipt-rotation paths
 *
 * Motivation (2026-06-03): Alchemy's Starknet mainnet endpoint intermittently
 * returns HTTP 503 with the JSON-RPC envelope `-32001 "Unable to complete
 * request at this time."` (~1 in 6 calls, while its status page reads green).
 * A single blip inside a `waitForTransaction` poll loop stalls mints/listings.
 * Failing over to a public endpoint recovers silently.
 */

/**
 * Ordered public Starknet **mainnet** RPC endpoints (no API key required),
 * used as fallback after an app's configured primary (e.g. Alchemy) returns a
 * transient error. lava.build — RPC spec 0.8.1, permissive CORS — so it is
 * safe for browser `baseFetch` use as well as server-side rotation.
 *
 * blastapi.io and free-rpc.nethermind.io were removed (2026-07-04) — long
 * confirmed dead/unreliable in production; do not re-add them.
 */
export const PUBLIC_RPC_FALLBACKS: readonly string[] = [
  "https://rpc.starknet.lava.build",
];

/**
 * Matches transient failure signals in a raw response body or JSON-RPC error
 * message. Deterministic Starknet contract errors (revert / invalid params —
 * small positive JSON-RPC codes) MUST NOT match: they propagate verbatim so
 * callers see the real failure. Note `-32000` is intentionally absent — the io
 * `/api/rpc` proxy uses it for "Unauthorized", which must not trigger failover.
 */
const TRANSIENT_BODY_RE =
  /"code"\s*:\s*-32001|"code"\s*:\s*-32603|unable to complete|rate.?limit|too many|throttl|exceed.*quota|temporarily unavailable|service unavailable|overload|gateway.*time|upstream.*time|backend.*error/i;

/**
 * Is this RPC response worth retrying against another endpoint?
 *
 * Accepts either an HTTP status + raw text body (client `baseFetch` path) or a
 * parsed JSON-RPC envelope (server proxy path). For parsed envelopes the
 * server-defined error-code range (`-32099..-32000`) is treated as transient;
 * for raw text only the explicit `-32001`/`-32603` codes + message hints match,
 * so a `-32000` "Unauthorized" text body is never mistaken for transient.
 */
export function isTransientRpcError(input: { status?: number; body?: unknown }): boolean {
  const { status, body } = input;
  if (typeof status === "number" && (status === 429 || status >= 500)) return true;
  if (body == null) return false;

  // Parsed JSON-RPC envelope: inspect error.code numerically.
  if (typeof body === "object") {
    const err = (body as { error?: { code?: unknown; message?: unknown } }).error;
    if (!err || typeof err !== "object") return false;
    const code = (err as { code?: unknown }).code;
    if (typeof code === "number") {
      if (code === 429) return true;
      if (code >= -32099 && code <= -32000) return true; // server-defined range (incl. -32001)
      if (code === -32603) return true; // generic internal error
    }
    const message = (err as { message?: unknown }).message;
    return typeof message === "string" ? TRANSIENT_BODY_RE.test(message) : false;
  }

  // Raw text body (client baseFetch path).
  return TRANSIENT_BODY_RE.test(String(body));
}

export interface FailoverFetchOptions {
  /** Underlying fetch to wrap (e.g. one that adds a timeout). Defaults to the global `fetch`. */
  baseFetch?: typeof fetch;
  /** Invoked each time an endpoint is abandoned for the next one. */
  onFailover?: (info: { url: string; status?: number; error?: unknown }) => void;
}

/**
 * Build a `fetch` suitable for `RpcProvider.baseFetch` that tries each URL in
 * `urls` in order, advancing to the next only on a transient failure (network
 * error, 5xx/429, or a transient JSON-RPC envelope). The provider's own
 * `nodeUrl` argument is ignored — routing is controlled entirely by `urls` —
 * so callers should set `nodeUrl: urls[0]` (used only for spec negotiation).
 *
 * @example
 *   const urls = [primaryAlchemyUrl, ...PUBLIC_RPC_FALLBACKS];
 *   new RpcProvider({ nodeUrl: urls[0], baseFetch: createFailoverFetch(urls) });
 */
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

    // Loop always returns/throws on the last endpoint; this satisfies the type checker.
    throw lastError ?? new Error("createFailoverFetch: all endpoints failed");
  };

  return failover as unknown as typeof fetch;
}
