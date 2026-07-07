import { hashTypedData, type TypedDataDomain } from "viem";

/**
 * EIP-712 order typing for the Medialane EVM venues — byte-identical to the
 * audited Solidity (contracts/EVM-Marketplace-ERC721/src/Medialane721.sol and
 * the 1155 venue, which shares the type strings; the domain's
 * verifyingContract separates deployments and venues).
 */

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

/** NATIVE=0, ERC20=1, ERC721=2 on the 721 venue; NATIVE=0, ERC20=1, ERC1155=2 on the 1155 venue. */
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

/** The order's EIP-712 digest — the venue's order hash and the platform's
 *  canonical order id on EVM chains. */
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
