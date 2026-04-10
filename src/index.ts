// Main client
export { MedialaneClient } from "./client.js";

// Config
export { type MedialaneConfig, type ResolvedConfig, resolveConfig } from "./config.js";

// Modules
export { MarketplaceModule, MedialaneError } from "./marketplace/index.js";
export { ApiClient, MedialaneApiError } from "./api/client.js";

// Types
export * from "./types/index.js";
export type { MedialaneErrorCode } from "./types/errors.js";

// Constants
export {
  MARKETPLACE_CONTRACT_MAINNET,
  COLLECTION_CONTRACT_MAINNET,
  POP_FACTORY_CONTRACT_MAINNET,
  POP_COLLECTION_CLASS_HASH_MAINNET,
  DROP_FACTORY_CONTRACT_MAINNET,
  DROP_COLLECTION_CLASS_HASH_MAINNET,
  SUPPORTED_TOKENS,
  SUPPORTED_NETWORKS,
  DEFAULT_RPC_URLS,
  type Network,
  type SupportedTokenSymbol,
} from "./constants.js";

// ABI
export { IPMarketplaceABI, POPCollectionABI, POPFactoryABI, DropCollectionABI, DropFactoryABI, CollectionRegistryABI } from "./abis.js";

// Services
export { PopService } from "./services/pop.js";
export { DropService } from "./services/drop.js";

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
