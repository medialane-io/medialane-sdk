import { type TypedData, TypedDataRevision, constants } from "starknet";

// ── Shared SNIP-12 building blocks ─────────────────────────────────────────────

const STARKNET_DOMAIN = [
  { name: "name", type: "shortstring" },
  { name: "version", type: "shortstring" },
  { name: "chainId", type: "shortstring" },
  { name: "revision", type: "shortstring" },
];

const OFFER_ITEM = [
  { name: "item_type", type: "shortstring" },
  { name: "token", type: "ContractAddress" },
  { name: "identifier_or_criteria", type: "felt" },
  { name: "amount", type: "felt" },
];

const CONSIDERATION_ITEM = [
  { name: "item_type", type: "shortstring" },
  { name: "token", type: "ContractAddress" },
  { name: "identifier_or_criteria", type: "felt" },
  { name: "amount", type: "felt" },
  { name: "recipient", type: "ContractAddress" },
];

const ORDER_PARAMETERS = [
  { name: "offerer", type: "ContractAddress" },
  { name: "marketplace", type: "ContractAddress" },
  { name: "offer", type: "OfferItem" },
  { name: "consideration", type: "ConsiderationItem" },
  { name: "royalty_max_bps", type: "felt" },
  { name: "start_time", type: "felt" },
  { name: "end_time", type: "felt" },
  { name: "salt", type: "felt" },
  { name: "counter", type: "felt" },
];

const ORDER_CANCELLATION = [
  { name: "order_hash", type: "felt" },
  { name: "offerer", type: "ContractAddress" },
];

/**
 * SNIP-12 domain version per marketplace contract:
 *   ERC-721 marketplace → "1"
 *   ERC-1155 marketplace V2 → "2"
 *
 * If the Cairo contracts are ever redeployed with different SNIP-12 domains,
 * update only this lookup — every builder reads through it.
 */
const DOMAIN_VERSION: Record<"erc721" | "erc1155", string> = {
  erc721: "5",
  erc1155: "4",
};

function buildDomain(standard: "erc721" | "erc1155", chainId: constants.StarknetChainId | string) {
  return {
    name: "Medialane",
    version: DOMAIN_VERSION[standard],
    chainId,
    revision: TypedDataRevision.ACTIVE,
  };
}

// ── Public builders ────────────────────────────────────────────────────────────

/**
 * Build SNIP-12 typed data for signing an OrderParameters struct.
 * The shape is identical across ERC-721 and ERC-1155 (nested OfferItem +
 * ConsiderationItem) — only the domain version differs.
 */
export function buildOrderTypedData(
  message: Record<string, unknown>,
  chainId: constants.StarknetChainId | string,
): TypedData {
  return {
    domain: buildDomain("erc721", chainId),
    primaryType: "OrderParameters",
    types: {
      StarknetDomain: STARKNET_DOMAIN,
      OrderParameters: ORDER_PARAMETERS,
      OfferItem: OFFER_ITEM,
      ConsiderationItem: CONSIDERATION_ITEM,
    },
    message,
  };
}

export function build1155OrderTypedData(
  message: Record<string, unknown>,
  chainId: constants.StarknetChainId | string,
): TypedData {
  return {
    domain: buildDomain("erc1155", chainId),
    primaryType: "OrderParameters",
    types: {
      StarknetDomain: STARKNET_DOMAIN,
      OrderParameters: ORDER_PARAMETERS,
      OfferItem: OFFER_ITEM,
      ConsiderationItem: CONSIDERATION_ITEM,
    },
    message,
  };
}

/** OrderCancellation typed data — identical shape across both standards. */
export function buildCancellationTypedData(
  message: Record<string, unknown>,
  chainId: constants.StarknetChainId | string,
): TypedData {
  return {
    domain: buildDomain("erc721", chainId),
    primaryType: "OrderCancellation",
    types: {
      StarknetDomain: STARKNET_DOMAIN,
      OrderCancellation: ORDER_CANCELLATION,
    },
    message,
  };
}

export function build1155CancellationTypedData(
  message: Record<string, unknown>,
  chainId: constants.StarknetChainId | string,
): TypedData {
  return {
    domain: buildDomain("erc1155", chainId),
    primaryType: "OrderCancellation",
    types: {
      StarknetDomain: STARKNET_DOMAIN,
      OrderCancellation: ORDER_CANCELLATION,
    },
    message,
  };
}
