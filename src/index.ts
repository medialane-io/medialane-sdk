// ─── Chain-neutral core ──────────────────────────────────────────────────────

// Config
export { type MedialaneConfig, type ResolvedConfig, resolveConfig } from "./config.js";

// Fee config (chain-neutral; the Starknet fee-call builder lives in the adapter)
export { resolveFeeConfig, FeeConfigSchema } from "./fee/index.js";
export type { FeeConfig, ResolvedFeeConfig } from "./fee/index.js";

// API client (all reads, all chains)
export { ApiClient, MedialaneApiError } from "./api/client.js";

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
  STARKNET_IP_TICKETS_FACTORY_CONTRACT,
  STARKNET_IP_TICKET_COLLECTION_CLASS_HASH,
  STARKNET_IP_CLUB_FACTORY_CONTRACT,
  STARKNET_IP_CLUB_COLLECTION_CLASS_HASH,
  STARKNET_IP_SPONSORSHIP_CONTRACT,
  STARKNET_IP_SPONSORSHIP_CLASS_HASH,
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
  getStarknetCoordinates,
  type Chain,
  type ChainCoordinates,
  type StarknetCoordinates,
  type EvmCoordinates,
  type SolanaCoordinates,
  type StellarCoordinates,
  type CoordinatesByChain,
} from "./chains.js";

// Service registry (05-service-model). Types (ServiceDefinition etc.) are
// already public via `export * from "./types/index.js"`.
export {
  getService,
  listServices,
  getServicesByCapability,
  hasCapability,
  isServiceId,
} from "./services/registry.js";
export type { ServiceId } from "./services/registry.js";

// Utils
export { normalizeAddress, normalizeHash, shortenAddress } from "./utils/address.js";
export { parseAmount, formatAmount, getTokenByAddress, getTokenBySymbol, getListableTokens } from "./utils/token.js";
export type { SupportedToken } from "./utils/token.js";
export { stringifyBigInts, u256ToBigInt } from "./utils/bigint.js";
export type { RetryOptions } from "./utils/retry.js";
export { PUBLIC_RPC_FALLBACKS, isTransientRpcError, createFailoverFetch } from "./utils/rpc.js";
export type { FailoverFetchOptions } from "./utils/rpc.js";


// Chain-neutral adapter interfaces (platform-federation spec §2.2)
export * from "./adapters/index.js";

// The Starknet adapter is NOT re-exported here. Import it from
// `@medialane/sdk/starknet` — keeping the root chain-neutral means importing a
// core helper (config, types, `hasCapability`, `ApiClient`, …) no longer pulls
// starknet.js + its crypto deps into a chain-agnostic consumer's bundle
// (audit C-3; the transition re-export was removed in 0.71.0).
