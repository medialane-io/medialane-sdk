import type { FetchLike } from "../utils/fetch.js";
import { Account, typedData as starknetTypedData, type Call, type ProviderInterface } from "starknet";
import { signWithPrivateKey } from "../starknet/passkey-wallet/crypto.js";
import { UserFacingError } from "../errors.js";
import { executeSponsored } from "../starknet/services/sponsoredExecutor.js";
import type { SelfFundConsent, SelfFundFeeEstimate } from "./self-fund-consent.js";
import type { ExecutedTransaction, WalletExecutor } from "./types.js";
import { getTokenBySymbol } from "../utils/token.js";
import { erc20Balance } from "../starknet/erc20.js";
import { getGuardians } from "../starknet/media-wallet/guardian.js";

export const GUARDIAN_WALLET_BUSY = "This can't go through right now. Please try again in a moment.";

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
  return erc20Balance(provider, token.address, address);
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
  fetchImpl?: FetchLike;
  fallback?: WalletExecutor;
  guardians?: (address: string) => Promise<unknown[]>;
}

export function sponsoredExecutor(deps: SponsoredDeps): WalletExecutor {
  const fallback = deps.fallback ?? selfFundedExecutor(deps);
  const guardians = deps.guardians ?? ((address: string) => getGuardians(deps.provider(), address));
  const hasGuardian = async (address: string): Promise<boolean> => {
    try {
      return (await guardians(address)).length > 0;
    } catch {
      return false;
    }
  };
  const refuseSelfFundingWithGuardian = async (address: string): Promise<void> => {
    if (await hasGuardian(address)) throw new UserFacingError(GUARDIAN_WALLET_BUSY);
  };
  return {
    async execute(input): Promise<ExecutedTransaction> {
      const { userAddress, privateKeyHex, calls, intentIds } = input;
      if (!intentIds?.length) {
        await refuseSelfFundingWithGuardian(userAddress);
        const consented = await deps.consent.request({ address: userAddress, calls });
        if (!consented) throw new UserFacingError("This action can't be sponsored");
        return fallback.execute(input);
      }
      const result = await executeSponsored(
        { proxyUrl: deps.proxyUrl, fetchImpl: deps.fetchImpl },
        {
          address: userAddress,
          signTypedData: async (data) =>
            signWithPrivateKey(privateKeyHex, starknetTypedData.getMessageHash(data, userAddress)),
        },
        { intentIds },
      );
      if (result.status === "sponsored") return { transactionHash: result.transactionHash };

      await refuseSelfFundingWithGuardian(userAddress);
      const consented = await deps.consent.request({ address: userAddress, calls });
      if (!consented) throw new UserFacingError(result.reason);
      return fallback.execute(input);
    },
  };
}
