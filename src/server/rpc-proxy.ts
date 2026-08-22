import { requestIp } from "./rate-limit.js";
import { isSameOrigin } from "./origin.js";

function rpcError(code: number, message: string, status = 200, id: number | null = null): Response {
  return Response.json({ jsonrpc: "2.0", error: { code, message }, id }, { status });
}

export interface RpcProxyConfig {
  backendUrl: string;
  apiKey: string | undefined;
  checkRateLimit: (ip: string) => boolean;
  fetchImpl?: typeof fetch;
}

export function createRpcProxyHandler(config: RpcProxyConfig): (req: Request) => Promise<Response> {
  const doFetch = config.fetchImpl ?? fetch;
  const endpoint = `${config.backendUrl.replace(/\/$/, "")}/v1/rpc`;

  return async function handleRpcProxy(req: Request): Promise<Response> {
    if (!isSameOrigin(req)) {
      return rpcError(-32600, "Cross-origin requests are not allowed", 403);
    }

    if (!config.checkRateLimit(requestIp(req))) {
      return rpcError(-32005, "Too many requests", 429);
    }

    if (!config.apiKey) {
      return rpcError(-32003, "No API key configured — RPC call not forwarded", 402);
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return rpcError(-32700, "Parse error");
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
      return rpcError(-32603, "RPC backend unreachable");
    }
  };
}
