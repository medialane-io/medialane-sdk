import { requestIp } from "./rate-limit.js";
import { isSameOrigin } from "./origin.js";

function proxyError(code: number, message: string, status: number): Response {
  return Response.json({ jsonrpc: "2.0", error: { code, message }, id: null }, { status });
}

export interface BackendProxyConfig {
  path: string;
  backendUrl: string;
  apiKey: string | undefined;
  checkRateLimit: (ip: string) => boolean;
  fetchImpl?: typeof fetch;
  /**
   * Forwards a cookie the app already sets (e.g. its own account-session
   * cookie) as a header, so the backend can attribute cost to the calling
   * end-user instead of only the app's shared API key. Purely additive —
   * omitted when the cookie isn't present, never blocks the request.
   */
  forwardCookie?: { name: string; header: string };
}

function readCookie(req: Request, name: string): string | null {
  const raw = req.headers.get("cookie");
  if (!raw) return null;
  for (const part of raw.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim();
  }
  return null;
}

export function createBackendProxyHandler(
  config: BackendProxyConfig,
): (req: Request) => Promise<Response> {
  const doFetch = config.fetchImpl ?? fetch;
  const endpoint = `${config.backendUrl.replace(/\/$/, "")}/${config.path.replace(/^\//, "")}`;

  return async function handleBackendProxy(req: Request): Promise<Response> {
    if (!isSameOrigin(req)) {
      return proxyError(-32600, "Cross-origin requests are not allowed", 403);
    }

    if (!config.checkRateLimit(requestIp(req))) {
      return proxyError(-32005, "Too many requests", 429);
    }

    if (!config.apiKey) {
      return proxyError(-32003, "No API key configured — request not forwarded", 402);
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return proxyError(-32700, "Parse error", 400);
    }

    const headers: Record<string, string> = { "Content-Type": "application/json", "x-api-key": config.apiKey };
    if (config.forwardCookie) {
      const value = readCookie(req, config.forwardCookie.name);
      if (value) headers[config.forwardCookie.header] = value;
    }

    try {
      const upstream = await doFetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      const text = await upstream.text();
      return new Response(text, {
        status: upstream.status,
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      return proxyError(-32603, "Backend unreachable", 502);
    }
  };
}
