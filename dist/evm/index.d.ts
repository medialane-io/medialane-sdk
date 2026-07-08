import { TypedDataDomain, WalletClient, PublicClient } from 'viem';
import { C as Chain } from '../chains-DE8AJMIY.js';
import { V as VenueAdapter, R as RegisterOrderParams, A as AdapterTxResult, O as OrderRef, I as IssuanceAdapter, C as CreateCollectionInput, M as MintInput } from '../types-Bjb3YdWI.js';

/**
 * EIP-712 order typing for the Medialane EVM venues — byte-identical to the
 * audited Solidity (contracts/EVM-Marketplace-ERC721/src/Medialane721.sol and
 * the 1155 venue, which shares the type strings; the domain's
 * verifyingContract separates deployments and venues).
 */
declare const EVM_ORDER_TYPES: {
    readonly OfferItem: readonly [{
        readonly name: "itemType";
        readonly type: "uint8";
    }, {
        readonly name: "token";
        readonly type: "address";
    }, {
        readonly name: "identifier";
        readonly type: "uint256";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }];
    readonly ConsiderationItem: readonly [{
        readonly name: "itemType";
        readonly type: "uint8";
    }, {
        readonly name: "token";
        readonly type: "address";
    }, {
        readonly name: "identifier";
        readonly type: "uint256";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
    }, {
        readonly name: "recipient";
        readonly type: "address";
    }];
    readonly OrderParameters: readonly [{
        readonly name: "offerer";
        readonly type: "address";
    }, {
        readonly name: "offer";
        readonly type: "OfferItem";
    }, {
        readonly name: "consideration";
        readonly type: "ConsiderationItem";
    }, {
        readonly name: "royaltyMaxBps";
        readonly type: "uint256";
    }, {
        readonly name: "startTime";
        readonly type: "uint256";
    }, {
        readonly name: "endTime";
        readonly type: "uint256";
    }, {
        readonly name: "salt";
        readonly type: "uint256";
    }, {
        readonly name: "counter";
        readonly type: "uint256";
    }];
};
/** NATIVE=0, ERC20=1, ERC721=2 on the 721 venue; NATIVE=0, ERC20=1, ERC1155=2 on the 1155 venue. */
type EvmItemType = 0 | 1 | 2;
interface EvmOfferItem {
    itemType: EvmItemType;
    token: `0x${string}`;
    identifier: bigint;
    amount: bigint;
}
interface EvmConsiderationItem extends EvmOfferItem {
    recipient: `0x${string}`;
}
interface EvmOrderParameters {
    offerer: `0x${string}`;
    offer: EvmOfferItem;
    consideration: EvmConsiderationItem;
    royaltyMaxBps: bigint;
    startTime: bigint;
    endTime: bigint;
    salt: bigint;
    counter: bigint;
}
declare function evmOrderDomain(chainId: number, verifyingContract: `0x${string}`): TypedDataDomain;
/** The order's EIP-712 digest — the venue's order hash and the platform's
 *  canonical order id on EVM chains. */
declare function evmOrderDigest(chainId: number, verifyingContract: `0x${string}`, parameters: EvmOrderParameters): `0x${string}`;

type EvmChain = "ETHEREUM" | "BASE";
interface EvmVenueOptions {
    chain: EvmChain;
    chainId: number;
    publicClient: PublicClient;
    /** "721" (unique assets) or "1155" (partial fills). */
    variant: "721" | "1155";
    /** Defaults to the chain registry's venue address (populated at deploy). */
    contract?: `0x${string}`;
}
/** The Medialane venue adapter for EVM chains — one implementation serves
 *  Ethereum and Base (same bytecode; the EIP-712 domain separates them). */
declare class EvmVenue implements VenueAdapter<WalletClient> {
    readonly chain: Chain;
    private readonly chainId;
    private readonly contract;
    private readonly publicClient;
    private readonly variant;
    constructor(opts: EvmVenueOptions);
    /** Builds the order struct, signs the EIP-712 digest, and registers it.
     *  The digest is the canonical order id on EVM chains. */
    registerOrder(signer: WalletClient, params: RegisterOrderParams): Promise<AdapterTxResult & {
        orderRef: OrderRef;
    }>;
    fulfillOrder(signer: WalletClient, orderRef: OrderRef, opts?: {
        quantity?: string;
        value?: string;
    }): Promise<AdapterTxResult>;
    cancelOrder(signer: WalletClient, orderRef: OrderRef): Promise<AdapterTxResult>;
    incrementCounter(signer: WalletClient): Promise<AdapterTxResult>;
    getOrderDetails(orderRef: OrderRef): Promise<unknown>;
    getCounter(address: string): Promise<bigint>;
}
/** Payment-token sentinel for native ETH (spec §3.2b currency encoding). */
declare const NATIVE_SENTINEL = "native";

