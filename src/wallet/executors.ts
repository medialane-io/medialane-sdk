import type { FetchLike } from "../utils/fetch.js";
import { Account, typedData as starknetTypedData, type Call, type ProviderInterface } from "starknet";
import { signWithPrivateKey } from "../starknet/passkey-wallet/crypto.js";
import { ACTION_PROBLEM, UserFacingError } from "../errors.js";
import { executeSponsored } from "../starknet/services/sponsoredExecutor.js";
import type { SelfFundConsent, SelfFundFeeEstimate } from "./self-fund-consent.js";
import type { ExecutedTransaction, WalletExecutor } from "./types.js";
import { getTokenBySymbol } from "../utils/token.js";
import { erc20Balance } from "../starknet/erc20.js";
import { getGuardians, getOwners } from "../starknet/media-wallet/guardian.js";
import { CREDITS_EXHAUSTED, cosignedSelfFundedExecutor } from "./cosigned-self-pay.js";

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
  cosignedFallback?: WalletExecutor;
  guardians?: (address: string) => Promise<unknown[]>;
  owners?: (address: string) => Promise<unknown[]>;
}

export function sponsoredExecutor(deps: SponsoredDeps): WalletExecutor {
  const fallback = deps.fallback ?? selfFundedExecutor(deps);
  const cosignedFallback = deps.cosignedFallback ?? cosignedSelfFundedExecutor(deps);
  const guardians = deps.guardians ?? ((address: string) => getGuardians(deps.provider(), address));
  const owners = deps.owners ?? ((address: string) => getOwners(deps.provider(), address));
  const ownerCanSignAlone = async (address: string): Promise<boolean | null> => {
    try {
      if ((await guardians(address)).length > 0) return false;
      return (await owners(address)).length <= 1;
    } catch {
      return null;
    }
  };
  return {
    async execute(input): Promise<ExecutedTransaction> {
      const { userAddress, privateKeyHex, calls, intentIds } = input;
      const hasIntents = Boolean(intentIds?.length);
      let refusal: { reason: string; code?: string } = { reason: "This action can't be sponsored" };

      if (intentIds?.length) {
        const result = await executeSponsored(
          { proxyUrl: deps.proxyUrl, fetchImpl: deps.fetchImpl },
          {
            address: userAddress,
            signTypedData: async (data) =>
              signWithPrivateKey(privateKeyHex, starknetTypedData.getMessageHash(data, userAddress)),
          },
          { intentIds, calls },
        );
        if (result.status === "sponsored") return { transactionHash: result.transactionHash };
        refusal = result;
      }

      const alone = await ownerCanSignAlone(userAddress);
      const needsCosigning = alone === false || (alone === null && hasIntents);
      if (needsCosigning && !hasIntents) throw new UserFacingError(ACTION_PROBLEM);
      if (needsCosigning && refusal.code === "credits_exhausted") throw new UserFacingError(CREDITS_EXHAUSTED);

      const consented = await deps.consent.request({ address: userAddress, calls });
      if (!consented) throw new UserFacingError(refusal.reason);
      return (needsCosigning ? cosignedFallback : fallback).execute(input);
    },
  };
}
