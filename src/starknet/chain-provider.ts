import { RpcProvider } from "starknet";

export function createChainProvider(backendUrl: string, apiKey?: string): RpcProvider {
  return new RpcProvider({
    nodeUrl: `${backendUrl.replace(/\/$/, "")}/v1/rpc`,
    headers: apiKey ? { "x-api-key": apiKey } : {},
    blockIdentifier: "latest",
  });
}
