import { z } from 'zod';
import { AccountInterface, constants, TypedData } from 'starknet';

declare const MARKETPLACE_CONTRACT_MAINNET = "0x04299b51289aa700de4ce19cc77bcea8430bfd1aef04193efab09d60a3a7ee0f";
declare const COLLECTION_CONTRACT_MAINNET = "0x05e73b7be06d82beeb390a0e0d655f2c9e7cf519658e04f05d9c690ccc41da03";
declare const SUPPORTED_TOKENS: readonly [{
    readonly symbol: "USDC";
    readonly address: "0x033068f6539f8e6e6b131e6b2b814e6c34a5224bc66947c47dab9dfee93b35fb";
    readonly decimals: 6;
}, {
    readonly symbol: "USDC.e";
    readonly address: "0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8";
    readonly decimals: 6;
}, {
    readonly symbol: "USDT";
    readonly address: "0x068f5c6a61780768455de69077e07e89787839bf8166decfbf92b645209c0fb8";
    readonly decimals: 6;
}, {
    readonly symbol: "ETH";
    readonly address: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";
    readonly decimals: 18;
}, {
    readonly symbol: "STRK";
    readonly address: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";
    readonly decimals: 18;
}];
type SupportedTokenSymbol = (typeof SUPPORTED_TOKENS)[number]["symbol"];
declare const SUPPORTED_NETWORKS: readonly ["mainnet", "sepolia"];
type Network = (typeof SUPPORTED_NETWORKS)[number];
declare const DEFAULT_RPC_URLS: Record<Network, string>;

declare const MedialaneConfigSchema: z.ZodObject<{
    network: z.ZodDefault<z.ZodEnum<["mainnet", "sepolia"]>>;
    rpcUrl: z.ZodOptional<z.ZodString>;
    backendUrl: z.ZodOptional<z.ZodString>;
    /** API key for authenticated /v1/* backend endpoints */
    apiKey: z.ZodOptional<z.ZodString>;
    marketplaceContract: z.ZodOptional<z.ZodString>;
    collectionContract: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    network: "mainnet" | "sepolia";
    rpcUrl?: string | undefined;
    backendUrl?: string | undefined;
    apiKey?: string | undefined;
    marketplaceContract?: string | undefined;
    collectionContract?: string | undefined;
}, {
    network?: "mainnet" | "sepolia" | undefined;
    rpcUrl?: string | undefined;
    backendUrl?: string | undefined;
    apiKey?: string | undefined;
    marketplaceContract?: string | undefined;
    collectionContract?: string | undefined;
}>;
type MedialaneConfig = z.input<typeof MedialaneConfigSchema>;
interface ResolvedConfig {
    network: Network;
    rpcUrl: string;
    backendUrl: string | undefined;
    apiKey: string | undefined;
    marketplaceContract: string;
    collectionContract: string;
}
declare function resolveConfig(raw: MedialaneConfig): ResolvedConfig;

interface OfferItem {
    item_type: string;
    token: string;
    identifier_or_criteria: string;
    start_amount: string;
    end_amount: string;
}
interface ConsiderationItem extends OfferItem {
    recipient: string;
}
interface OrderParameters {
    offerer: string;
    offer: OfferItem;
    consideration: ConsiderationItem;
    start_time: string;
    end_time: string;
    salt: string;
    nonce: string;
}
interface Order {
    parameters: OrderParameters;
    signature: string[];
}
interface Fulfillment {
    order_hash: string;
    fulfiller: string;
    nonce: string;
}
interface Cancelation {
    order_hash: string;
    offerer: string;
    nonce: string;
}
interface CreateListingParams {
    nftContract: string;
    tokenId: string;
    price: string;
    /** Currency symbol or token address. Defaults to "USDC" (native). */
    currency?: string;
    durationSeconds: number;
}
interface MakeOfferParams {
    nftContract: string;
    tokenId: string;
    price: string;
    /** Currency symbol or token address. Defaults to "USDC" (native). */
    currency?: string;
    durationSeconds: number;
}
interface FulfillOrderParams {
    orderHash: string;
}
interface CancelOrderParams {
    orderHash: string;
}
interface CartItem {
    orderHash: string;
    /** ERC20 token address of the consideration */
    considerationToken: string;
    /** Raw consideration amount (string, e.g. "1000000") */
    considerationAmount: string;
    /** Human-readable identifier for the NFT (for logging) */
    offerIdentifier?: string;
}
interface MintParams {
    collectionId: string;
    recipient: string;
    tokenUri: string;
    /** Optional: override the collection contract from config */
    collectionContract?: string;
}
interface CreateCollectionParams {
    name: string;
    symbol: string;
    baseUri: string;
    /** Optional: override the collection contract from config */
    collectionContract?: string;
}
interface TxResult {
    txHash: string;
}

