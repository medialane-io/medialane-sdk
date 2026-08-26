

export const CHAINS = ["STARKNET", "ETHEREUM", "SOLANA", "BASE", "STELLAR", "BITCOIN"] as const;
export type Chain = (typeof CHAINS)[number];

export interface StarknetCoordinates {
  rpcUrl: string;
  marketplace721?: `0x${string}`;
  marketplace721ClassHash?: `0x${string}`;
  marketplace721StartBlock?: number;
  marketplace1155?: `0x${string}`;
  marketplace1155ClassHash?: `0x${string}`;
  marketplace1155StartBlock?: number;
  collection721?: `0x${string}`;
  collection721StartBlock?: number;
  ipNftClassHash?: `0x${string}`;
  ipCollectionClassHash?: `0x${string}`;
  collection1155?: `0x${string}`;
  collection1155FactoryClassHash?: `0x${string}`;
  collection1155ClassHash?: `0x${string}`;
  collection1155StartBlock?: number;
  popFactory?: `0x${string}`;
  popCollectionClassHash?: `0x${string}`;
  dropFactory?: `0x${string}`;
  dropCollectionClassHash?: `0x${string}`;
  nftComments?: `0x${string}`;
  creatorCoinFactory?: `0x${string}`;
  creatorCoinEkuboLauncher?: `0x${string}`;
  creatorCoinClassHash?: `0x${string}`;
  creatorCoinFactoryClassHash?: `0x${string}`;
  creatorCoinStartBlock?: number;
  ekuboCore?: `0x${string}`;
  ipTicketsFactory?: `0x${string}`;
  ipTicketCollectionClassHash?: `0x${string}`;
  ipTicketsFactoryClassHash?: `0x${string}`;
  ipTicketsStartBlock?: number;
  ipClubFactory?: `0x${string}`;
  ipClubFactoryClassHash?: `0x${string}`;
  ipClubCollectionClassHash?: `0x${string}`;
  ipClubFactoryStartBlock?: number;
  ipSponsorship?: `0x${string}`;
  ipSponsorshipClassHash?: `0x${string}`;
  ipSponsorshipStartBlock?: number;
  mediaWalletClassHash?: `0x${string}`;
  genesisMintLaunch?: `0x${string}`;
  genesisMintBR?: `0x${string}`;
  genesisMintGlobal?: `0x${string}`;
}

export interface EvmCoordinates {
  rpcUrl: string;
  marketplace721?: `0x${string}`;
  marketplace721StartBlock?: number;
  marketplace1155?: `0x${string}`;
  marketplace1155StartBlock?: number;
  mipRegistry?: `0x${string}`;
  mipRegistryStartBlock?: number;
  mipEditionsRegistry?: `0x${string}`;
  mipEditionsRegistryStartBlock?: number;
}

export interface SolanaCoordinates {
  rpcUrl: string;
  mipCollectionsProgram?: string;
  marketplaceProgram?: string;
  startSlot?: number;
}

export interface StellarCoordinates {
  rpcUrl: string;
  mipRegistry?: string;
  marketplace?: string;
  collectionWasmHash?: string;
  startLedger?: number;
}

export interface CoordinatesByChain {
  STARKNET?: StarknetCoordinates;
  ETHEREUM?: EvmCoordinates;
  BASE?: EvmCoordinates;
  SOLANA?: SolanaCoordinates;
  STELLAR?: StellarCoordinates;
  BITCOIN?: never;
}

export type ChainCoordinates = StarknetCoordinates;