/** Minimal venue ABI — verified against Medialane721.sol / Medialane1155.sol.
 *  The 1155 venue's fulfillOrder additionally takes a quantity. */
declare const EvmVenueABI: readonly [{
    readonly name: "registerOrder";
    readonly type: "function";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly type: "tuple";
        readonly components: readonly [{
            readonly type: "address";
            readonly name: "offerer";
        }, {
            readonly name: "offer";
            readonly type: "tuple";
            readonly components: readonly [{
                readonly type: "uint8";
                readonly name: "itemType";
            }, {
                readonly type: "address";
                readonly name: "token";
            }, {
                readonly type: "uint256";
                readonly name: "identifier";
            }, {
                readonly type: "uint256";
                readonly name: "amount";
            }];
        }, {
            readonly name: "consideration";
            readonly type: "tuple";
            readonly components: readonly [{
                readonly type: "uint8";
                readonly name: "itemType";
            }, {
                readonly type: "address";
                readonly name: "token";
            }, {
                readonly type: "uint256";
                readonly name: "identifier";
            }, {
                readonly type: "uint256";
                readonly name: "amount";
            }, {
                readonly type: "address";
                readonly name: "recipient";
            }];
        }, {
            readonly type: "uint256";
            readonly name: "royaltyMaxBps";
        }, {
            readonly type: "uint256";
            readonly name: "startTime";
        }, {
            readonly type: "uint256";
            readonly name: "endTime";
        }, {
            readonly type: "uint256";
            readonly name: "salt";
        }, {
            readonly type: "uint256";
            readonly name: "counter";
        }];
        readonly name: "parameters";
    }, {
        readonly type: "bytes";
        readonly name: "signature";
    }];
    readonly outputs: readonly [];
}, {
    readonly name: "fulfillOrder";
    readonly type: "function";
    readonly stateMutability: "payable";
    readonly inputs: readonly [{
        readonly type: "bytes32";
        readonly name: "orderHash";
    }];
    readonly outputs: readonly [];
}, {
    readonly name: "cancelOrder";
    readonly type: "function";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly type: "bytes32";
        readonly name: "orderHash";
    }];
    readonly outputs: readonly [];
}, {
    readonly name: "incrementCounter";
    readonly type: "function";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [];
    readonly outputs: readonly [];
}, {
    readonly name: "getOrderHash";
    readonly type: "function";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly type: "tuple";
        readonly components: readonly [{
            readonly type: "address";
            readonly name: "offerer";
        }, {
            readonly name: "offer";
            readonly type: "tuple";
            readonly components: readonly [{
                readonly type: "uint8";
                readonly name: "itemType";
            }, {
                readonly type: "address";
                readonly name: "token";
            }, {
                readonly type: "uint256";
                readonly name: "identifier";
            }, {
                readonly type: "uint256";
                readonly name: "amount";
            }];
        }, {
            readonly name: "consideration";
            readonly type: "tuple";
            readonly components: readonly [{
                readonly type: "uint8";
                readonly name: "itemType";
            }, {
                readonly type: "address";
                readonly name: "token";
            }, {
                readonly type: "uint256";
                readonly name: "identifier";
            }, {
                readonly type: "uint256";
                readonly name: "amount";
            }, {
                readonly type: "address";
                readonly name: "recipient";
            }];
        }, {
            readonly type: "uint256";
            readonly name: "royaltyMaxBps";
        }, {
            readonly type: "uint256";
            readonly name: "startTime";
        }, {
            readonly type: "uint256";
            readonly name: "endTime";
        }, {
            readonly type: "uint256";
            readonly name: "salt";
        }, {
            readonly type: "uint256";
            readonly name: "counter";
        }];
        readonly name: "parameters";
    }];
    readonly outputs: readonly [{
        readonly type: "bytes32";
    }];
}, {
    readonly name: "getCounter";
    readonly type: "function";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly type: "address";
        readonly name: "offerer";
    }];
    readonly outputs: readonly [{
        readonly type: "uint256";
    }];
}, {
    readonly name: "version";
    readonly type: "function";
    readonly stateMutability: "pure";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "string";
    }];
}, {
    readonly name: "OrderCreated";
    readonly type: "event";
    readonly inputs: readonly [{
        readonly type: "bytes32";
        readonly name: "orderHash";
        readonly indexed: true;
    }, {
        readonly type: "address";
        readonly name: "offerer";
        readonly indexed: true;
    }];
}, {
    readonly name: "OrderFulfilled";
    readonly type: "event";
    readonly inputs: readonly [{
        readonly type: "bytes32";
        readonly name: "orderHash";
        readonly indexed: true;
    }, {
        readonly type: "address";
        readonly name: "offerer";
        readonly indexed: true;
    }, {
        readonly type: "address";
        readonly name: "fulfiller";
        readonly indexed: true;
    }, {
        readonly type: "uint256";
        readonly name: "saleAmount";
    }, {
        readonly type: "address";
        readonly name: "royaltyReceiver";
    }, {
        readonly type: "uint256";
        readonly name: "royaltyAmount";
    }];
}, {
    readonly name: "OrderCancelled";
    readonly type: "event";
    readonly inputs: readonly [{
        readonly type: "bytes32";
        readonly name: "orderHash";
        readonly indexed: true;
    }, {
        readonly type: "address";
        readonly name: "offerer";
        readonly indexed: true;
    }];
}, {
    readonly name: "CounterIncremented";
    readonly type: "event";
    readonly inputs: readonly [{
        readonly type: "address";
        readonly name: "offerer";
        readonly indexed: true;
    }, {
        readonly type: "uint256";
        readonly name: "newCounter";
    }];
}];
declare const EvmVenue1155ABI: readonly [{
    readonly name: "fulfillOrder";
    readonly type: "function";
    readonly stateMutability: "payable";
    readonly inputs: readonly [{
        readonly type: "bytes32";
        readonly name: "orderHash";
    }, {
        readonly type: "uint256";
        readonly name: "quantity";
    }];
    readonly outputs: readonly [];
}, {
    readonly name: "OrderFulfilled";
    readonly type: "event";
    readonly inputs: readonly [{
        readonly type: "bytes32";
        readonly name: "orderHash";
        readonly indexed: true;
    }, {
        readonly type: "address";
        readonly name: "offerer";
        readonly indexed: true;
    }, {
        readonly type: "address";
        readonly name: "fulfiller";
        readonly indexed: true;
    }, {
        readonly type: "uint256";
        readonly name: "quantity";
    }, {
        readonly type: "uint256";
        readonly name: "remainingAmount";
    }, {
        readonly type: "uint256";
        readonly name: "saleAmount";
    }, {
        readonly type: "address";
        readonly name: "royaltyReceiver";
    }, {
        readonly type: "uint256";
        readonly name: "royaltyAmount";
    }];
}];
/** MIP issuance — verified against MIPRegistry.sol / MIPCollection.sol (and
 *  the editions pair, which shares the registry surface). */
