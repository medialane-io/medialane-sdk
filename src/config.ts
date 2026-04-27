import { z } from "zod";
import {
  SUPPORTED_NETWORKS,
  DEFAULT_RPC_URL,
  MARKETPLACE_721_CONTRACT_MAINNET,
  COLLECTION_721_CONTRACT_MAINNET,
  COLLECTION_1155_CONTRACT_MAINNET,
  MARKETPLACE_1155_CONTRACT_MAINNET,
  type Network,
} from "./constants.js";
import type { RetryOptions } from "./utils/retry.js";

export const MedialaneConfigSchema = z.object({
  network: z.enum(SUPPORTED_NETWORKS).default("mainnet"),
  rpcUrl: z.string().url().optional(),
  backendUrl: z.string().url().optional(),
  apiKey: z.string().optional(),
  marketplace721Contract: z.string().optional(),
  marketplaceContract: z.string().optional(),
  marketplace1155Contract: z.string().optional(),
  collection721Contract: z.string().optional(),
  collectionContract: z.string().optional(),
  collection1155Contract: z.string().optional(),
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
  marketplace721Contract: string;
  marketplaceContract: string;
  marketplace1155Contract: string;
  collection721Contract: string;
  collectionContract: string;
  collection1155Contract: string;
  retryOptions?: RetryOptions;
}

export function resolveConfig(raw: MedialaneConfig): ResolvedConfig {
  const parsed = MedialaneConfigSchema.parse(raw);

  const marketplace721Contract =
    parsed.marketplace721Contract ?? parsed.marketplaceContract ?? MARKETPLACE_721_CONTRACT_MAINNET;
  const collection721Contract =
    parsed.collection721Contract ?? parsed.collectionContract ?? COLLECTION_721_CONTRACT_MAINNET;

  return {
    network: parsed.network,
    rpcUrl: parsed.rpcUrl ?? DEFAULT_RPC_URL,
    backendUrl: parsed.backendUrl,
    apiKey: parsed.apiKey,
    marketplace721Contract,
    marketplaceContract: marketplace721Contract,
    marketplace1155Contract: parsed.marketplace1155Contract ?? MARKETPLACE_1155_CONTRACT_MAINNET,
    collection721Contract,
    collectionContract: collection721Contract,
    collection1155Contract: parsed.collection1155Contract ?? COLLECTION_1155_CONTRACT_MAINNET,
    retryOptions: parsed.retryOptions,
  };
}
