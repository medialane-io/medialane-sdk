// Pure view reads on the ERC-1155 venue. The self-executing order writes that
// used to live here (createListing1155/makeOffer1155/fulfillOrder1155/
// cancelOrder1155/checkoutCart1155/incrementCounter1155) were removed in
// 0.64.0 — order execution goes through StarknetVenue over the VenueSigner
// capability port (../venue.ts). Calldata/typed-data construction lives in
// the pure builders (./build.ts, ../marketplace/signing.ts).
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
