

import { type Abi, Contract } from "starknet";
import { Medialane1155ABI } from "../abis/index.js";
import type { ResolvedConfig } from "../../config.js";
import type { OrderDetails } from "../../types/marketplace.js";
import { getProvider, newContract } from "../marketplace/utils.js";

const _contractCache = new WeakMap<ResolvedConfig, Contract>();

function getContract(config: ResolvedConfig): Contract {
  let c = _contractCache.get(config);
  if (!c) {
    c = newContract(Medialane1155ABI as unknown as Abi, config.marketplace1155Contract, getProvider(config));
    _contractCache.set(config, c);
  }
  return c;
}

export async function getOrderDetails1155(
  orderHash: string,
  config: ResolvedConfig
): Promise<OrderDetails> {
  const contract = getContract(config);
  return contract.get_order_details(orderHash) as Promise<OrderDetails>;
}

export async function getCounter1155(
  address: string,
  config: ResolvedConfig
): Promise<bigint> {
  const contract = getContract(config);
  return BigInt((await contract.get_counter(address)).toString());
}
