// Single source of per-chain coordinates for Medialane's own services
// (spec 2026-06-13 §3.1, Decision A). Keyed by CHAIN ALONE — Medialane is
// mainnet-only, so there is no network axis (refines decisions.md D-9).

/** Mirrors the backend Prisma `Chain` enum. */
export const CHAINS = ["STARKNET", "ETHEREUM", "SOLANA", "BASE", "BITCOIN"] as const;
export type Chain = (typeof CHAINS)[number];

/** Per-chain on-chain coordinates of Medialane services + venues. All fields
 *  optional because not every service exists on every chain. */
export interface ChainCoordinates {
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
}

/** Coordinates per chain. Only STARKNET is populated today; adding a chain
 *  means adding an entry here (litmus test, spec §7). */
const COORDINATES: Partial<Record<Chain, ChainCoordinates>> = {
  STARKNET: {
    rpcUrl: "https://rpc.starknet.lava.build",
    marketplace721: "0x069cf5391077e3ebdd9cb6aebf90ed530d29f0d6aa34a43f5afae938c0fb565e",
    marketplace721ClassHash: "0x04c6f952d747ad7ead1b3dad4c1d587837d38f8ec29d6c095a4afa5b5ece5957",
    marketplace721StartBlock: 10350340,
    marketplace1155: "0x040cd7b3e73bb3c892166e34bdc01d1797f97ecbc356c23f1cf38033cacf0077",
    marketplace1155ClassHash: "0x02600bb720908f119afe482309d36c39d087587f0df9576454acfb6363e78cd8",
    marketplace1155StartBlock: 10350855,
    collection721: "0x0558c9b6ea4d403df6d765fb77be55702c572f0a811f037c6c4209fe1e5aeef2",
    collection721StartBlock: 11002817,
    ipNftClassHash: "0x040551f0d009a6d665ddff980a375dfccc71a8928c8bfcc9ab56244bc4464fab",
    ipCollectionClassHash: "0x063d4ac4ae317fd155216bf1b8a4d3a63172ff72965b9ac48dd5add0c2d32b70",
    collection1155: "0x0083543c3ee15040a419fc539fa6889f5b956e7d071bcfa97842cb0ae42ad6cc",
    collection1155FactoryClassHash: "0x331a69da8655a882ba1fbcb55188b8fa09116521db901bbbaafc9fead0689f8",
    collection1155ClassHash: "0x4e110b59af240ae6c7742999964c4eae13fb2ed935c47fe97653ec017ebea34",
    collection1155StartBlock: 10665319,
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
  },
};

export function getCoordinates(chain: Chain): ChainCoordinates {
  const c = COORDINATES[chain];
  if (!c) throw new Error(`No coordinates configured for chain "${chain}"`);
  return c;
}

export const DEFAULT_CHAIN: Chain = "STARKNET";