const COORDINATES: CoordinatesByChain = {
  STARKNET: {
    rpcUrl: "https://rpc.starknet.lava.build",
    marketplace721: "0x03eda9a2b6ad90845a43591bac8083ebaf677d51fdf20f503b2c01889e3131fc",
    marketplace721ClassHash: "0x0700d9230d07e5203e27778c0dc70f9134d2b25bf319f7cf8348dc66a6923e90",
    marketplace721StartBlock: 11198146,
    marketplace1155: "0x07c4ce1c19ea48cc11135ed22b19ff745f5aec508c3828593002e4f76fdb1b38",
    marketplace1155ClassHash: "0x0242f5c388da7cee2d99e2a69453c8159bf927fbec4e797a3cfdcbbcb5b68328",
    marketplace1155StartBlock: 11198267,
    collection721: "0x0225c3ae09506b8d97adc39649ca740dad5aac195b7f5f0441cc1852947acaea",
    collection721StartBlock: 11198496,
    ipNftClassHash: "0x012d3ae40ba35c7e2be0946532dac60e48932447912fdf96b674da67c029b9cc",
    ipCollectionClassHash: "0x022155a1a130a40e57aac4b89c07fab3f616bc351b1270fc40f756b963afe8b4",
    collection1155: "0x015368976d46fae5bfa1c58600f641d5aa5dbbf53ebc6b78aa3922194aad3551",
    collection1155FactoryClassHash: "0x04eb6b419770f13bd191f120b9fc9ee624c0613ad4490062d293ca2016b3b1d2",
    collection1155ClassHash: "0x06cf3f5a2322dac35e07a6064a5b8802f19fda8aa3f4726f0cb7bc05dea1bd78",
    collection1155StartBlock: 11199527,
    popFactory: "0x00b32c34b427d8f346b5843ada6a37bd3368d879fc752cd52b68a87287f60111",
    popCollectionClassHash: "0x077c421686f10851872561953ea16898d933364b7f8937a5d7e2b1ba0a36263f",
    dropFactory: "0x03587f42e29daee1b193f6cf83bf8627908ed6632d0d83fcb26225c50547d800",
    dropCollectionClassHash: "0x00092e72cdb63067521e803aaf7d4101c3e3ce026ae6bc045ec4228027e58282",
    nftComments: "0x02cdac70c94447189af0389dfea63f4d5e4154ea8a563de288a5ab1c39e37843",
    creatorCoinFactory: "0x50fa807b5274079fb19374673d7bab6d2dc3af7e1032ea43eb6e44bcbde4c3c",
    creatorCoinEkuboLauncher: "0x4f7fceb5ac10f12f9544a09580592e5bdf1b7f04f48765eecf12286d8ccb7b4",
    creatorCoinClassHash: "0x743e4c8a5b96bb83bbf4af04edbbb482d5ece89eed9b729a79fb7df0cd0b6b6",
    creatorCoinFactoryClassHash: "0x51765926b1344c9a20b8cd4b5abe7b7d47375ae97cf6804db3ea5d4b05a9b55",
    creatorCoinStartBlock: 10474544,
    ekuboCore: "0x00000005dd3d2f4429af886cd1a3b08289dbcea99a294197e9eb43b0e0325b4b",
    ipTicketsFactory: "0x0767bf5b57e1f812463159b5ed683183e1b0c3f942b74871b5c6cd6a93c15e99",
    ipTicketCollectionClassHash: "0x0449e8eb7c117740d07cb8e0157d32c8ba3d19d1cfd2784ed5e139f5a1e04acc",
    ipTicketsFactoryClassHash: "0x04a739ac3a673ebd0db96bb24475600797c3ed34827e79517f9b2b1640276e6a",
    ipTicketsStartBlock: 11933694,
    ipClubFactory: "0x06a0b0be16d70c78f2e18119dbf90e5911cbfd5d8d484bc555dc61d96f56a2b9",
    ipClubFactoryClassHash: "0x05d9d431bd3532b1fa4d5bab572f49c5ad8034ee3cc83951aa41ae82c9cad266",
    ipClubCollectionClassHash: "0x05b8477c72e6bf0cf64967d71155021fd4d77d9a57e8805c6b40709121c002c5",
    ipClubFactoryStartBlock: 11928775,

    ipSponsorship: "0x03729ebe0fedf29ec97fca34db09174772af7f870af26a26e024a61040143e5c",
    ipSponsorshipClassHash: "0x0626daac2ed7e2bf630ef5b10104b3202db1559216c0c1a504c0e99be2fbfec3",
    ipSponsorshipStartBlock: 11896456,
    mediaWalletClassHash: "0x014b210c7d47392691144bafecdca3c6c7791cc295ea305988da0a724c05ac31",
    genesisMintLaunch: "0x06ed61abba98a44d45bed2c4b1a456df15053c3321cfd6e007afb33b7226c9f0",
    genesisMintBR: "0x01f8b92e3b9e963b8eacb075207e2cc89d4614ff2ac6c2702c7ae10ad19a9db8",
    genesisMintGlobal: "0x06ad4d55ed2d12ad5d6d55587d800874ef807b051bfefe13497e60ec5b019369",
  },
};

export function getCoordinates(chain: "STARKNET"): StarknetCoordinates;
export function getCoordinates(chain: "ETHEREUM" | "BASE"): EvmCoordinates;
export function getCoordinates(chain: "SOLANA"): SolanaCoordinates;
export function getCoordinates(chain: "STELLAR"): StellarCoordinates;
export function getCoordinates(
  chain: Chain,
): StarknetCoordinates | EvmCoordinates | SolanaCoordinates | StellarCoordinates;
export function getCoordinates(
  chain: Chain,
): StarknetCoordinates | EvmCoordinates | SolanaCoordinates | StellarCoordinates {
  const c = COORDINATES[chain];
  if (!c) throw new Error(`No coordinates configured for chain "${chain}"`);
  return c;
}

export const DEFAULT_CHAIN: Chain = "STARKNET";

export function getStarknetCoordinates(chain: Chain): StarknetCoordinates {
  if (chain !== "STARKNET") {
    throw new Error(`This module is Starknet-only (client chain: "${chain}")`);
  }
  return getCoordinates("STARKNET");
}
