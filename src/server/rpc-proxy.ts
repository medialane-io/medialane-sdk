import { isTransientRpcError } from "../utils/rpc.js";

export const DEFAULT_STARKNET_RPC_METHODS: readonly string[] = [
  "starknet_call",
  "starknet_addInvokeTransaction",
  "starknet_getTransactionReceipt",
  "starknet_getTransactionStatus",
  "starknet_getTransactionByHash",
  "starknet_getTransaction",
  "starknet_getBlockWithReceipts",
  "starknet_estimateFee",
  "starknet_getNonce",
  "starknet_simulateTransactions",
  "starknet_specVersion",
  "starknet_chainId",
  "starknet_blockNumber",
  "starknet_blockHashAndNumber",
  "starknet_getClassAt",
  "starknet_getClass",
  "starknet_getClassHashAt",
  "starknet_getStorageAt",
  "starknet_getBlockWithTxHashes",
  "starknet_getBlockWithTxs",
  "starknet_getEvents",
];

function isAllowedMethod(body: unknown, allowed: Set<string>): boolean {
  if (Array.isArray(body)) {
    return body.every((item) => isAllowedMethod(item, allowed));
  }
  if (body && typeof body === "object") {
    const method = (body as Record<string, unknown>).method;
    return typeof method === "string" && allowed.has(method);
  }
  return false;
}

function extractMethod(body: unknown): string {
  if (Array.isArray(body)) return "batch";
  if (body && typeof body === "object") {
    const method = (body as Record<string, unknown>).method;
    if (typeof method === "string") return method;
  }
  return "unknown";
}

function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  const host = req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function rpcError(code: number, message: string, status = 200, id: number | null = null): Response {
  return Response.json({ jsonrpc: "2.0", error: { code, message }, id }, { status });
}

export interface RpcProxyConfig {
  rpcUrls: string[];
  allowedMethods?: readonly string[];
  backendUrl: string;
  apiKey: string | undefined;
  checkRateLimit: (ip: string) => boolean;
}

async function billRpcCall(backendUrl: string, apiKey: string | undefined, method: string): Promise<boolean> {
  if (!apiKey) {
    console.error("[rpc-proxy] no API key configured — refusing to bill/forward");
    return false;
  }
  try {
    const res = await fetch(`${backendUrl.replace(/\/$/, "")}/v1/rpc/meter`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify({ method }),
    });
    return res.ok;
  } catch (err) {
    console.error("[rpc-proxy] billing call failed", { err: err instanceof Error ? err.message : String(err) });
    return false;
  }
}

export function createRpcProxyHandler(config: RpcProxyConfig): (req: Request) => Promise<Response> {
  const allowed = new Set(config.allowedMethods ?? DEFAULT_STARKNET_RPC_METHODS);

  return async function handleRpcProxy(req: Request): Promise<Response> {
    if (!isSameOrigin(req)) {
      return rpcError(-32600, "Cross-origin requests are not allowed", 403);
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
    if (!config.checkRateLimit(ip)) {
      return rpcError(-32005, "Too many requests", 429);
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return rpcError(-32700, "Parse error");
    }

    if (!isAllowedMethod(body, allowed)) {
      const method = !Array.isArray(body) && body && typeof body === "object"
        ? String((body as Record<string, unknown>).method ?? "<unknown>")
        : "<batch or invalid>";
      return rpcError(-32601, `Method not allowed: ${method}`);
    }

    const method = extractMethod(body);
    if (!(await billRpcCall(config.backendUrl, config.apiKey, method))) {
      return rpcError(-32003, "Insufficient credits or billing unavailable — RPC call not forwarded", 402);
    }

    let lastError = "No RPC upstream configured";

    for (const rpcUrl of config.rpcUrls) {
      try {
        const response = await fetch(rpcUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const text = await response.text();
        const upstream = rpcUrl.split("/")[2];
        if (!text) {
          lastError = `Upstream RPC returned empty body (HTTP ${response.status})`;
          console.warn("[rpc-proxy] upstream returned empty body", { status: response.status, upstream });
          continue;
        }

        try {
          const data = JSON.parse(text);

          if (isTransientRpcError({ status: response.status, body: data })) {
            const errObj = (data as { error?: { code?: unknown; message?: unknown } }).error;
            lastError = `Upstream RPC returned transient JSON-RPC error: ${String(errObj?.message ?? "(no message)")}`;
            console.warn("[rpc-proxy] upstream returned transient JSON-RPC error", {
              upstream, code: errObj?.code, message: errObj?.message,
            });
            continue;
          }

          return Response.json(data, { status: 200 });
        } catch {
          lastError = `Upstream RPC returned non-JSON (HTTP ${response.status})`;
          console.warn("[rpc-proxy] upstream returned non-JSON", {
            status: response.status, upstream, bodyPreview: text.slice(0, 200),
          });
          continue;
        }
      } catch (err) {
        lastError = `Upstream RPC unreachable: ${err instanceof Error ? err.message : "unknown error"}`;
        console.warn("[rpc-proxy] upstream fetch failed", {
          upstream: rpcUrl.split("/")[2],
          err: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return rpcError(-32603, lastError);
  };
}
