import { type TypedData, TypedDataRevision, constants } from "starknet";

const STARKNET_DOMAIN = [
  { name: "name", type: "shortstring" },
  { name: "version", type: "shortstring" },
  { name: "chainId", type: "shortstring" },
  { name: "revision", type: "shortstring" },
];

function domain1155(chainId: constants.StarknetChainId) {
  return {
    name: "Medialane1155",
    version: "1",
    chainId,
    revision: TypedDataRevision.ACTIVE,
  };
}

/**
 * Build SNIP-12 typed data for signing an ERC-1155 OrderParameters struct.
 *
 * Differs from the ERC-721 Medialane signing:
 * - Domain name is "Medialane1155"
 * - OrderParameters is flat (no nested OfferItem / ConsiderationItem structs)
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
      OrderParameters: [
        { name: "offerer", type: "ContractAddress" },
        { name: "nft_contract", type: "ContractAddress" },
        { name: "token_id", type: "felt" },
        { name: "amount", type: "felt" },
        { name: "payment_token", type: "ContractAddress" },
        { name: "price_per_unit", type: "felt" },
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
