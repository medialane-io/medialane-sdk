import { type TypedData, TypedDataRevision, constants } from "starknet";

const STARKNET_DOMAIN = [
  { name: "name", type: "shortstring" },
  { name: "version", type: "shortstring" },
  { name: "chainId", type: "shortstring" },
  { name: "revision", type: "shortstring" },
];

function domain1155(chainId: constants.StarknetChainId) {
  return {
    name: "Medialane",
    version: "2",
    chainId,
    revision: TypedDataRevision.ACTIVE,
  };
}

/**
 * Build SNIP-12 typed data for signing an ERC-1155 OrderParameters struct.
 *
 * Uses the ERC-1155 V2 marketplace shape:
 * - Domain name is "Medialane"
 * - Domain version is "2"
 * - OrderParameters contains nested OfferItem and ConsiderationItem structs
 */
export function build1155OrderTypedData(
  message: Record<string, unknown>,
  chainId: constants.StarknetChainId
): TypedData {
  return {
    domain: domain1155(chainId),
    primaryType: "OrderParameters",
    types: {
      StarknetDomain: STARKNET_DOMAIN,
      OfferItem: [
        { name: "item_type", type: "shortstring" },
        { name: "token", type: "ContractAddress" },
        { name: "identifier_or_criteria", type: "felt" },
        { name: "start_amount", type: "felt" },
        { name: "end_amount", type: "felt" },
      ],
      ConsiderationItem: [
        { name: "item_type", type: "shortstring" },
        { name: "token", type: "ContractAddress" },
        { name: "identifier_or_criteria", type: "felt" },
        { name: "start_amount", type: "felt" },
        { name: "end_amount", type: "felt" },
        { name: "recipient", type: "ContractAddress" },
      ],
      OrderParameters: [
        { name: "offerer", type: "ContractAddress" },
        { name: "offer", type: "OfferItem" },
        { name: "consideration", type: "ConsiderationItem" },
        { name: "start_time", type: "felt" },
        { name: "end_time", type: "felt" },
        { name: "salt", type: "felt" },
        { name: "nonce", type: "felt" },
      ],
    },
    message,
  };
}

/**
 * Build SNIP-12 typed data for signing an ERC-1155 OrderFulfillment struct.
 */
export function build1155FulfillmentTypedData(
  message: Record<string, unknown>,
  chainId: constants.StarknetChainId
): TypedData {
  return {
    domain: domain1155(chainId),
    primaryType: "OrderFulfillment",
    types: {
      StarknetDomain: STARKNET_DOMAIN,
      OrderFulfillment: [
        { name: "order_hash", type: "felt" },
        { name: "fulfiller", type: "ContractAddress" },
        { name: "quantity", type: "felt" },
        { name: "nonce", type: "felt" },
      ],
    },
    message,
  };
}

/**
 * Build SNIP-12 typed data for signing an ERC-1155 OrderCancellation struct.
 */
export function build1155CancellationTypedData(
  message: Record<string, unknown>,
  chainId: constants.StarknetChainId
): TypedData {
  return {
    domain: domain1155(chainId),
    primaryType: "OrderCancellation",
    types: {
      StarknetDomain: STARKNET_DOMAIN,
      OrderCancellation: [
        { name: "order_hash", type: "felt" },
        { name: "offerer", type: "ContractAddress" },
        { name: "nonce", type: "felt" },
      ],
    },
    message,
  };
}
