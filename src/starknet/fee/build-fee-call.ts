import { cairo, type Call } from "starknet";
import type { ResolvedFeeConfig } from "../../fee/config.js";

export type FeeSurface = "marketplace" | "launchpad";

export interface BuildFeeCallParams {
  surface: FeeSurface;
  /** ERC-20 address the gross amount is denominated in. */
  token: string;
  /** Gross amount in raw token units (e.g. price in wei, or price * quantity). */
  grossAmount: bigint;
}

/**
 * The single source of truth for the platform fee. Returns one ERC-20
 * `transfer(fundAddress, feeAmount)` Call to bundle into the settlement
 * multicall, or `null` when no fee should be charged.
 *
 * Fail-safe: returns null if disabled, no fund address, or the fee floors to 0.
 */
export function buildFeeCall(
  p: BuildFeeCallParams,
  cfg: ResolvedFeeConfig
): Call | null {
  if (!cfg.enabled || !cfg.fundAddress) return null;
  const bps = p.surface === "marketplace" ? cfg.marketplaceBps : cfg.launchpadBps;
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
