import { getCoordinates } from "./chains.js";

const SN = getCoordinates("STARKNET");

export const STARKNET_MARKETPLACE_721_CONTRACT = SN.marketplace721!;
export const STARKNET_MARKETPLACE_721_CLASS_HASH = SN.marketplace721ClassHash!;
export const STARKNET_MARKETPLACE_721_START_BLOCK = SN.marketplace721StartBlock!;
export const STARKNET_MARKETPLACE_1155_CONTRACT = SN.marketplace1155!;
export const STARKNET_MARKETPLACE_1155_CLASS_HASH = SN.marketplace1155ClassHash!;
export const STARKNET_MARKETPLACE_1155_START_BLOCK = SN.marketplace1155StartBlock!;

export const STARKNET_COLLECTION_721_CONTRACT = SN.collection721!;
export const STARKNET_COLLECTION_721_START_BLOCK = SN.collection721StartBlock!;
export const STARKNET_IPNFT_CLASS_HASH = SN.ipNftClassHash!;
export const STARKNET_IPCOLLECTION_CLASS_HASH = SN.ipCollectionClassHash!;
export const STARKNET_COLLECTION_1155_CONTRACT = SN.collection1155!;
export const STARKNET_COLLECTION_1155_FACTORY_CLASS_HASH = SN.collection1155FactoryClassHash!;
export const STARKNET_COLLECTION_1155_CLASS_HASH = SN.collection1155ClassHash!;
export const STARKNET_COLLECTION_1155_START_BLOCK = SN.collection1155StartBlock!;

export const STARKNET_POP_FACTORY_CONTRACT = SN.popFactory!;
export const STARKNET_POP_COLLECTION_CLASS_HASH = SN.popCollectionClassHash!;
export const STARKNET_DROP_FACTORY_CONTRACT = SN.dropFactory!;
export const STARKNET_DROP_COLLECTION_CLASS_HASH = SN.dropCollectionClassHash!;
export const STARKNET_NFTCOMMENTS_CONTRACT = SN.nftComments!;

export const STARKNET_IP_TICKETS_FACTORY_CONTRACT = SN.ipTicketsFactory!;
export const STARKNET_IP_TICKET_COLLECTION_CLASS_HASH = SN.ipTicketCollectionClassHash!;
export const STARKNET_IP_CLUB_FACTORY_CONTRACT = SN.ipClubFactory!;
export const STARKNET_IP_CLUB_COLLECTION_CLASS_HASH = SN.ipClubCollectionClassHash!;
export const STARKNET_IP_SPONSORSHIP_CONTRACT = SN.ipSponsorship!;
export const STARKNET_IP_SPONSORSHIP_CLASS_HASH = SN.ipSponsorshipClassHash!;

export const STARKNET_MEDIAWALLET_CLASS_HASH = SN.mediaWalletClassHash!;

export const STARKNET_CREATOR_COIN_FACTORY_CONTRACT = SN.creatorCoinFactory!;
export const STARKNET_CREATOR_COIN_EKUBO_LAUNCHER = SN.creatorCoinEkuboLauncher!;
export const STARKNET_CREATOR_COIN_CLASS_HASH = SN.creatorCoinClassHash!;
export const STARKNET_CREATOR_COIN_FACTORY_CLASS_HASH = SN.creatorCoinFactoryClassHash!;
export const STARKNET_CREATOR_COIN_START_BLOCK = SN.creatorCoinStartBlock!;

export const STARKNET_GENESIS_MINT_LAUNCH_CONTRACT = SN.genesisMintLaunch!;
export const STARKNET_GENESIS_MINT_BR_CONTRACT = SN.genesisMintBR!;
export const STARKNET_GENESIS_MINT_GLOBAL_CONTRACT = SN.genesisMintGlobal!;
export const STARKNET_EKUBO_CORE = SN.ekuboCore!;

export const SUPPORTED_TOKENS = [
  {

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

export const DEFAULT_CURRENCY: SupportedTokenSymbol = "USDC";
