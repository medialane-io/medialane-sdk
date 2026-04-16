import { z } from "zod";
import {
  SUPPORTED_NETWORKS,
  DEFAULT_RPC_URL,
  MARKETPLACE_CONTRACT_MAINNET,
  COLLECTION_CONTRACT_MAINNET,
  MARKETPLACE_1155_CONTRACT_MAINNET,
  type Network,
} from "./constants.js";
import type { RetryOptions } from "./utils/retry.js";

export const MedialaneConfigSchema = z.object({
  network: z.enum(SUPPORTED_NETWORKS).default("mainnet"),
  rpcUrl: z.string().url().optional(),
  backendUrl: z.string().url().optional(),
  apiKey: z.string().optional(),
  marketplaceContract: z.string().optional(),
  marketplace1155Contract: z.string().optional(),
  collectionContract: z.string().optional(),
  retryOptions: z.object({
    maxAttempts: z.number().int().min(1).max(10).optional(),
    baseDelayMs: z.number().int().min(0).optional(),
    maxDelayMs: z.number().int().min(0).optional(),
  }).optional(),
});

export type MedialaneConfig = z.input<typeof MedialaneConfigSchema>;

export interface ResolvedConfig {
  network: Network;
  rpcUrl: string;
  backendUrl: string | undefined;
  apiKey: string | undefined;
  marketplaceContract: string;
  marketplace1155Contract: string;
  collectionContract: string;
  retryOptions?: RetryOptions;
}

export function resolveConfig(raw: MedialaneConfig): ResolvedConfig {
  const parsed = MedialaneConfigSchema.parse(raw);

  return {
    network: parsed.network,
    rpcUrl: parsed.rpcUrl ?? DEFAULT_RPC_URL,
    backendUrl: parsed.backendUrl,
    apiKey: parsed.apiKey,
    marketplaceContract: parsed.marketplaceContract ?? MARKETPLACE_CONTRACT_MAINNET,
    marketplace1155Contract: parsed.marketplace1155Contract ?? MARKETPLACE_1155_CONTRACT_MAINNET,
    collectionContract: parsed.collectionContract ?? COLLECTION_CONTRACT_MAINNET,
    retryOptions: parsed.retryOptions,
  };
}
