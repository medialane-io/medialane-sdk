import { getCoordinates } from "./chains.js";

// Per-chain coordinates live in chains.ts (the single source — spec 2026-06-13
// §3.1). These flat *_MAINNET consts are kept as a stable export surface and
// derive from the Starknet registry entry so there is exactly one source.
const SN = getCoordinates("STARKNET");

/** Medialane721 marketplace venue — immutable, ownerless (redesign, deployed 2026-05-31). */
export const MARKETPLACE_721_CONTRACT_MAINNET = SN.marketplace721!;

/** Class hash of the Medialane721 venue. */
export const MARKETPLACE_721_CLASS_HASH_MAINNET = SN.marketplace721ClassHash!;

/** First mainnet block for the Medialane721 venue deployment. */
export const MARKETPLACE_721_START_BLOCK_MAINNET = SN.marketplace721StartBlock!;

/** Medialane1155 marketplace venue — immutable, ownerless (redesign, deployed 2026-05-31). */
export const MARKETPLACE_1155_CONTRACT_MAINNET = SN.marketplace1155!;

/** Class hash of the Medialane1155 venue. */
export const MARKETPLACE_1155_CLASS_HASH_MAINNET = SN.marketplace1155ClassHash!;

/** First mainnet block for the Medialane1155 venue deployment. */
export const MARKETPLACE_1155_START_BLOCK_MAINNET = SN.marketplace1155StartBlock!;

export const COLLECTION_721_CONTRACT_MAINNET = SN.collection721!;

/** Class hash of the IPNft (per-collection ERC-721) implementation. */
export const IPNFT_CLASS_HASH_MAINNET = SN.ipNftClassHash!;

/** Class hash of the IPCollection registry. */
export const IPCOLLECTION_CLASS_HASH_MAINNET = SN.ipCollectionClassHash!;

/** First mainnet block for the current MIP IPCollection registry deployment. */
export const COLLECTION_721_START_BLOCK_MAINNET = SN.collection721StartBlock!;

export const DROP_FACTORY_CONTRACT_MAINNET = SN.dropFactory!;

export const POP_FACTORY_CONTRACT_MAINNET = SN.popFactory!;

/** NFTComments on-chain comment system — immutable, no admin key. */
export const NFTCOMMENTS_CONTRACT_MAINNET = SN.nftComments!;

export const SUPPORTED_TOKENS = [
  {
    // Circle-native USDC on Starknet (canonical)
    symbol: "USDC",
    address:
      "0x033068f6539f8e6e6b131e6b2b814e6c34a5224bc66947c47dab9dfee93b35fb",
    decimals: 6,
    listable: true,
  },
  {
    symbol: "USDT",
    address:
      "0x068f5c6a61780768455de69077e07e89787839bf8166decfbf92b645209c0fb8",
    decimals: 6,
    listable: true,
  },
  {
    symbol: "ETH",
    address:
      "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7",
    decimals: 18,
    listable: true,
  },
  {
    symbol: "STRK",
    address:
      "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d",
    decimals: 18,
    listable: true,
  },
  {
    symbol: "WBTC",
    address:
      "0x03fe2b97c1fd336e750087d68b9b867997fd64a2661ff3ca5a7c771641e8e7ac",
    decimals: 8,
    listable: true,
  },
] as const;

export type SupportedTokenSymbol = (typeof SUPPORTED_TOKENS)[number]["symbol"];

/** Default currency for listings and offers — Circle-native USDC on Starknet. */
export const DEFAULT_CURRENCY: SupportedTokenSymbol = "USDC";

export const POP_COLLECTION_CLASS_HASH_MAINNET = SN.popCollectionClassHash!;

export const DROP_COLLECTION_CLASS_HASH_MAINNET = SN.dropCollectionClassHash!;

/** IPCollectionFactory v0.3.0 (deployed mainnet 2026-06-10): sequential on-chain
 *  edition ids, ownerless/immutable. New collections deploy from here. */
export const COLLECTION_1155_CONTRACT_MAINNET = SN.collection1155!;

/** Class hash of the IPCollectionFactory v0.3.0 implementation. */
export const COLLECTION_1155_FACTORY_CLASS_HASH_MAINNET = SN.collection1155FactoryClassHash!;

/** Class hash of the IPCollection ERC-1155 v0.3.0 implementation. */
export const COLLECTION_1155_CLASS_HASH_MAINNET = SN.collection1155ClassHash!;

/** First mainnet block of the v0.3.0 ERC-1155 factory deployment. */
export const COLLECTION_1155_START_BLOCK_MAINNET = SN.collection1155StartBlock!;

// ─── Creator Coin ────────────────────────────────────────────────────────────
// Faithful fork of unruggable.meme, Ekubo-only, deployed mainnet 2026-06-04.

/** Creator Coin Factory — entrypoint: create_creator_coin + launch_on_ekubo. */
export const CREATOR_COIN_FACTORY_CONTRACT_MAINNET = SN.creatorCoinFactory!;

/** EkuboLauncher — permanently holds (locks) each Creator Coin's LP position. */
export const CREATOR_COIN_EKUBO_LAUNCHER_MAINNET = SN.creatorCoinEkuboLauncher!;

/** Class hash of the per-coin CreatorCoin ERC-20 the Factory deploys. */
export const CREATOR_COIN_CLASS_HASH_MAINNET = SN.creatorCoinClassHash!;

/** Class hash of the Creator Coin Factory. */
export const CREATOR_COIN_FACTORY_CLASS_HASH_MAINNET = SN.creatorCoinFactoryClassHash!;

/** First mainnet block of the Factory deployment. */
export const CREATOR_COIN_START_BLOCK_MAINNET = SN.creatorCoinStartBlock!;

/** Ekubo Core (Starknet mainnet) — Creator Coin pools live here; read spot price via `get_pool_price`. */
export const EKUBO_CORE_MAINNET = SN.ekuboCore!;
