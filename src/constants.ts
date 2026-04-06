export const MARKETPLACE_CONTRACT_MAINNET =
  "0x0234f4e8838801ebf01d7f4166d42aed9a55bc67c1301162decf9e2040e05f16";

export const COLLECTION_CONTRACT_MAINNET =
  "0x05e73b7be06d82beeb390a0e0d655f2c9e7cf519658e04f05d9c690ccc41da03";

export const DROP_FACTORY_CONTRACT_MAINNET =
  "0x03587f42e29daee1b193f6cf83bf8627908ed6632d0d83fcb26225c50547d800";

export const POP_FACTORY_CONTRACT_MAINNET =
  "0x00b32c34b427d8f346b5843ada6a37bd3368d879fc752cd52b68a87287f60111";

// Sepolia testnet contracts (empty = not yet deployed)
export const MARKETPLACE_CONTRACT_SEPOLIA = "";
export const COLLECTION_CONTRACT_SEPOLIA = "";

export const INDEXER_START_BLOCK_MAINNET = 6204232;

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

export const SUPPORTED_NETWORKS = ["mainnet", "sepolia"] as const;
export type Network = (typeof SUPPORTED_NETWORKS)[number];

export const DEFAULT_RPC_URLS: Record<Network, string> = {
  mainnet: "https://rpc.starknet.lava.build",
  sepolia: "https://rpc.starknet-sepolia.lava.build",
};

export const POP_COLLECTION_CLASS_HASH_MAINNET = "0x077c421686f10851872561953ea16898d933364b7f8937a5d7e2b1ba0a36263f";

export const DROP_COLLECTION_CLASS_HASH_MAINNET = "0x00092e72cdb63067521e803aaf7d4101c3e3ce026ae6bc045ec4228027e58282";