declare class MedialaneError extends Error {
    readonly cause?: unknown | undefined;
    constructor(message: string, cause?: unknown | undefined);
}

declare class MarketplaceModule {
    private readonly config;
    constructor(config: ResolvedConfig);
    createListing(account: AccountInterface, params: CreateListingParams): Promise<TxResult>;
    makeOffer(account: AccountInterface, params: MakeOfferParams): Promise<TxResult>;
    fulfillOrder(account: AccountInterface, params: FulfillOrderParams): Promise<TxResult>;
    cancelOrder(account: AccountInterface, params: CancelOrderParams): Promise<TxResult>;
    checkoutCart(account: AccountInterface, items: CartItem[]): Promise<TxResult>;
    mint(account: AccountInterface, params: MintParams): Promise<TxResult>;
    createCollection(account: AccountInterface, params: CreateCollectionParams): Promise<TxResult>;
    buildListingTypedData(params: Record<string, unknown>, chainId: constants.StarknetChainId): TypedData;
    buildFulfillmentTypedData(params: Record<string, unknown>, chainId: constants.StarknetChainId): TypedData;
    buildCancellationTypedData(params: Record<string, unknown>, chainId: constants.StarknetChainId): TypedData;
}

type OrderStatus = "ACTIVE" | "FULFILLED" | "CANCELLED" | "EXPIRED";
type SortOrder = "price_asc" | "price_desc" | "recent";
type ActivityType = "transfer" | "sale" | "listing" | "offer" | "cancelled";
type IntentType = "CREATE_LISTING" | "MAKE_OFFER" | "FULFILL_ORDER" | "CANCEL_ORDER" | "MINT" | "CREATE_COLLECTION";
type IntentStatus = "PENDING" | "SIGNED" | "SUBMITTED" | "CONFIRMED" | "FAILED" | "EXPIRED";
type WebhookEventType = "ORDER_CREATED" | "ORDER_FULFILLED" | "ORDER_CANCELLED" | "TRANSFER";
type WebhookStatus = "ACTIVE" | "DISABLED";
type ApiKeyStatus = "ACTIVE" | "REVOKED";
type TenantPlan = "FREE" | "PREMIUM";
interface ApiMeta {
    page: number;
    limit: number;
    total?: number;
}
interface ApiResponse<T> {
    data: T;
    meta?: ApiMeta;
}
interface ApiOrdersQuery {
    status?: OrderStatus;
    collection?: string;
    currency?: string;
    sort?: SortOrder;
    page?: number;
    limit?: number;
    offerer?: string;
    minPrice?: string;
    maxPrice?: string;
}
interface ApiOrderOffer {
    itemType: string;
    token: string;
    identifier: string;
    startAmount: string;
    endAmount: string;
}
interface ApiOrderConsideration extends ApiOrderOffer {
    recipient: string;
}
interface ApiOrderPrice {
    raw: string | null;
    formatted: string | null;
    currency: string | null;
    decimals: number;
}
interface ApiOrderTxHash {
    created: string | null;
    fulfilled: string | null;
    cancelled: string | null;
}
interface ApiOrderTokenMeta {
    name: string | null;
    image: string | null;
    description: string | null;
}
interface ApiOrder {
    id: string;
    chain: string;
    orderHash: string;
    offerer: string;
    offer: ApiOrderOffer;
    consideration: ApiOrderConsideration;
    startTime: string;
    endTime: string;
    status: OrderStatus;
    fulfiller: string | null;
    nftContract: string | null;
    nftTokenId: string | null;
    price: ApiOrderPrice;
    txHash: ApiOrderTxHash;
    createdBlockNumber: string;
    createdAt: string;
    updatedAt: string;
    /** Embedded token metadata (name/image/description). Null when not yet indexed. */
    token: ApiOrderTokenMeta | null;
}
/**
 * A single OpenSea-compatible ERC-721 attribute.
 * Medialane embeds licensing, provenance, and IP metadata as attributes.
 */
