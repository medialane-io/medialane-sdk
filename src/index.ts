// Main client
export { MedialaneClient } from "./client.js";

// Config
export { type MedialaneConfig, type ResolvedConfig, resolveConfig } from "./config.js";

// Fee (platform-layer creators-fund fee — single source of truth)
export {
  buildFeeCall,
  resolveFeeConfig,
  FeeConfigSchema,
} from "./fee/index.js";
export type {
  FeeConfig,
  ResolvedFeeConfig,
  FeeSurface,
  BuildFeeCallParams,
} from "./fee/index.js";

// Modules
export { MarketplaceModule, MedialaneError } from "./marketplace/index.js";
export { Medialane1155Module } from "./marketplace1155/index.js";
export { ApiClient, MedialaneApiError } from "./api/client.js";

// Types
export * from "./types/index.js";
export type { MedialaneErrorCode } from "./types/errors.js";

// Constants
export {
  MARKETPLACE_721_CONTRACT_MAINNET,
  MARKETPLACE_721_CLASS_HASH_MAINNET,
  MARKETPLACE_721_START_BLOCK_MAINNET,
  MARKETPLACE_1155_CONTRACT_MAINNET,
  MARKETPLACE_1155_CLASS_HASH_MAINNET,
  MARKETPLACE_1155_START_BLOCK_MAINNET,
  COLLECTION_721_CONTRACT_MAINNET,
  COLLECTION_721_START_BLOCK_MAINNET,
  IPNFT_CLASS_HASH_MAINNET,
  IPCOLLECTION_CLASS_HASH_MAINNET,
  POP_FACTORY_CONTRACT_MAINNET,
  POP_COLLECTION_CLASS_HASH_MAINNET,
  DROP_FACTORY_CONTRACT_MAINNET,
  DROP_COLLECTION_CLASS_HASH_MAINNET,
  COLLECTION_1155_CONTRACT_MAINNET,
  COLLECTION_1155_FACTORY_CLASS_HASH_MAINNET,
  COLLECTION_1155_CLASS_HASH_MAINNET,
  COLLECTION_1155_START_BLOCK_MAINNET,
  NFTCOMMENTS_CONTRACT_MAINNET,
  SUPPORTED_TOKENS,
  SUPPORTED_NETWORKS,
  DEFAULT_RPC_URL,
  type Network,
  type SupportedTokenSymbol,
} from "./constants.js";

// ABI
export { IPMarketplaceABI, POPCollectionABI, POPFactoryABI, DropCollectionABI, DropFactoryABI, CollectionRegistryABI, IPCollectionABI, IPNftABI, Medialane1155ABI, IPCollection1155FactoryABI, IPCollection1155ABI } from "./abis/index.js";

// Services
export { PopService } from "./services/pop.js";
export { DropService } from "./services/drop.js";
export { ERC1155CollectionService } from "./services/erc1155collection.js";
// Service registry (05-service-model). Types (ServiceDefinition etc.) are
// already public via `export * from "./types/index.js"`.
export {
  getService,
  listServices,
  getServicesByCapability,
  isServiceId,
} from "./services/registry.js";
export type { ServiceId } from "./services/registry.js";
export type {
  DeployCollectionParams,
  MintItemParams,
  BatchMintItemParams,
} from "./services/erc1155collection.js";

// Utils
export { normalizeAddress, normalizeHash, shortenAddress } from "./utils/address.js";
export { parseAmount, formatAmount, getTokenByAddress, getTokenBySymbol, getListableTokens } from "./utils/token.js";
export type { SupportedToken } from "./utils/token.js";
export { stringifyBigInts, u256ToBigInt } from "./utils/bigint.js";
export type { RetryOptions } from "./utils/retry.js";
export { encodeByteArray } from "./utils/bytearray.js";
export { PUBLIC_RPC_FALLBACKS, isTransientRpcError, createFailoverFetch } from "./utils/rpc.js";
export type { FailoverFetchOptions } from "./utils/rpc.js";

// Signing builders (for advanced / ChipiPay integrations)
export {
  buildOrderTypedData,
  buildCancellationTypedData,
  build1155OrderTypedData,
  build1155CancellationTypedData,
} from "./marketplace/signing.js";
