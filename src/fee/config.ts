import { z } from "zod";

export const FeeConfigSchema = z.object({
  enabled: z.boolean().default(true),
  fundAddress: z.string().min(1).optional(),
  marketplaceBps: z.number().int().min(0).max(10000).default(100),
  launchpadBps: z.number().int().min(0).max(10000).default(100),
});

export type FeeConfig = z.input<typeof FeeConfigSchema>;

export interface ResolvedFeeConfig {
  enabled: boolean;
  fundAddress: string | undefined;
  marketplaceBps: number;
  launchpadBps: number;
}

export function resolveFeeConfig(raw: FeeConfig | undefined): ResolvedFeeConfig {
  const p = FeeConfigSchema.parse(raw ?? {});
  return {
    enabled: p.enabled,
    fundAddress: p.fundAddress,
    marketplaceBps: p.marketplaceBps,
    launchpadBps: p.launchpadBps,
  };
}