interface IpAttribute {
    trait_type: string;
    value: string;
}
/**
 * Full on-chain + IPFS metadata for a Medialane IP NFT.
 * Conforms to the OpenSea ERC-721 metadata standard and embeds
 * Berne Convention-compatible licensing data in `attributes`.
 *
 * Common licensing attributes (all optional — absent on pre-v2 tokens):
 *   License · Commercial Use · Derivatives · Attribution · Territory
 *   AI Policy · Royalty · Standard ("Berne Convention") · Registration
 */
interface IpNftMetadata {
    name: string;
    description?: string;
    image?: string | null;
    external_url?: string;
    attributes?: IpAttribute[];
    /** Populated by the indexer for fast access — not stored in IPFS */
    ipType?: string | null;
    licenseType?: string | null;
    commercialUse?: string | null;
    derivatives?: string | null;
    attribution?: string | null;
    territory?: string | null;
    aiPolicy?: string | null;
    royalty?: string | null;
    registration?: string | null;
}
/** Indexed token metadata as returned by the Medialane API. */
interface ApiTokenMetadata {
    name: string | null;
    description: string | null;
    image: string | null;
    /** Parsed OpenSea-standard attributes array. Null when metadata hasn't been fetched. */
    attributes: IpAttribute[] | null;
    /** Short-circuit fields extracted from attributes by the indexer */
    ipType: string | null;
    licenseType: string | null;
    commercialUse: string | null;
    derivatives: string | null;
    attribution: string | null;
    territory: string | null;
    aiPolicy: string | null;
    royalty: string | null;
    registration: string | null;
    author: string | null;
}
interface ApiToken {
    id: string;
    chain: string;
    contractAddress: string;
    tokenId: string;
    owner: string;
    tokenUri: string | null;
    metadataStatus: "PENDING" | "FETCHING" | "FETCHED" | "FAILED";
    metadata: ApiTokenMetadata;
    activeOrders: ApiOrder[];
    createdAt: string;
    updatedAt: string;
}
interface ApiCollection {
    id: string;
    chain: string;
    contractAddress: string;
    collectionId: string | null;
    name: string | null;
    symbol: string | null;
    description: string | null;
    image: string | null;
    owner: string | null;
    startBlock: string;
    metadataStatus: "PENDING" | "FETCHING" | "FETCHED" | "FAILED";
    isKnown: boolean;
    floorPrice: string | null;
    totalVolume: string | null;
    holderCount: number | null;
    totalSupply: number | null;
    createdAt: string;
    updatedAt: string;
}
interface ApiActivityPrice {
    raw: string | null;
    formatted: string | null;
    currency: string | null;
}
interface ApiActivity {
    type: ActivityType;
    contractAddress?: string;
    tokenId?: string;
    from?: string;
    to?: string;
    blockNumber?: string;
    orderHash?: string;
    nftContract?: string;
    nftTokenId?: string;
    offerer?: string;
    fulfiller?: string | null;
    price?: ApiActivityPrice;
    txHash: string | null;
    timestamp: string;
}
interface ApiActivitiesQuery {
    type?: ActivityType;
    page?: number;
    limit?: number;
}
interface ApiSearchTokenResult {
    contractAddress: string;
    tokenId: string;
    name: string | null;
    image: string | null;
    owner: string;
    metadataStatus: string;
}
interface ApiSearchCollectionResult {
    contractAddress: string;
    name: string | null;
    image: string | null;
    totalSupply: number | null;
    floorPrice: string | null;
    holderCount: number | null;
}
interface ApiSearchResult {
    tokens: ApiSearchTokenResult[];
    collections: ApiSearchCollectionResult[];
}
interface ApiIntent {
    id: string;
    chain: string;
    type: IntentType;
    status: IntentStatus;
    requester: string;
    typedData: unknown;
    calls: unknown;
    signature: string[];
    txHash: string | null;
    orderHash: string | null;
    expiresAt: string;
    createdAt: string;
    updatedAt: string;
}
interface ApiIntentCreated {
    id: string;
    typedData: unknown;
    calls: unknown;
    expiresAt: string;
}
interface CreateListingIntentParams {
    offerer: string;
    nftContract: string;
    tokenId: string;
    currency: string;
    price: string;
    endTime: number;
    salt?: string;
}
interface MakeOfferIntentParams {
    offerer: string;
    nftContract: string;
    tokenId: string;
    currency: string;
    price: string;
    endTime: number;
    salt?: string;
}
interface FulfillOrderIntentParams {
    fulfiller: string;
    orderHash: string;
}
interface CancelOrderIntentParams {
    offerer: string;
    orderHash: string;
}
interface CreateMintIntentParams {
    /** Collection owner wallet address — must be the collection owner on-chain */
    owner: string;
    collectionId: string;
    recipient: string;
    tokenUri: string;
    /** Optional: override the default collection contract address */
    collectionContract?: string;
}
interface CreateCollectionIntentParams {
    owner: string;
    name: string;
    symbol: string;
    /** Optional description stored server-side and surfaced on the collection page. */
    description?: string;
    /** Optional IPFS image URI (ipfs://...) for the collection cover image. */
    image?: string;
    /** Base URI for token metadata. Defaults to empty string if not provided. */
    baseUri?: string;
    /** Optional: override the default collection contract address */
    collectionContract?: string;
}
interface ApiMetadataSignedUrl {
    url: string;
}
interface ApiMetadataUpload {
    cid: string;
    url: string;
}
interface ApiPortalMe {
    id: string;
    name: string;
    email: string;
    plan: TenantPlan;
    status: string;
}
interface ApiPortalKey {
    id: string;
    prefix: string;
    label: string;
    status: ApiKeyStatus;
    lastUsedAt: string | null;
    createdAt: string;
}
interface ApiPortalKeyCreated {
    id: string;
    prefix: string;
    label: string | null;
    /** Plaintext key — shown ONCE at creation */
    plaintext: string;
}
interface ApiUsageDay {
    day: string;
    requests: number;
}
interface ApiWebhookEndpoint {
    id: string;
    url: string;
    events: WebhookEventType[];
    status: WebhookStatus;
    createdAt: string;
}
interface ApiWebhookCreated extends ApiWebhookEndpoint {
    /** Signing secret — shown ONCE at creation, not stored in plaintext */
    secret: string;
}
interface CreateWebhookParams {
    url: string;
    events: WebhookEventType[];
    label?: string;
}

