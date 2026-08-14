import { hashTypedData, type TypedDataDomain } from "viem";

export const EVM_ORDER_TYPES = {
  OfferItem: [
    { name: "itemType", type: "uint8" },
    { name: "token", type: "address" },
    { name: "identifier", type: "uint256" },
    { name: "amount", type: "uint256" },
  ],
  ConsiderationItem: [
    { name: "itemType", type: "uint8" },
    { name: "token", type: "address" },
    { name: "identifier", type: "uint256" },
    { name: "amount", type: "uint256" },
    { name: "recipient", type: "address" },
  ],
  OrderParameters: [
    { name: "offerer", type: "address" },
    { name: "offer", type: "OfferItem" },
    { name: "consideration", type: "ConsiderationItem" },
    { name: "royaltyMaxBps", type: "uint256" },
    { name: "startTime", type: "uint256" },
    { name: "endTime", type: "uint256" },
    { name: "salt", type: "uint256" },
    { name: "counter", type: "uint256" },
  ],
} as const;

export type EvmItemType = 0 | 1 | 2;

export interface EvmOfferItem {
  itemType: EvmItemType;
  token: `0x${string}`;
  identifier: bigint;
  amount: bigint;
}

export interface EvmConsiderationItem extends EvmOfferItem {
  recipient: `0x${string}`;
}

export interface EvmOrderParameters {
  offerer: `0x${string}`;
  offer: EvmOfferItem;
  consideration: EvmConsiderationItem;
  royaltyMaxBps: bigint;
  startTime: bigint;
  endTime: bigint;
  salt: bigint;
  counter: bigint;
}

export function evmOrderDomain(chainId: number, verifyingContract: `0x${string}`): TypedDataDomain {
  return { name: "Medialane", version: "1", chainId, verifyingContract };
}

export function evmOrderDigest(
  chainId: number,
  verifyingContract: `0x${string}`,
  parameters: EvmOrderParameters,
): `0x${string}` {
  return hashTypedData({
    domain: evmOrderDomain(chainId, verifyingContract),
    types: EVM_ORDER_TYPES,
    primaryType: "OrderParameters",
    message: parameters,
  });
}
