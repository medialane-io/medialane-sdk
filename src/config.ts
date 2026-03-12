import { z } from "zod";
import {
  SUPPORTED_NETWORKS,
  DEFAULT_RPC_URLS,
  MARKETPLACE_CONTRACT_MAINNET,
  COLLECTION_CONTRACT_MAINNET,
  MARKETPLACE_CONTRACT_SEPOLIA,
  COLLECTION_CONTRACT_SEPOLIA,
  type Network,
} from "./constants.js";
import type { RetryOptions } from "./utils/retry.js";
import { MedialaneError } from "./marketplace/orders.js";

export const MedialaneConfigSchema = z.object({
  network: z.enum(SUPPORTED_NETWORKS).default("mainnet"),
  rpcUrl: z.string().url().optional(),
  backendUrl: z.string().url().optional(),
  /** API key for authenticated /v1/* backend endpoints */
  apiKey: z.string().optional(),
  marketplaceContract: z.string().optional(),
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
  collectionContract: string;
  retryOptions?: RetryOptions;
}

export function resolveConfig(raw: MedialaneConfig): ResolvedConfig {
  const parsed = MedialaneConfigSchema.parse(raw);

  const isMainnet = parsed.network === "mainnet";
  const defaultMarketplace = isMainnet ? MARKETPLACE_CONTRACT_MAINNET : MARKETPLACE_CONTRACT_SEPOLIA;
  const defaultCollection = isMainnet ? COLLECTION_CONTRACT_MAINNET : COLLECTION_CONTRACT_SEPOLIA;

  const marketplaceContract = parsed.marketplaceContract ?? defaultMarketplace;
  const collectionContract = parsed.collectionContract ?? defaultCollection;

  if (!marketplaceContract || !collectionContract) {
    throw new MedialaneError(
      `Sepolia network is not yet supported: marketplace and collection contract addresses are not configured. ` +
      `Pass 'marketplaceContract' and 'collectionContract' explicitly in your MedialaneClient config.`,
      "NETWORK_NOT_SUPPORTED"
    );
  }

  return {
    network: parsed.network,
    rpcUrl: parsed.rpcUrl ?? DEFAULT_RPC_URLS[parsed.network],
    backendUrl: parsed.backendUrl,
    apiKey: parsed.apiKey,
    marketplaceContract,
    collectionContract,
    retryOptions: parsed.retryOptions,
  };
}
