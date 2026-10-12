import { cairo, type Call } from "starknet";
import type { ResolvedFeeConfig } from "../../fee/config.js";

export type FeeSurface = "marketplace" | "launchpad" | "sponsorship";

export interface BuildFeeCallParams {
  surface: FeeSurface;

  token: string;

  grossAmount: bigint;
}

/** Basis points charged on `surface`; 0 when the fee is off or has nowhere to go. */
export function feeBps(surface: FeeSurface, cfg: ResolvedFeeConfig): number {
  if (!cfg.enabled || !cfg.fundAddress) return 0;
  return surface === "marketplace" ? cfg.marketplaceBps
    : surface === "launchpad" ? cfg.launchpadBps
    : cfg.sponsorshipBps;
}

export function feeAmount(grossAmount: bigint, bps: number): bigint {
  return bps <= 0 ? 0n : (grossAmount * BigInt(bps)) / 10000n;
}

export function buildFeeCall(
  p: BuildFeeCallParams,
  cfg: ResolvedFeeConfig
): Call | null {
  const fee = feeAmount(p.grossAmount, feeBps(p.surface, cfg));
  if (fee <= 0n) return null;
  const u = cairo.uint256(fee.toString());
  return {
    contractAddress: p.token,
    entrypoint: "transfer",
    calldata: [cfg.fundAddress!, u.low.toString(), u.high.toString()],
  };
}
