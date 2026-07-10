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
    ipClubFactory?: `0x${string}`;
    ipClubFactoryClassHash?: `0x${string}`;
    ipClubCollectionClassHash?: `0x${string}`;
    ipClubFactoryStartBlock?: number;
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

/**
 * Chain-neutral adapter interfaces — the target surface every chain adapter
 * (`@medialane/sdk/starknet`, `/evm`, `/solana`, `/stellar`) implements, so
 * apps can transact against a chain-tagged asset without knowing the chain
 * (chain-sovereignty I2/I4; platform-federation spec §2.2). `Signer` is the
 * chain's `VenueSigner` capability port (see {@link VenueSigner}), not a raw
 * account — the app implements it over its own wallet layer.
 */
/**
 * A chain-neutral capability port the app implements over its own wallet layer.
 * The adapter orchestrates with only these three capabilities — it never holds a
 * chain account or an execution provider. Confirmation lives behind `execute`
 * (the app awaits + revert-detects the receipt before resolving), so there is no
 * separate receipt method: a resolved `execute` means "on-chain, not reverted".
 * `TypedData`/`Call` are the chain's native shapes (Starknet: SNIP-12 typed data
 * and `{ contractAddress, entrypoint, calldata }`); the signature is `string[]`
 * (Starknet felt array).
 */
interface VenueSigner<TypedData = unknown, Call = unknown> {
    readonly address: string;
    signTypedData(data: TypedData): Promise<string[]>;
    execute(calls: Call[]): Promise<{
        txHash: string;
    }>;
}
/** A chain-tagged asset reference — the working asset identity `(chain, contract, tokenId)`. */
interface AssetRef {
    chain: Chain;
    contract: string;
    tokenId: string;
}
/** Canonical order identity per chain (platform-federation spec §3.2b):
 *  Starknet/EVM = the typed-data digest; Solana = the order PDA address;
 *  Stellar = a stable digest of (contract, offerer, salt). */
type OrderRef = string;
interface RegisterOrderParams {
    asset: AssetRef;
    /** "listing" offers the asset; "bid" offers payment. */
    side: "listing" | "bid";
    /** Payment token in the chain's canonical address form; adapters define the
     *  native-currency sentinel where the chain has one. */
    paymentToken: string;
    /** Per-unit price in base units, as a decimal string. For single-item (721)
     *  orders this is the whole price; for multi-unit (1155) orders it is the price
     *  per unit and the total is `amount × quantity`. */
    amount: string;
    /** Units offered — 1155 only; defaults to "1" (and is inert for 721). */
    quantity?: string;
    royaltyMaxBps: number;
    startTime: number;
    /** 0 = no expiry. */
    endTime: number;
    salt: string;
}
interface AdapterTxResult {
    txHash: string;
}
interface VenueAdapter<Signer> {
    readonly chain: Chain;
    registerOrder(signer: Signer, params: RegisterOrderParams): Promise<AdapterTxResult & {
        orderRef: OrderRef;
    }>;
    fulfillOrder(signer: Signer, orderRef: OrderRef, opts?: {
        quantity?: string;
    } & Record<string, string | undefined>): Promise<AdapterTxResult>;
    cancelOrder(signer: Signer, orderRef: OrderRef, opts?: Record<string, string | undefined>): Promise<AdapterTxResult>;
    incrementCounter(signer: Signer): Promise<AdapterTxResult>;
    getOrderDetails(orderRef: OrderRef): Promise<unknown>;
    getCounter(address: string): Promise<bigint>;
}
interface CreateCollectionInput {
    name: string;
    symbol: string;
    baseUri: string;
    royaltyBps: number;
}
interface MintInput {
    collection: string;
    recipient: string;
    tokenUri: string;
}
interface IssuanceAdapter<Signer> {
    readonly chain: Chain;
    createCollection(signer: Signer, params: CreateCollectionInput): Promise<AdapterTxResult & {
        collection: string;
    }>;
    mint(signer: Signer, params: MintInput): Promise<AdapterTxResult & {
        tokenId: string;
    }>;
    batchMint(signer: Signer, params: {
        collection: string;
        recipients: string[];
        tokenUris: string[];
    }): Promise<AdapterTxResult>;
}

export { type AdapterTxResult as A, type Chain as C, DEFAULT_CHAIN as D, type EvmCoordinates as E, type IssuanceAdapter as I, type MintInput as M, type OrderRef as O, type RegisterOrderParams as R, type SolanaCoordinates as S, type VenueAdapter as V, type AssetRef as a, CHAINS as b, type ChainCoordinates as c, type CoordinatesByChain as d, type CreateCollectionInput as e, type StarknetCoordinates as f, type StellarCoordinates as g, type VenueSigner as h, getCoordinates as i, getStarknetCoordinates as j };
