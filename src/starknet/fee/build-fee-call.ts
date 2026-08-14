import { cairo, type Call } from "starknet";
import type { ResolvedFeeConfig } from "../../fee/config.js";

export type FeeSurface = "marketplace" | "launchpad" | "sponsorship";

export interface BuildFeeCallParams {
  surface: FeeSurface;

  token: string;

  grossAmount: bigint;
}

export function buildFeeCall(
  p: BuildFeeCallParams,
  cfg: ResolvedFeeConfig
): Call | null {
  if (!cfg.enabled || !cfg.fundAddress) return null;
  const bps = p.surface === "marketplace" ? cfg.marketplaceBps
    : p.surface === "launchpad" ? cfg.launchpadBps
    : cfg.sponsorshipBps;
  if (bps <= 0) return null;
  const fee = (p.grossAmount * BigInt(bps)) / 10000n;
  if (fee <= 0n) return null;
  const u = cairo.uint256(fee.toString());
  return {
    contractAddress: p.token,
    entrypoint: "transfer",
    calldata: [cfg.fundAddress, u.low.toString(), u.high.toString()],
  };
}