declare const EvmMipRegistryABI: readonly [{
    readonly name: "createCollection";
    readonly type: "function";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly type: "string";
        readonly name: "name";
    }, {
        readonly type: "string";
        readonly name: "symbol";
    }, {
        readonly type: "string";
        readonly name: "baseUri";
    }, {
        readonly type: "uint96";
        readonly name: "royaltyBps";
    }];
    readonly outputs: readonly [{
        readonly type: "uint256";
        readonly name: "collectionId";
    }, {
        readonly type: "address";
        readonly name: "collection";
    }];
}, {
    readonly name: "getCollection";
    readonly type: "function";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly type: "uint256";
        readonly name: "collectionId";
    }];
    readonly outputs: readonly [{
        readonly type: "address";
        readonly name: "collection";
    }, {
        readonly type: "address";
        readonly name: "creator";
    }];
}, {
    readonly name: "collectionCount";
    readonly type: "function";
    readonly stateMutability: "view";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "uint256";
    }];
}, {
    readonly name: "CollectionCreated";
    readonly type: "event";
    readonly inputs: readonly [{
        readonly type: "uint256";
        readonly name: "collectionId";
        readonly indexed: true;
    }, {
        readonly type: "address";
        readonly name: "collection";
        readonly indexed: true;
    }, {
        readonly type: "address";
        readonly name: "creator";
        readonly indexed: true;
    }, {
        readonly type: "string";
        readonly name: "name";
    }, {
        readonly type: "string";
        readonly name: "symbol";
    }, {
        readonly type: "string";
        readonly name: "baseUri";
    }];
}];
declare const EvmMipCollectionABI: readonly [{
    readonly name: "mint";
    readonly type: "function";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly type: "address";
        readonly name: "to";
    }, {
        readonly type: "string";
        readonly name: "metadataUri";
    }];
    readonly outputs: readonly [{
        readonly type: "uint256";
        readonly name: "tokenId";
    }];
}, {
    readonly name: "batchMint";
    readonly type: "function";
    readonly stateMutability: "nonpayable";
    readonly inputs: readonly [{
        readonly type: "address[]";
        readonly name: "to";
    }, {
        readonly type: "string[]";
        readonly name: "metadataUris";
    }];
    readonly outputs: readonly [{
        readonly type: "uint256[]";
        readonly name: "tokenIds";
    }];
}, {
    readonly name: "tokenURI";
    readonly type: "function";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly type: "uint256";
        readonly name: "tokenId";
    }];
    readonly outputs: readonly [{
        readonly type: "string";
    }];
}, {
    readonly name: "ownerOf";
    readonly type: "function";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly type: "uint256";
        readonly name: "tokenId";
    }];
    readonly outputs: readonly [{
        readonly type: "address";
    }];
}, {
    readonly name: "balanceOf";
    readonly type: "function";
    readonly stateMutability: "view";
    readonly inputs: readonly [{
        readonly type: "address";
        readonly name: "owner";
    }];
    readonly outputs: readonly [{
        readonly type: "uint256";
    }];
}, {
    readonly name: "owner";
    readonly type: "function";
    readonly stateMutability: "view";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "address";
    }];
}, {
    readonly name: "TokenMinted";
    readonly type: "event";
    readonly inputs: readonly [{
        readonly type: "uint256";
        readonly name: "tokenId";
        readonly indexed: true;
    }, {
        readonly type: "address";
        readonly name: "owner";
        readonly indexed: true;
    }, {
        readonly type: "string";
        readonly name: "metadataUri";
    }];
}, {
    readonly name: "Transfer";
    readonly type: "event";
    readonly inputs: readonly [{
        readonly type: "address";
        readonly name: "from";
        readonly indexed: true;
    }, {
        readonly type: "address";
        readonly name: "to";
        readonly indexed: true;
    }, {
        readonly type: "uint256";
        readonly name: "tokenId";
        readonly indexed: true;
    }];
}];

