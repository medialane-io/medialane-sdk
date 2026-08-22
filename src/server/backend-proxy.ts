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

    try {
      const upstream = await doFetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": config.apiKey },
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
