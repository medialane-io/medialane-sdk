

import { type Abi, Contract } from "starknet";
import { IPMarketplaceABI } from "../abis/index.js";
import type { ResolvedConfig } from "../../config.js";
import type { OrderDetails } from "../../types/marketplace.js";
import { getProvider, newContract } from "./utils.js";

const _contractCache = new WeakMap<ResolvedConfig, { contract: Contract }>();

function makeContract(config: ResolvedConfig): { contract: Contract } {
  const cached = _contractCache.get(config);
  if (cached) return cached;
  const contract = newContract(
    IPMarketplaceABI as unknown as Abi,
    config.marketplaceContract,
    getProvider(config)
  );
  const entry = { contract };
  _contractCache.set(config, entry);
  return entry;
}

export async function getOrderDetails(
  orderHash: string,
  config: ResolvedConfig
): Promise<OrderDetails> {
  const { contract } = makeContract(config);
  return contract.get_order_details(orderHash) as Promise<OrderDetails>;
}

export async function getCounter(
  address: string,
  config: ResolvedConfig
): Promise<bigint> {
  const { contract } = makeContract(config);
  return BigInt((await contract.get_counter(address)).toString());
}
