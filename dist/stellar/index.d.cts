import { rpc } from '@stellar/stellar-sdk';
import { V as VenueAdapter, C as Chain, R as RegisterOrderParams, A as AdapterTxResult, O as OrderRef } from '../types-V6imkXvR.cjs';

/** Signer shape: the account's public key + a transaction signer (a wallet
 *  kit or a Keypair-backed callback). */
interface StellarSigner {
    publicKey: string;
    signTransaction(xdr: string, networkPassphrase: string): Promise<string>;
}
interface StellarVenueOptions {
    server: rpc.Server;
    networkPassphrase: string;
    /** Defaults to the chain registry's venue contract (populated at deploy). */
    contractId?: string;
    baseFee?: string;
}
/** Canonical order id on Stellar (spec §3.2b): a stable hex digest of
 *  (contract, offerer, salt) — orders are storage-keyed, not hashed on-chain. */
declare function stellarOrderRef(contractId: string, offerer: string, salt: bigint): OrderRef;
/** The Medialane venue adapter for Stellar (Soroban). Both directions settle
 *  in any SEP-41 token including native XLM (the native SAC) — the chain with
 *  no native-bid restriction. */
declare class StellarVenue implements VenueAdapter<StellarSigner> {
    readonly chain: Chain;
    private readonly server;
    private readonly passphrase;
    private readonly contract;
    private readonly contractId;
    private readonly baseFee;
    constructor(opts: StellarVenueOptions);
    registerOrder(signer: StellarSigner, params: RegisterOrderParams): Promise<AdapterTxResult & {
        orderRef: OrderRef;
    }>;
    fulfillOrder(signer: StellarSigner, _orderRef: OrderRef, opts?: {
        offerer?: string;
        salt?: string;
    }): Promise<AdapterTxResult>;
    cancelOrder(signer: StellarSigner, _orderRef: OrderRef, opts?: {
        salt?: string;
    }): Promise<AdapterTxResult>;
    incrementCounter(signer: StellarSigner): Promise<AdapterTxResult>;
    getOrderDetails(_orderRef: OrderRef): Promise<unknown>;
    getOrder(offerer: string, salt: bigint): Promise<unknown>;
    getCounter(address: string): Promise<bigint>;
    private view;
    private invoke;
}

export { type StellarSigner, StellarVenue, type StellarVenueOptions, stellarOrderRef };
