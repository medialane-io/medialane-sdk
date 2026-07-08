/** Mirrors the backend Prisma `Chain` enum. */
declare const CHAINS: readonly ["STARKNET", "ETHEREUM", "SOLANA", "BASE", "STELLAR", "BITCOIN"];
type Chain = (typeof CHAINS)[number];
/** Starknet coordinates of Medialane services + venues. All fields optional
 *  because not every service exists on every chain. */
interface StarknetCoordinates {
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
    ipTicketsStartBlock?: number;
    ipClubRegistry?: `0x${string}`;
    ipClubNftClassHash?: `0x${string}`;
    ipClubStartBlock?: number;
    ipSponsorship?: `0x${string}`;
    ipSponsorshipStartBlock?: number;
    ipSponsorshipLicense?: `0x${string}`;
}
/** Coordinates per chain. Only STARKNET is populated today; adding a chain
 *  means adding an entry here (litmus test, spec §7). */
/** EVM coordinates — one shape for Ethereum and Base (same bytecode, two
 *  chains). Populated at deploy time (federation Phase 4). */
interface EvmCoordinates {
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
/** Solana coordinates — base58 program ids. Populated at deploy time. */
interface SolanaCoordinates {
    rpcUrl: string;
    mipCollectionsProgram?: string;
    marketplaceProgram?: string;
    startSlot?: number;
}
/** Stellar (Soroban) coordinates — strkey contract ids. Populated at deploy
 *  time; the registry takes the collection WASM hash as a constructor arg. */
interface StellarCoordinates {
    rpcUrl: string;
    mipRegistry?: string;
    marketplace?: string;
    collectionWasmHash?: string;
    startLedger?: number;
}
/** Per-chain coordinate shapes. Every chain is an equal entry — no chain is
 *  privileged in core (chain-sovereignty I2/I4). */
interface CoordinatesByChain {
    STARKNET?: StarknetCoordinates;
    ETHEREUM?: EvmCoordinates;
    BASE?: EvmCoordinates;
    SOLANA?: SolanaCoordinates;
    STELLAR?: StellarCoordinates;
    BITCOIN?: never;
}
/** @deprecated Renamed — use `StarknetCoordinates` (coordinates are per-chain-shaped). */
type ChainCoordinates = StarknetCoordinates;
declare function getCoordinates(chain: "STARKNET"): StarknetCoordinates;
declare function getCoordinates(chain: "ETHEREUM" | "BASE"): EvmCoordinates;
declare function getCoordinates(chain: "SOLANA"): SolanaCoordinates;
declare function getCoordinates(chain: "STELLAR"): StellarCoordinates;
declare function getCoordinates(chain: Chain): StarknetCoordinates | EvmCoordinates | SolanaCoordinates | StellarCoordinates;
declare const DEFAULT_CHAIN: Chain;
/** Typed Starknet coordinates for Starknet-only modules; throws when the
 *  client is scoped to another chain. */
declare function getStarknetCoordinates(chain: Chain): StarknetCoordinates;

export { type Chain as C, DEFAULT_CHAIN as D, type EvmCoordinates as E, type SolanaCoordinates as S, CHAINS as a, type ChainCoordinates as b, type CoordinatesByChain as c, type StarknetCoordinates as d, type StellarCoordinates as e, getStarknetCoordinates as f, getCoordinates as g };
