import { z } from "zod";
import { CHAINS, getCoordinates, DEFAULT_CHAIN, type Chain } from "./chains.js";
import type { RetryOptions } from "./utils/retry.js";
import { FeeConfigSchema, resolveFeeConfig, type ResolvedFeeConfig } from "./fee/index.js";

export const MedialaneConfigSchema = z.object({

  chain: z.enum(CHAINS).default(DEFAULT_CHAIN),
  backendUrl: z.string().url().optional(),
  apiKey: z.string().optional(),

  marketplace721Contract: z.string().optional(),
  marketplace1155Contract: z.string().optional(),
  collection721Contract: z.string().optional(),
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
  backendUrl: string | undefined;
  apiKey: string | undefined;
  marketplace721Contract: string;
  marketplace1155Contract: string;
  collection721Contract: string;
  collection1155Contract: string;
  retryOptions?: RetryOptions;
  feeConfig: ResolvedFeeConfig;
}

export function resolveConfig(raw: MedialaneConfig): ResolvedConfig {
  const parsed = MedialaneConfigSchema.parse(raw);
  const coords = getCoordinates(parsed.chain);

  const sn = (parsed.chain === "STARKNET" ? coords : {}) as import("./chains.js").StarknetCoordinates;

  const marketplace721Contract =
    parsed.marketplace721Contract ?? sn.marketplace721;
  const collection721Contract =
    parsed.collection721Contract ?? sn.collection721;

  return {
    chain: parsed.chain,
    backendUrl: parsed.backendUrl,
    apiKey: parsed.apiKey,
    marketplace721Contract,
    marketplace1155Contract: parsed.marketplace1155Contract ?? sn.marketplace1155,
    collection721Contract,
    collection1155Contract: parsed.collection1155Contract ?? sn.collection1155,
    retryOptions: parsed.retryOptions,
    feeConfig: resolveFeeConfig(parsed.feeConfig),
  };
}
