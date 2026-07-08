import { PublicKey, Transaction, Connection } from '@solana/web3.js';
import { C as Chain } from '../chains-DE8AJMIY.js';
import { V as VenueAdapter, R as RegisterOrderParams, A as AdapterTxResult, O as OrderRef } from '../types-Bjb3YdWI.js';

/**
 * Anchor wire encoding for the Medialane Solana programs — discriminators,
 * a minimal borsh writer for our argument shapes, and the programs' PDAs.
 * Verified against the audited Rust (Solana-MIP-Collections,
 * Solana-Marketplace); no Anchor client dependency.
 */
declare function instructionDiscriminator(name: string): Uint8Array;
declare function eventDiscriminator(name: string): Uint8Array;
/** Minimal borsh writer covering our programs' argument types. */
declare class BorshWriter {
    private chunks;
    u8(v: number): this;
    u16(v: number): this;
    u64(v: bigint): this;
    i64(v: bigint): this;
    string(v: string): this;
    pubkey(v: PublicKey): this;
    option<T>(v: T | null | undefined, write: (value: T) => void): this;
    build(discriminator: Uint8Array): Uint8Array;
}
declare function u64le(v: bigint): Uint8Array;
declare function orderPda(program: PublicKey, offerer: PublicKey, salt: bigint): PublicKey;
declare function counterPda(program: PublicKey, offerer: PublicKey): PublicKey;
declare function settlementPda(program: PublicKey): PublicKey;
declare function registryCounterPda(program: PublicKey): PublicKey;
declare function collectionRecordPda(program: PublicKey, coreCollection: PublicKey): PublicKey;
declare const MPL_CORE_PROGRAM_ID: PublicKey;

/** Wallet-adapter-compatible signer. */
interface SolanaSigner {
    publicKey: PublicKey;
    signTransaction(tx: Transaction): Promise<Transaction>;
}
interface SolanaVenueOptions {
    connection: Connection;
    /** Defaults to the chain registry's marketplace program (populated at deploy). */
    programId?: string;
}
/** The Medialane venue adapter for Solana. The canonical order id is the
 *  order PDA (spec §3.2b). Native SOL is the payment when `paymentToken`
 *  is the "native" sentinel; SPL mints otherwise (bids are SPL-only,
 *  enforced by the program). */
declare class SolanaVenue implements VenueAdapter<SolanaSigner> {
    readonly chain: Chain;
    private readonly connection;
    private readonly program;
    constructor(opts: SolanaVenueOptions);
    registerOrder(signer: SolanaSigner, params: RegisterOrderParams): Promise<AdapterTxResult & {
        orderRef: OrderRef;
    }>;
    fulfillOrder(): Promise<AdapterTxResult>;
    cancelOrder(signer: SolanaSigner, orderRef: OrderRef): Promise<AdapterTxResult>;
    incrementCounter(signer: SolanaSigner): Promise<AdapterTxResult>;
    getOrderDetails(orderRef: OrderRef): Promise<unknown>;
    getCounter(address: string): Promise<bigint>;
    private send;
}

export { BorshWriter, MPL_CORE_PROGRAM_ID, type SolanaSigner, SolanaVenue, type SolanaVenueOptions, collectionRecordPda, counterPda, eventDiscriminator, instructionDiscriminator, orderPda, registryCounterPda, settlementPda, u64le };
