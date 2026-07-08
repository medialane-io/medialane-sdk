import { C as Chain } from './chains-DE8AJMIY.js';

/**
 * Chain-neutral adapter interfaces — the target surface every chain adapter
 * (`@medialane/sdk/starknet`, `/evm`, `/solana`, `/stellar`) implements, so
 * apps can transact against a chain-tagged asset without knowing the chain
 * (chain-sovereignty I2/I4; platform-federation spec §2.2). `Signer` is the
 * chain's wallet/account handle (starknet.js AccountInterface, a viem wallet
 * client, a Solana signer, a Stellar signer) — adapters fix the type.
 */
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
    /** Base-unit amount as a decimal string. */
    amount: string;
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
    }): Promise<AdapterTxResult>;
    cancelOrder(signer: Signer, orderRef: OrderRef): Promise<AdapterTxResult>;
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

export type { AdapterTxResult as A, CreateCollectionInput as C, IssuanceAdapter as I, MintInput as M, OrderRef as O, RegisterOrderParams as R, VenueAdapter as V, AssetRef as a };
