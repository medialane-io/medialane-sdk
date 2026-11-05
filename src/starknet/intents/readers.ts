import type { RpcProvider } from "starknet";
import type { ResolvedConfig } from "../../config.js";
import { MedialaneApiError } from "../../errors.js";
import type { ApiOrder } from "../../types/api.js";
import { normalizeAddress } from "../../utils/address.js";
import { resolveRoyaltyMaxBps } from "../marketplace/utils.js";
import type { IntentReaders } from "./build.js";

export interface IntentReaderSources {
  provider: RpcProvider;
  orders: { get(orderHash: string): Promise<ApiOrder> };
  config: ResolvedConfig;
}

export function createIntentReaders({ provider, orders, config }: IntentReaderSources): IntentReaders {
  return {
    async counterOf(offerer, standard) {
      const result = await provider.callContract({
        contractAddress: standard === "ERC1155" ? config.marketplace1155Contract : config.marketplace721Contract,
        entrypoint: "get_counter",
        calldata: [normalizeAddress("STARKNET", offerer)],
      });
      if (!result?.[0]) throw new Error("The marketplace returned no counter");
      return BigInt(result[0]).toString();
    },
    royaltyCapOf: (nftContract, tokenId) => resolveRoyaltyMaxBps(provider, nftContract, tokenId),
    async orderOf(orderHash) {
      try {
        return await orders.get(orderHash);
      } catch (err) {
        if (err instanceof MedialaneApiError && err.status === 404) return null;
        throw err;
      }
    },
  };
}