declare class MedialaneApiError extends Error {
    readonly status: number;
    constructor(status: number, message: string);
}
declare class ApiClient {
    private readonly baseUrl;
    private readonly baseHeaders;
    constructor(baseUrl: string, apiKey?: string);
    private request;
    private get;
    private post;
    private patch;
    private del;
    getOrders(query?: ApiOrdersQuery): Promise<ApiResponse<ApiOrder[]>>;
    getOrder(orderHash: string): Promise<ApiResponse<ApiOrder>>;
    getActiveOrdersForToken(contract: string, tokenId: string): Promise<ApiResponse<ApiOrder[]>>;
    getOrdersByUser(address: string, page?: number, limit?: number): Promise<ApiResponse<ApiOrder[]>>;
    getToken(contract: string, tokenId: string, wait?: boolean): Promise<ApiResponse<ApiToken>>;
    getTokensByOwner(address: string, page?: number, limit?: number): Promise<ApiResponse<ApiToken[]>>;
    getTokenHistory(contract: string, tokenId: string, page?: number, limit?: number): Promise<ApiResponse<ApiActivity[]>>;
    getCollections(page?: number, limit?: number, isKnown?: boolean): Promise<ApiResponse<ApiCollection[]>>;
    getCollectionsByOwner(owner: string, page?: number, limit?: number): Promise<ApiResponse<ApiCollection[]>>;
    getCollection(contract: string): Promise<ApiResponse<ApiCollection>>;
    getCollectionTokens(contract: string, page?: number, limit?: number): Promise<ApiResponse<ApiToken[]>>;
    getActivities(query?: ApiActivitiesQuery): Promise<ApiResponse<ApiActivity[]>>;
    getActivitiesByAddress(address: string, page?: number, limit?: number): Promise<ApiResponse<ApiActivity[]>>;
    search(q: string, limit?: number): Promise<ApiResponse<ApiSearchResult> & {
        query: string;
    }>;
    createListingIntent(params: CreateListingIntentParams): Promise<ApiResponse<ApiIntentCreated>>;
    createOfferIntent(params: MakeOfferIntentParams): Promise<ApiResponse<ApiIntentCreated>>;
    createFulfillIntent(params: FulfillOrderIntentParams): Promise<ApiResponse<ApiIntentCreated>>;
    createCancelIntent(params: CancelOrderIntentParams): Promise<ApiResponse<ApiIntentCreated>>;
    getIntent(id: string): Promise<ApiResponse<ApiIntent>>;
    submitIntentSignature(id: string, signature: string[]): Promise<ApiResponse<ApiIntent>>;
    createMintIntent(params: CreateMintIntentParams): Promise<ApiResponse<ApiIntentCreated>>;
    createCollectionIntent(params: CreateCollectionIntentParams): Promise<ApiResponse<ApiIntentCreated>>;
    getMetadataSignedUrl(): Promise<ApiResponse<ApiMetadataSignedUrl>>;
    uploadMetadata(metadata: Record<string, unknown>): Promise<ApiResponse<ApiMetadataUpload>>;
    resolveMetadata(uri: string): Promise<ApiResponse<unknown>>;
    uploadFile(file: File): Promise<ApiResponse<ApiMetadataUpload>>;
    getMe(): Promise<ApiResponse<ApiPortalMe>>;
    getApiKeys(): Promise<ApiResponse<ApiPortalKey[]>>;
    createApiKey(label?: string): Promise<ApiResponse<ApiPortalKeyCreated>>;
    deleteApiKey(id: string): Promise<ApiResponse<{
        id: string;
        status: string;
    }>>;
    getUsage(): Promise<ApiResponse<ApiUsageDay[]>>;
    getWebhooks(): Promise<ApiResponse<ApiWebhookEndpoint[]>>;
    createWebhook(params: CreateWebhookParams): Promise<ApiResponse<ApiWebhookCreated>>;
    deleteWebhook(id: string): Promise<ApiResponse<{
        id: string;
        status: string;
    }>>;
}

