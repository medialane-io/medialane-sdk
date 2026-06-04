/** Medialane721 marketplace venue — immutable, ownerless (redesign, deployed 2026-05-31). */
export const MARKETPLACE_721_CONTRACT_MAINNET =
  "0x069cf5391077e3ebdd9cb6aebf90ed530d29f0d6aa34a43f5afae938c0fb565e";

/** Class hash of the Medialane721 venue. */
export const MARKETPLACE_721_CLASS_HASH_MAINNET =
  "0x04c6f952d747ad7ead1b3dad4c1d587837d38f8ec29d6c095a4afa5b5ece5957";

/** First mainnet block for the Medialane721 venue deployment. */
export const MARKETPLACE_721_START_BLOCK_MAINNET = 10350340;

/** Medialane1155 marketplace venue — immutable, ownerless (redesign, deployed 2026-05-31). */
export const MARKETPLACE_1155_CONTRACT_MAINNET =
  "0x040cd7b3e73bb3c892166e34bdc01d1797f97ecbc356c23f1cf38033cacf0077";

/** Class hash of the Medialane1155 venue. */
export const MARKETPLACE_1155_CLASS_HASH_MAINNET =
  "0x02600bb720908f119afe482309d36c39d087587f0df9576454acfb6363e78cd8";

/** First mainnet block for the Medialane1155 venue deployment. */
export const MARKETPLACE_1155_START_BLOCK_MAINNET = 10350855;

export const COLLECTION_721_CONTRACT_MAINNET =
  "0x0322cb7119955e01ac778d40976eb3ba50540bb0899f812d612f9c7e63e49fd2";

/** Class hash of the IPNft (per-collection ERC-721) implementation. */
export const IPNFT_CLASS_HASH_MAINNET =
  "0x27ee4ded786d51bced1e94afec3034d6ffce71c032c45ee1ff283ccfa9db12e";

/** Class hash of the IPCollection registry. */
export const IPCOLLECTION_CLASS_HASH_MAINNET =
  "0x287ccdff8b6655a2248cfe170d82eae3a35303cd00ef3e751b25ddca26d9095";

/** First mainnet block for the current MIP IPCollection registry deployment. */
export const COLLECTION_721_START_BLOCK_MAINNET = 10046166;

export const DROP_FACTORY_CONTRACT_MAINNET =
  "0x03587f42e29daee1b193f6cf83bf8627908ed6632d0d83fcb26225c50547d800";

export const POP_FACTORY_CONTRACT_MAINNET =
  "0x00b32c34b427d8f346b5843ada6a37bd3368d879fc752cd52b68a87287f60111";

/** NFTComments on-chain comment system — immutable, no admin key. */
export const NFTCOMMENTS_CONTRACT_MAINNET =
  "0x02cdac70c94447189af0389dfea63f4d5e4154ea8a563de288a5ab1c39e37843";

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

export const COLLECTION_1155_CONTRACT_MAINNET =
  "0x067064adcaaed61e17bf50ea802ea6482336126aec5b4d032b4ff8fbb5009131";

/** Class hash of the IPCollectionFactory implementation. */
export const COLLECTION_1155_FACTORY_CLASS_HASH_MAINNET =
  "0x188321a7c9ca972cc63e352e3b3a4cdf33781852d957f4b4b62249310fe4c75";

/** Class hash of the IPCollection ERC-1155 implementation. */
export const COLLECTION_1155_CLASS_HASH_MAINNET =
  "0x281e13803c906f20bbe158efb44b7a0273c56fdebbeeb55b2ba59530ddb1c80";

/** First mainnet block for the current ERC-1155 factory deployment. */
export const COLLECTION_1155_START_BLOCK_MAINNET = 10045611;

// ─── Creator Coin ────────────────────────────────────────────────────────────
// Faithful fork of unruggable.meme, Ekubo-only, deployed mainnet 2026-06-04.

/** Creator Coin Factory — entrypoint: create_creator_coin + launch_on_ekubo. */
export const CREATOR_COIN_FACTORY_CONTRACT_MAINNET =
  "0x50fa807b5274079fb19374673d7bab6d2dc3af7e1032ea43eb6e44bcbde4c3c";

/** EkuboLauncher — permanently holds (locks) each Creator Coin's LP position. */
export const CREATOR_COIN_EKUBO_LAUNCHER_MAINNET =
  "0x4f7fceb5ac10f12f9544a09580592e5bdf1b7f04f48765eecf12286d8ccb7b4";

/** Class hash of the per-coin CreatorCoin ERC-20 the Factory deploys. */
export const CREATOR_COIN_CLASS_HASH_MAINNET =
  "0x743e4c8a5b96bb83bbf4af04edbbb482d5ece89eed9b729a79fb7df0cd0b6b6";

/** Class hash of the Creator Coin Factory. */
export const CREATOR_COIN_FACTORY_CLASS_HASH_MAINNET =
  "0x51765926b1344c9a20b8cd4b5abe7b7d47375ae97cf6804db3ea5d4b05a9b55";

/** First mainnet block of the Factory deployment. */
export const CREATOR_COIN_START_BLOCK_MAINNET = 10474544;
