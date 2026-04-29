/** Medialane Protocol ERC-721 marketplace — immutable, no admin key. */
export const MARKETPLACE_721_CONTRACT_MAINNET =
  "0x00f8ccaae0bc811c79605974cc1dab769b9cea8877f033f8e3c17f30457caba6";

/** @deprecated Use MARKETPLACE_721_CONTRACT_MAINNET. */
export const MARKETPLACE_CONTRACT_MAINNET = MARKETPLACE_721_CONTRACT_MAINNET;

/** Class hash of the Medialane Protocol ERC-721 marketplace implementation. */
export const MARKETPLACE_721_CLASS_HASH_MAINNET =
  "0x03dff4f34b976207246207954263be9a28b51390321702443291088dcdf4b2e6";

/** @deprecated Use MARKETPLACE_721_CLASS_HASH_MAINNET. */
export const MARKETPLACE_CLASS_HASH_MAINNET = MARKETPLACE_721_CLASS_HASH_MAINNET;

/** First mainnet block for the current Medialane Protocol ERC-721 deployment. */
export const MARKETPLACE_721_START_BLOCK_MAINNET = 9196722;

/** @deprecated Use MARKETPLACE_721_START_BLOCK_MAINNET. */
export const MARKETPLACE_START_BLOCK_MAINNET = MARKETPLACE_721_START_BLOCK_MAINNET;

/** Medialane Protocol ERC-1155 marketplace — immutable, no admin key. */
export const MARKETPLACE_1155_CONTRACT_MAINNET =
  "0x02bfa521c25461a09d735889b469418608d7d92f8b26e3d37ef174a4c2e22f99";

/** Class hash of the Medialane Protocol ERC-1155 marketplace implementation. */
export const MARKETPLACE_1155_CLASS_HASH_MAINNET =
  "0x01b674aad934be85abc7c1970265cbf7e9bc7d586a90f0a67112c201636dbdd3";

/** First mainnet block for the current Medialane Protocol ERC-1155 deployment. */
export const MARKETPLACE_1155_START_BLOCK_MAINNET = 9260304;

export const COLLECTION_721_CONTRACT_MAINNET =
  "0x05c49ee5d3208a2c2e150fdd0c247d1195ed9ab54fa2d5dea7a633f39e4b205b";

/** @deprecated Use COLLECTION_721_CONTRACT_MAINNET. */
export const COLLECTION_CONTRACT_MAINNET = COLLECTION_721_CONTRACT_MAINNET;

export const DROP_FACTORY_CONTRACT_MAINNET =
  "0x03587f42e29daee1b193f6cf83bf8627908ed6632d0d83fcb26225c50547d800";

export const POP_FACTORY_CONTRACT_MAINNET =
  "0x00b32c34b427d8f346b5843ada6a37bd3368d879fc752cd52b68a87287f60111";

/** NFTComments on-chain comment system — immutable, no admin key. */
export const NFTCOMMENTS_CONTRACT_MAINNET =
  "0x024f97eb5abe659fb650bf162b5fc16501f8f3863a7369901ce6099462e62799";

/** Earliest block required to index the current mainnet protocol deployments. */
export const INDEXER_START_BLOCK_MAINNET = MARKETPLACE_721_START_BLOCK_MAINNET;

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

export const SUPPORTED_NETWORKS = ["mainnet"] as const;
export type Network = (typeof SUPPORTED_NETWORKS)[number];

export const DEFAULT_RPC_URL = "https://rpc.starknet.lava.build";

export const POP_COLLECTION_CLASS_HASH_MAINNET = "0x077c421686f10851872561953ea16898d933364b7f8937a5d7e2b1ba0a36263f";

export const DROP_COLLECTION_CLASS_HASH_MAINNET = "0x00092e72cdb63067521e803aaf7d4101c3e3ce026ae6bc045ec4228027e58282";

/** IP-Programmable-ERC1155-Collections factory. Redeployed 2026-04-16 (v2 — adds base_uri). */
export const COLLECTION_1155_CONTRACT_MAINNET =
  "0x006b2dc7ca7c4f466bb4575ba043d934310f052074f849caf853a86bcb819fd6";

/** @deprecated Use COLLECTION_1155_CONTRACT_MAINNET. */
export const ERC1155_FACTORY_CONTRACT_MAINNET = COLLECTION_1155_CONTRACT_MAINNET;

/** Class hash of the IPCollection ERC-1155 implementation. Redeployed 2026-04-16 (v2). */
export const COLLECTION_1155_CLASS_HASH_MAINNET =
  "0x39a85126c6627db263617e5bce2bb72e49d2bb1f20961efc8b8954665bcfd25";

/** @deprecated Use COLLECTION_1155_CLASS_HASH_MAINNET. */
export const ERC1155_COLLECTION_CLASS_HASH_MAINNET = COLLECTION_1155_CLASS_HASH_MAINNET;
