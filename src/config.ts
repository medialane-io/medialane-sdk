import { z } from "zod";
import { CHAINS, getCoordinates, DEFAULT_CHAIN, type Chain } from "./chains.js";
import type { RetryOptions } from "./utils/retry.js";
import { FeeConfigSchema, resolveFeeConfig, type ResolvedFeeConfig } from "./fee/index.js";

export const MedialaneConfigSchema = z.object({
  // Chain-scoped client (spec 2026-06-13 Decision B): one client per chain,
  // coordinates resolved from the registry. Replaces the removed `network` axis.
  chain: z.enum(CHAINS).default(DEFAULT_CHAIN),
  rpcUrl: z.string().url().optional(),
  backendUrl: z.string().url().optional(),
  apiKey: z.string().optional(),
  // Per-contract overrides remain for tests/forks; default from the registry.
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
  feeConfig: FeeConfigSchema.optional(),
});

export type MedialaneConfig = z.input<typeof MedialaneConfigSchema>;

export interface ResolvedConfig {
  chain: Chain;
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
  feeConfig: ResolvedFeeConfig;
}

export function resolveConfig(raw: MedialaneConfig): ResolvedConfig {
  const parsed = MedialaneConfigSchema.parse(raw);
  const coords = getCoordinates(parsed.chain);

  const marketplace721Contract =
    parsed.marketplace721Contract ?? parsed.marketplaceContract ?? coords.marketplace721!;
  const collection721Contract =
    parsed.collection721Contract ?? parsed.collectionContract ?? coords.collection721!;

  return {
    chain: parsed.chain,
    rpcUrl: parsed.rpcUrl ?? coords.rpcUrl,
    backendUrl: parsed.backendUrl,
    apiKey: parsed.apiKey,
    marketplace721Contract,
    marketplaceContract: marketplace721Contract,
    marketplace1155Contract: parsed.marketplace1155Contract ?? coords.marketplace1155!,
    collection721Contract,
    collectionContract: collection721Contract,
    collection1155Contract: parsed.collection1155Contract ?? coords.collection1155!,
    retryOptions: parsed.retryOptions,
    feeConfig: resolveFeeConfig(parsed.feeConfig),
  };
}