interface EvmIssuanceOptions {
    chain: EvmChain;
    publicClient: PublicClient;
    /** Defaults to the chain registry's MIP registry (populated at deploy). */
    registry?: `0x${string}`;
}
/** The Mediolano issuance adapter for EVM chains. */
declare class EvmIssuance implements IssuanceAdapter<WalletClient> {
    readonly chain: Chain;
    private readonly registry;
    private readonly publicClient;
    constructor(opts: EvmIssuanceOptions);
    createCollection(signer: WalletClient, params: CreateCollectionInput): Promise<AdapterTxResult & {
        collection: string;
    }>;
    mint(signer: WalletClient, params: MintInput): Promise<AdapterTxResult & {
        tokenId: string;
    }>;
    batchMint(signer: WalletClient, params: {
        collection: string;
        recipients: string[];
        tokenUris: string[];
    }): Promise<AdapterTxResult>;
}

export { EVM_ORDER_TYPES, type EvmChain, type EvmConsiderationItem, EvmIssuance, type EvmIssuanceOptions, type EvmItemType, EvmMipCollectionABI, EvmMipRegistryABI, type EvmOfferItem, type EvmOrderParameters, EvmVenue, EvmVenue1155ABI, EvmVenueABI, type EvmVenueOptions, NATIVE_SENTINEL, evmOrderDigest, evmOrderDomain };
