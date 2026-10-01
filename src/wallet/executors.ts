import { Account, typedData as starknetTypedData, type Call, type ProviderInterface } from "starknet";
import { signWithPrivateKey } from "../starknet/passkey-wallet/crypto.js";
import { executeSponsored, SponsoredCallRejectedError } from "../starknet/services/sponsoredExecutor.js";
import type { SelfFundConsent, SelfFundFeeEstimate } from "./self-fund-consent.js";
import type { ExecutedTransaction, WalletExecutor } from "./types.js";
import { getTokenBySymbol } from "../utils/token.js";

export interface SelfFundedDeps {
  provider: () => ProviderInterface;
}

export function accountFor(
  provider: ProviderInterface,
  address: string,
  privateKeyHex: string,
): Account {
  return new Account({ provider, address, signer: privateKeyHex, cairoVersion: "1" });
}

export async function estimateSelfFundedFee(
  provider: ProviderInterface,
  address: string,
  calls: Call[],
): Promise<SelfFundFeeEstimate> {
  const account = new Account({ provider, address, signer: "0x1", cairoVersion: "1" });
  const estimate = await account.estimateInvokeFee(calls);
  const balanceRaw = await feeTokenBalance(provider, address, estimate.unit).catch(() => null);
  return { feeRaw: estimate.overall_fee, unit: estimate.unit, balanceRaw };
}

async function feeTokenBalance(provider: ProviderInterface, address: string, unit: string): Promise<bigint> {
  const token = getTokenBySymbol(unit === "FRI" ? "STRK" : "ETH");
  if (!token) throw new Error(`No fee token for unit ${unit}`);
  const [low = "0x0", high = "0x0"] = await provider.callContract({
    contractAddress: token.address,
    entrypoint: "balance_of",
    calldata: [address],
  });
  return BigInt(low) + (BigInt(high) << 128n);
}

export function selfFundedExecutor(deps: SelfFundedDeps): WalletExecutor {
  return {
    async execute({ userAddress, privateKeyHex, calls }): Promise<ExecutedTransaction> {
      const account = accountFor(deps.provider(), userAddress, privateKeyHex);
      const { transaction_hash } = await account.execute(calls);
      return { transactionHash: transaction_hash };
    },
  };
}

export interface SponsoredDeps extends SelfFundedDeps {
  proxyUrl: string;
  consent: SelfFundConsent;
  fetchImpl?: typeof fetch;
  fallback?: WalletExecutor;
}

export function sponsoredExecutor(deps: SponsoredDeps): WalletExecutor {
  const fallback = deps.fallback ?? selfFundedExecutor(deps);
  return {
    async execute(input): Promise<ExecutedTransaction> {
      const { userAddress, privateKeyHex, calls } = input;
      const result = await executeSponsored(
        { proxyUrl: deps.proxyUrl, fetchImpl: deps.fetchImpl },
        {
          address: userAddress,
          signTypedData: async (data) =>
            signWithPrivateKey(privateKeyHex, starknetTypedData.getMessageHash(data, userAddress)),
        },
        calls,
      );
      if (result.status === "sponsored") return { transactionHash: result.transactionHash };

      const consented = await deps.consent.request({ address: userAddress, calls });
      if (!consented) throw new SponsoredCallRejectedError(result.reason);
      return fallback.execute(input);
    },
  };
}
