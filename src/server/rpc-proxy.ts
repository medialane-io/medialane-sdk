import { createBackendProxyHandler } from "./backend-proxy.js";

export interface RpcProxyConfig {
  backendUrl: string;
  apiKey: string | undefined;
  checkRateLimit: (ip: string) => boolean;
  fetchImpl?: typeof fetch;
}

export function createRpcProxyHandler(config: RpcProxyConfig): (req: Request) => Promise<Response> {
  return createBackendProxyHandler({ ...config, path: "/v1/rpc" });
}
