import { resolveFeeConfig, type ResolvedFeeConfig } from "./config.js";

export interface FeeEnv {
  NEXT_PUBLIC_FEE_ENABLED?: string;
  NEXT_PUBLIC_FEE_FUND_ADDRESS?: string;
  NEXT_PUBLIC_FEE_MARKETPLACE_BPS?: string;
  NEXT_PUBLIC_FEE_LAUNCHPAD_BPS?: string;
}

const DEFAULT_BPS = 100;

function bps(raw: string | undefined): number {
  if (!raw) return DEFAULT_BPS;
  const n = Number(raw);
  return Number.isFinite(n) ? n : DEFAULT_BPS;
}

export function resolveAppFeeConfig(env: FeeEnv = {}): ResolvedFeeConfig {
  return resolveFeeConfig({
    enabled: env.NEXT_PUBLIC_FEE_ENABLED !== "false",
    fundAddress: env.NEXT_PUBLIC_FEE_FUND_ADDRESS || undefined,
    marketplaceBps: bps(env.NEXT_PUBLIC_FEE_MARKETPLACE_BPS),
    launchpadBps: bps(env.NEXT_PUBLIC_FEE_LAUNCHPAD_BPS),
  });
}
