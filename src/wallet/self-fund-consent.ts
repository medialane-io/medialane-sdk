import type { Call } from "starknet";

export interface SelfFundFeeEstimate {
  feeRaw: bigint;
  unit: string;
}

export type SelfFundConsentHandler = (
  feeEstimate: Promise<SelfFundFeeEstimate | null>,
) => Promise<boolean>;

export interface SelfFundConsent {
  registerHandler(handler: SelfFundConsentHandler | null): void;
  request(input: { address?: string; calls?: Call[] }): Promise<boolean>;
}

export function createSelfFundConsent(
  estimateFee: (address: string, calls: Call[]) => Promise<SelfFundFeeEstimate>,
): SelfFundConsent {
  let handler: SelfFundConsentHandler | null = null;
  return {
    registerHandler(next) {
      handler = next;
    },
    async request({ address, calls }) {
      if (!handler) return false;
      const feeEstimate =
        address && calls ? estimateFee(address, calls).catch(() => null) : Promise.resolve(null);
      return handler(feeEstimate);
    },
  };
}
