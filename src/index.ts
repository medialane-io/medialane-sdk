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

// Admin signed-request auth (portal/agent ↔ backend wire format — single source)
export * from "./admin-auth/index.js";

// SIWS (Sign-In With Starknet) client protocol — single source for every app
// that mints a wallet-signed session token (medialane-starknet, medialane-io)
export * from "./siws/index.js";

// Types
export * from "./types/index.js";
export type { MedialaneErrorCode } from "./types/errors.js";

// Chain-named contract constants + token config (derived from the chains.ts registry)
export {
  STARKNET_MARKETPLACE_721_CONTRACT,
  STARKNET_MARKETPLACE_721_CLASS_HASH,
  STARKNET_MARKETPLACE_721_START_BLOCK,
  STARKNET_MARKETPLACE_1155_CONTRACT,
  STARKNET_MARKETPLACE_1155_CLASS_HASH,
  STARKNET_MARKETPLACE_1155_START_BLOCK,
  STARKNET_COLLECTION_721_CONTRACT,
  STARKNET_COLLECTION_721_START_BLOCK,
  STARKNET_IPNFT_CLASS_HASH,
  STARKNET_IPCOLLECTION_CLASS_HASH,
  STARKNET_COLLECTION_1155_CONTRACT,
  STARKNET_COLLECTION_1155_FACTORY_CLASS_HASH,
  STARKNET_COLLECTION_1155_CLASS_HASH,
  STARKNET_COLLECTION_1155_START_BLOCK,
  STARKNET_POP_FACTORY_CONTRACT,
  STARKNET_POP_COLLECTION_CLASS_HASH,
  STARKNET_DROP_FACTORY_CONTRACT,
  STARKNET_DROP_COLLECTION_CLASS_HASH,
  STARKNET_NFTCOMMENTS_CONTRACT,
  STARKNET_CREATOR_COIN_FACTORY_CONTRACT,
  STARKNET_CREATOR_COIN_EKUBO_LAUNCHER,
  STARKNET_CREATOR_COIN_CLASS_HASH,
  STARKNET_CREATOR_COIN_FACTORY_CLASS_HASH,
  STARKNET_CREATOR_COIN_START_BLOCK,
  STARKNET_EKUBO_CORE,
  SUPPORTED_TOKENS,
  DEFAULT_CURRENCY,
  type SupportedTokenSymbol,
} from "./constants.js";

// Chain registry — coordinates keyed by chain (single source; spec 2026-06-13 §3.1)
export {
  CHAINS,
  getCoordinates,
  DEFAULT_CHAIN,
  type Chain,
  type ChainCoordinates,
} from "./chains.js";

// ABI
export { IPMarketplaceABI, POPCollectionABI, POPFactoryABI, DropCollectionABI, DropFactoryABI, IPCollectionABI, IPNftABI, Medialane1155ABI, IPCollection1155FactoryABI, IPCollection1155ABI, CreatorCoinFactoryABI, IPTicketCollectionABI, IPTicketCollectionFactoryABI, IPClubABI, IPClubNFTABI, IPSponsorshipABI, IPGenesisABI } from "./abis/index.js";

// Services
export { PopService } from "./services/pop.js";
export { DropService } from "./services/drop.js";
export { TicketService } from "./services/ticket.js";
export { ClubService } from "./services/club.js";
export { SponsorshipService } from "./services/sponsorship.js";
export { ERC1155CollectionService } from "./services/erc1155collection.js";
export {
  CreatorCoinService,
  VALIDATED_EKUBO_PARAMS,
  getCreatorCoinPrice,
  buildCreateCreatorCoinCall,
  buildLaunchOnEkuboCalls,
  parseCreatorCoinCreated,
} from "./services/creatorCoin.js";
export {
  validateName as validateCoinName,
  validateSymbol as validateCoinSymbol,
  validateSupply as validateCoinSupply,
  toRaw as coinToRaw,
  teamCoinsRaw,
  buybackQuoteRaw,
  fdvHuman,
  LAUNCH_PRICE_QUOTE_PER_COIN,
  MIN_SUPPLY as COIN_MIN_SUPPLY,
  MAX_SUPPLY as COIN_MAX_SUPPLY,
} from "./services/coinLaunchMath.js";
export type {
  CreatorCoinReceiptLike,
  CreateCreatorCoinParams,
  EkuboLaunchParams,
  EkuboPoolParams,
  CreatorCoinPrice,
} from "./services/creatorCoin.js";
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
  MintEditionParams,
  BatchMintEditionParams,
  AddSupplyParams,
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