declare class MedialaneClient {
    /** On-chain marketplace interactions (create listing, fulfill order, etc.) */
    readonly marketplace: MarketplaceModule;
    /**
     * Off-chain API client — covers all /v1/* backend endpoints.
     * Requires `backendUrl` in config; pass `apiKey` for authenticated routes.
     */
    readonly api: ApiClient;
    private readonly config;
    constructor(rawConfig?: MedialaneConfig);
    get network(): "mainnet" | "sepolia";
    get rpcUrl(): string;
    get marketplaceContract(): string;
}

declare const IPMarketplaceABI: readonly [{
    readonly type: "impl";
    readonly name: "UpgradeableImpl";
    readonly interface_name: "openzeppelin_upgrades::interface::IUpgradeable";
}, {
    readonly type: "interface";
    readonly name: "openzeppelin_upgrades::interface::IUpgradeable";
    readonly items: readonly [{
        readonly type: "function";
        readonly name: "upgrade";
        readonly inputs: readonly [{
            readonly name: "new_class_hash";
            readonly type: "core::starknet::class_hash::ClassHash";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }];
}, {
    readonly type: "impl";
    readonly name: "MedialaneImpl";
    readonly interface_name: "mediolano_core::core::interface::IMedialane";
}, {
    readonly type: "struct";
    readonly name: "mediolano_core::core::types::OfferItem";
    readonly members: readonly [{
        readonly name: "item_type";
        readonly type: "core::felt252";
    }, {
        readonly name: "token";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }, {
        readonly name: "identifier_or_criteria";
        readonly type: "core::felt252";
    }, {
        readonly name: "start_amount";
        readonly type: "core::felt252";
    }, {
        readonly name: "end_amount";
        readonly type: "core::felt252";
    }];
}, {
    readonly type: "struct";
    readonly name: "mediolano_core::core::types::ConsiderationItem";
    readonly members: readonly [{
        readonly name: "item_type";
        readonly type: "core::felt252";
    }, {
        readonly name: "token";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }, {
        readonly name: "identifier_or_criteria";
        readonly type: "core::felt252";
    }, {
        readonly name: "start_amount";
        readonly type: "core::felt252";
    }, {
        readonly name: "end_amount";
        readonly type: "core::felt252";
    }, {
        readonly name: "recipient";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }];
}, {
    readonly type: "struct";
    readonly name: "mediolano_core::core::types::OrderParameters";
    readonly members: readonly [{
        readonly name: "offerer";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }, {
        readonly name: "offer";
        readonly type: "mediolano_core::core::types::OfferItem";
    }, {
        readonly name: "consideration";
        readonly type: "mediolano_core::core::types::ConsiderationItem";
    }, {
        readonly name: "start_time";
        readonly type: "core::felt252";
    }, {
        readonly name: "end_time";
        readonly type: "core::felt252";
    }, {
        readonly name: "salt";
        readonly type: "core::felt252";
    }, {
        readonly name: "nonce";
        readonly type: "core::felt252";
    }];
}, {
    readonly type: "struct";
    readonly name: "mediolano_core::core::types::Order";
    readonly members: readonly [{
        readonly name: "parameters";
        readonly type: "mediolano_core::core::types::OrderParameters";
    }, {
        readonly name: "signature";
        readonly type: "core::array::Array::<core::felt252>";
    }];
}, {
    readonly type: "struct";
    readonly name: "mediolano_core::core::types::OrderFulfillment";
    readonly members: readonly [{
        readonly name: "order_hash";
        readonly type: "core::felt252";
    }, {
        readonly name: "fulfiller";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }, {
        readonly name: "nonce";
        readonly type: "core::felt252";
    }];
}, {
    readonly type: "struct";
    readonly name: "mediolano_core::core::types::FulfillmentRequest";
    readonly members: readonly [{
        readonly name: "fulfillment";
        readonly type: "mediolano_core::core::types::OrderFulfillment";
    }, {
        readonly name: "signature";
        readonly type: "core::array::Array::<core::felt252>";
    }];
}, {
    readonly type: "struct";
    readonly name: "mediolano_core::core::types::OrderCancellation";
    readonly members: readonly [{
        readonly name: "order_hash";
        readonly type: "core::felt252";
    }, {
        readonly name: "offerer";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }, {
        readonly name: "nonce";
        readonly type: "core::felt252";
    }];
}, {
    readonly type: "struct";
    readonly name: "mediolano_core::core::types::CancelRequest";
    readonly members: readonly [{
        readonly name: "cancelation";
        readonly type: "mediolano_core::core::types::OrderCancellation";
    }, {
        readonly name: "signature";
        readonly type: "core::array::Array::<core::felt252>";
    }];
}, {
    readonly type: "enum";
    readonly name: "mediolano_core::core::types::OrderStatus";
    readonly variants: readonly [{
        readonly name: "None";
        readonly type: "()";
    }, {
        readonly name: "Created";
        readonly type: "()";
    }, {
        readonly name: "Filled";
        readonly type: "()";
    }, {
        readonly name: "Cancelled";
        readonly type: "()";
    }];
}, {
    readonly type: "enum";
    readonly name: "core::option::Option::<core::starknet::contract_address::ContractAddress>";
    readonly variants: readonly [{
        readonly name: "Some";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }, {
        readonly name: "None";
        readonly type: "()";
    }];
}, {
    readonly type: "struct";
    readonly name: "mediolano_core::core::types::OrderDetails";
    readonly members: readonly [{
        readonly name: "offerer";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }, {
        readonly name: "offer";
        readonly type: "mediolano_core::core::types::OfferItem";
    }, {
        readonly name: "consideration";
        readonly type: "mediolano_core::core::types::ConsiderationItem";
    }, {
        readonly name: "start_time";
        readonly type: "core::integer::u64";
    }, {
        readonly name: "end_time";
        readonly type: "core::integer::u64";
    }, {
        readonly name: "order_status";
        readonly type: "mediolano_core::core::types::OrderStatus";
    }, {
        readonly name: "fulfiller";
        readonly type: "core::option::Option::<core::starknet::contract_address::ContractAddress>";
    }];
}, {
    readonly type: "interface";
    readonly name: "mediolano_core::core::interface::IMedialane";
    readonly items: readonly [{
        readonly type: "function";
        readonly name: "register_order";
        readonly inputs: readonly [{
            readonly name: "order";
            readonly type: "mediolano_core::core::types::Order";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "fulfill_order";
        readonly inputs: readonly [{
            readonly name: "fulfillment_request";
            readonly type: "mediolano_core::core::types::FulfillmentRequest";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "cancel_order";
        readonly inputs: readonly [{
            readonly name: "cancel_request";
            readonly type: "mediolano_core::core::types::CancelRequest";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "get_order_details";
        readonly inputs: readonly [{
            readonly name: "order_hash";
            readonly type: "core::felt252";
        }];
        readonly outputs: readonly [{
            readonly type: "mediolano_core::core::types::OrderDetails";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "get_order_hash";
        readonly inputs: readonly [{
            readonly name: "parameters";
            readonly type: "mediolano_core::core::types::OrderParameters";
        }, {
            readonly name: "signer";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly outputs: readonly [{
            readonly type: "core::felt252";
        }];
        readonly state_mutability: "view";
    }];
}, {
    readonly type: "impl";
    readonly name: "NoncesImpl";
    readonly interface_name: "openzeppelin_utils::cryptography::interface::INonces";
}, {
    readonly type: "interface";
    readonly name: "openzeppelin_utils::cryptography::interface::INonces";
    readonly items: readonly [{
        readonly type: "function";
        readonly name: "nonces";
        readonly inputs: readonly [{
            readonly name: "owner";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly outputs: readonly [{
            readonly type: "core::felt252";
        }];
        readonly state_mutability: "view";
    }];
}, {
    readonly type: "impl";
    readonly name: "SRC5Impl";
    readonly interface_name: "openzeppelin_introspection::interface::ISRC5";
}, {
    readonly type: "enum";
    readonly name: "core::bool";
    readonly variants: readonly [{
        readonly name: "False";
        readonly type: "()";
    }, {
        readonly name: "True";
        readonly type: "()";
    }];
}, {
    readonly type: "interface";
    readonly name: "openzeppelin_introspection::interface::ISRC5";
    readonly items: readonly [{
        readonly type: "function";
        readonly name: "supports_interface";
        readonly inputs: readonly [{
            readonly name: "interface_id";
            readonly type: "core::felt252";
        }];
        readonly outputs: readonly [{
            readonly type: "core::bool";
        }];
        readonly state_mutability: "view";
    }];
}, {
    readonly type: "constructor";
    readonly name: "constructor";
    readonly inputs: readonly [{
        readonly name: "manager";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }, {
        readonly name: "native_token_address";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }];
}, {
    readonly type: "event";
    readonly name: "mediolano_core::core::events::OrderCreated";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "order_hash";
        readonly type: "core::felt252";
        readonly kind: "key";
    }, {
        readonly name: "offerer";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }];
}, {
    readonly type: "event";
    readonly name: "mediolano_core::core::events::OrderFulfilled";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "order_hash";
        readonly type: "core::felt252";
        readonly kind: "key";
    }, {
        readonly name: "offerer";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "fulfiller";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }];
}, {
    readonly type: "event";
    readonly name: "mediolano_core::core::events::OrderCancelled";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "order_hash";
        readonly type: "core::felt252";
        readonly kind: "key";
    }, {
        readonly name: "offerer";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }];
}, {
    readonly type: "event";
    readonly name: "mediolano_core::core::medialane::Medialane::Event";
    readonly kind: "enum";
    readonly variants: readonly [{
        readonly name: "OrderCreated";
        readonly type: "mediolano_core::core::events::OrderCreated";
        readonly kind: "nested";
    }, {
        readonly name: "OrderFulfilled";
        readonly type: "mediolano_core::core::events::OrderFulfilled";
        readonly kind: "nested";
    }, {
        readonly name: "OrderCancelled";
        readonly type: "mediolano_core::core::events::OrderCancelled";
        readonly kind: "nested";
    }];
}];

/**
 * Normalize a Starknet address to a 0x-prefixed 64-character hex string.
 */
declare function normalizeAddress(address: string): string;
/**
 * Shorten an address to "0x1234...abcd" format.
 */
declare function shortenAddress(address: string, chars?: number): string;

type SupportedToken = (typeof SUPPORTED_TOKENS)[number];
/**
 * Parse a human-readable amount (e.g. "1.5") to its raw integer string
 * representation given the token's decimal places.
 * Uses pure BigInt arithmetic to avoid floating point precision loss.
 */
declare function parseAmount(human: string, decimals: number): string;
/**
 * Format a raw integer string (e.g. "1500000") to a human-readable decimal
 * string given the token's decimal places.
 */
declare function formatAmount(raw: string, decimals: number): string;
/**
 * Find a supported token by its contract address (case-insensitive).
 */
declare function getTokenByAddress(address: string): SupportedToken | undefined;
/**
 * Find a supported token by its symbol (case-insensitive).
 */
declare function getTokenBySymbol(symbol: string): SupportedToken | undefined;

/**
 * Recursively convert all BigInt values to their decimal string representations.
 * Required before JSON serialisation and before passing objects to starknet.js
 * functions that expect string felts.
 */
declare function stringifyBigInts(obj: unknown): unknown;
/**
 * Convert a u256 represented as { low: string; high: string } to a single BigInt.
 */
declare function u256ToBigInt(low: string, high: string): bigint;

/**
 * Build SNIP-12 typed data for signing an OrderParameters struct.
 * Uses TypedDataRevision.ACTIVE and ContractAddress / shortstring SNIP-12 types.
 */
declare function buildOrderTypedData(message: Record<string, unknown>, chainId: constants.StarknetChainId): TypedData;
/**
 * Build SNIP-12 typed data for signing an OrderFulfillment struct.
 */
declare function buildFulfillmentTypedData(message: Record<string, unknown>, chainId: constants.StarknetChainId): TypedData;
/**
 * Build SNIP-12 typed data for signing an OrderCancellation struct.
 */
declare function buildCancellationTypedData(message: Record<string, unknown>, chainId: constants.StarknetChainId): TypedData;

export { type ActivityType, type ApiActivitiesQuery, type ApiActivity, type ApiActivityPrice, ApiClient, type ApiCollection, type ApiIntent, type ApiIntentCreated, type ApiKeyStatus, type ApiMeta, type ApiMetadataSignedUrl, type ApiMetadataUpload, type ApiOrder, type ApiOrderConsideration, type ApiOrderOffer, type ApiOrderPrice, type ApiOrderTokenMeta, type ApiOrderTxHash, type ApiOrdersQuery, type ApiPortalKey, type ApiPortalKeyCreated, type ApiPortalMe, type ApiResponse, type ApiSearchCollectionResult, type ApiSearchResult, type ApiSearchTokenResult, type ApiToken, type ApiTokenMetadata, type ApiUsageDay, type ApiWebhookCreated, type ApiWebhookEndpoint, COLLECTION_CONTRACT_MAINNET, type CancelOrderIntentParams, type CancelOrderParams, type Cancelation, type CartItem, type ConsiderationItem, type CreateCollectionIntentParams, type CreateCollectionParams, type CreateListingIntentParams, type CreateListingParams, type CreateMintIntentParams, type CreateWebhookParams, DEFAULT_RPC_URLS, type FulfillOrderIntentParams, type FulfillOrderParams, type Fulfillment, IPMarketplaceABI, type IntentStatus, type IntentType, type IpAttribute, type IpNftMetadata, MARKETPLACE_CONTRACT_MAINNET, type MakeOfferIntentParams, type MakeOfferParams, MarketplaceModule, MedialaneApiError, MedialaneClient, type MedialaneConfig, MedialaneError, type MintParams, type Network, type OfferItem, type Order, type OrderParameters, type OrderStatus, type ResolvedConfig, SUPPORTED_NETWORKS, SUPPORTED_TOKENS, type SortOrder, type SupportedTokenSymbol, type TenantPlan, type TxResult, type WebhookEventType, type WebhookStatus, buildCancellationTypedData, buildFulfillmentTypedData, buildOrderTypedData, formatAmount, getTokenByAddress, getTokenBySymbol, normalizeAddress, parseAmount, resolveConfig, shortenAddress, stringifyBigInts, u256ToBigInt };
