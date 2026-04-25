// Main client
export { MedialaneClient } from "./client.js";

// Config
export { type MedialaneConfig, type ResolvedConfig, resolveConfig } from "./config.js";

// Modules
export { MarketplaceModule, MedialaneError } from "./marketplace/index.js";
export { Medialane1155Module } from "./marketplace1155/index.js";
export { ApiClient, MedialaneApiError } from "./api/client.js";

// Types
export * from "./types/index.js";
export type { MedialaneErrorCode } from "./types/errors.js";

// Constants
export {
  MARKETPLACE_CONTRACT_MAINNET,
  MARKETPLACE_1155_CONTRACT_MAINNET,
  COLLECTION_CONTRACT_MAINNET,
  POP_FACTORY_CONTRACT_MAINNET,
  POP_COLLECTION_CLASS_HASH_MAINNET,
  DROP_FACTORY_CONTRACT_MAINNET,
  DROP_COLLECTION_CLASS_HASH_MAINNET,
  ERC1155_FACTORY_CONTRACT_MAINNET,
  ERC1155_COLLECTION_CLASS_HASH_MAINNET,
  NFTCOMMENTS_CONTRACT_MAINNET,
  SUPPORTED_TOKENS,
  SUPPORTED_NETWORKS,
  DEFAULT_RPC_URL,
  type Network,
  type SupportedTokenSymbol,
} from "./constants.js";

// ABI
export { IPMarketplaceABI, POPCollectionABI, POPFactoryABI, DropCollectionABI, DropFactoryABI, CollectionRegistryABI, Medialane1155ABI, IPCollection1155FactoryABI, IPCollection1155ABI } from "./abis.js";

// Services
export { PopService } from "./services/pop.js";
export { DropService } from "./services/drop.js";
export { ERC1155CollectionService } from "./services/erc1155collection.js";
export type {
  DeployCollectionParams,
  MintItemParams,
  BatchMintItemParams,
} from "./services/erc1155collection.js";

// Utils
export { normalizeAddress, shortenAddress } from "./utils/address.js";
export { parseAmount, formatAmount, getTokenByAddress, getTokenBySymbol, getListableTokens } from "./utils/token.js";
export type { SupportedToken } from "./utils/token.js";
export { stringifyBigInts, u256ToBigInt } from "./utils/bigint.js";
export type { RetryOptions } from "./utils/retry.js";

// Signing builders (for advanced / ChipiPay integrations)
export {
  buildOrderTypedData,
  buildFulfillmentTypedData,
  buildCancellationTypedData,
} from "./marketplace/signing.js";
export {
  build1155OrderTypedData,
  build1155FulfillmentTypedData,
  build1155CancellationTypedData,
} from "./marketplace1155/signing.js";
