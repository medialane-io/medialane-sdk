import { z } from 'zod';
import { AccountInterface, constants, TypedData } from 'starknet';

declare const MARKETPLACE_CONTRACT_MAINNET = "0x04299b51289aa700de4ce19cc77bcea8430bfd1aef04193efab09d60a3a7ee0f";
declare const COLLECTION_CONTRACT_MAINNET = "0x05e73b7be06d82beeb390a0e0d655f2c9e7cf519658e04f05d9c690ccc41da03";
declare const SUPPORTED_TOKENS: readonly [{
    readonly symbol: "USDC";
    readonly address: "0x033068f6539f8e6e6b131e6b2b814e6c34a5224bc66947c47dab9dfee93b35fb";
    readonly decimals: 6;
    readonly listable: true;
}, {
    readonly symbol: "USDT";
    readonly address: "0x068f5c6a61780768455de69077e07e89787839bf8166decfbf92b645209c0fb8";
    readonly decimals: 6;
    readonly listable: true;
}, {
    readonly symbol: "ETH";
    readonly address: "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";
    readonly decimals: 18;
    readonly listable: true;
}, {
    readonly symbol: "STRK";
    readonly address: "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d";
    readonly decimals: 18;
    readonly listable: true;
}, {
    readonly symbol: "WBTC";
    readonly address: "0x03fe2b97c1fd336e750087d68b9b867997fd64a2661ff3ca5a7c771641e8e7ac";
    readonly decimals: 8;
    readonly listable: true;
}];
type SupportedTokenSymbol = (typeof SUPPORTED_TOKENS)[number]["symbol"];
declare const SUPPORTED_NETWORKS: readonly ["mainnet", "sepolia"];
type Network = (typeof SUPPORTED_NETWORKS)[number];
declare const DEFAULT_RPC_URLS: Record<Network, string>;

interface RetryOptions {
    maxAttempts?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
}

declare const MedialaneConfigSchema: z.ZodObject<{
    network: z.ZodDefault<z.ZodEnum<["mainnet", "sepolia"]>>;
    rpcUrl: z.ZodOptional<z.ZodString>;
    backendUrl: z.ZodOptional<z.ZodString>;
    /** API key for authenticated /v1/* backend endpoints */
    apiKey: z.ZodOptional<z.ZodString>;
    marketplaceContract: z.ZodOptional<z.ZodString>;
    collectionContract: z.ZodOptional<z.ZodString>;
    retryOptions: z.ZodOptional<z.ZodObject<{
        maxAttempts: z.ZodOptional<z.ZodNumber>;
        baseDelayMs: z.ZodOptional<z.ZodNumber>;
        maxDelayMs: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        maxAttempts?: number | undefined;
        baseDelayMs?: number | undefined;
        maxDelayMs?: number | undefined;
    }, {
        maxAttempts?: number | undefined;
        baseDelayMs?: number | undefined;
        maxDelayMs?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    network: "mainnet" | "sepolia";
    collectionContract?: string | undefined;
    rpcUrl?: string | undefined;
    backendUrl?: string | undefined;
    apiKey?: string | undefined;
    marketplaceContract?: string | undefined;
    retryOptions?: {
        maxAttempts?: number | undefined;
        baseDelayMs?: number | undefined;
        maxDelayMs?: number | undefined;
    } | undefined;
}, {
    collectionContract?: string | undefined;
    network?: "mainnet" | "sepolia" | undefined;
    rpcUrl?: string | undefined;
    backendUrl?: string | undefined;
    apiKey?: string | undefined;
    marketplaceContract?: string | undefined;
    retryOptions?: {
        maxAttempts?: number | undefined;
        baseDelayMs?: number | undefined;
        maxDelayMs?: number | undefined;
    } | undefined;
}>;
type MedialaneConfig = z.input<typeof MedialaneConfigSchema>;
interface ResolvedConfig {
    network: Network;
    rpcUrl: string;
    backendUrl: string | undefined;
    apiKey: string | undefined;
    marketplaceContract: string;
    collectionContract: string;
    retryOptions?: RetryOptions;
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

type MedialaneErrorCode = "TOKEN_NOT_FOUND" | "COLLECTION_NOT_FOUND" | "ORDER_NOT_FOUND" | "INTENT_NOT_FOUND" | "INTENT_EXPIRED" | "RATE_LIMITED" | "NETWORK_NOT_SUPPORTED" | "APPROVAL_FAILED" | "TRANSACTION_FAILED" | "INVALID_PARAMS" | "UNAUTHORIZED" | "UNKNOWN";

declare class MedialaneError extends Error {
    readonly code: MedialaneErrorCode;
    readonly cause?: unknown | undefined;
    constructor(message: string, code?: MedialaneErrorCode, cause?: unknown | undefined);
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

type IPType = "Audio" | "Art" | "Documents" | "NFT" | "Video" | "Photography" | "Patents" | "Posts" | "Publications" | "RWA" | "Software" | "Custom";
type CollectionSort = "recent" | "supply" | "floor" | "volume" | "name";
interface ApiCollectionsQuery {
    page?: number;
    limit?: number;
    isKnown?: boolean;
    sort?: CollectionSort;
    owner?: string;
}
type OrderStatus = "ACTIVE" | "FULFILLED" | "CANCELLED" | "EXPIRED" | "COUNTER_OFFERED";
type SortOrder = "price_asc" | "price_desc" | "recent";
type ActivityType = "transfer" | "sale" | "listing" | "offer" | "cancelled";
type IntentType = "CREATE_LISTING" | "MAKE_OFFER" | "FULFILL_ORDER" | "CANCEL_ORDER" | "MINT" | "CREATE_COLLECTION" | "COUNTER_OFFER";
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
    /** Set when this is a counter-offer listing — points to the original buyer bid. */
    parentOrderHash?: string | null;
    /** Optional seller message accompanying a counter-offer. */
    counterOfferMessage?: string | null;
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
    source: "MEDIALANE_REGISTRY" | "EXTERNAL" | "PARTNERSHIP" | "IP_TICKET" | "IP_CLUB" | "GAME";
    claimedBy: string | null;
    profile?: ApiCollectionProfile | null;
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
interface ApiComment {
    id: string;
    chain: string;
    contractAddress: string;
    tokenId: string;
    author: string;
    content: string;
    txHash: string | null;
    blockNumber: string;
    postedAt: string;
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
interface ApiSearchCreatorResult {
    walletAddress: string;
    username: string | null;
    displayName: string | null;
    bio: string | null;
    avatarImage: string | null;
}
interface ApiSearchResult {
    tokens: ApiSearchTokenResult[];
    collections: ApiSearchCollectionResult[];
    creators: ApiSearchCreatorResult[];
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
    /** Set on COUNTER_OFFER intents — the original bid order hash being countered. */
    parentOrderHash?: string | null;
    /** Optional seller message on counter-offer intents. */
    counterOfferMessage?: string | null;
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
interface CreateCounterOfferIntentParams {
    /** Wallet address of the NFT owner making the counter-offer. */
    sellerAddress: string;
    /** Order hash of the original buyer bid being countered. */
    originalOrderHash: string;
    /** Counter price as a raw wei integer string (not human-readable). */
    counterPrice: string;
    /** Duration in seconds the counter-offer will be valid (3600–2592000). */
    durationSeconds: number;
    /** Optional message from the seller to the buyer. Max 500 chars. */
    message?: string;
}
interface ApiCounterOffersQuery {
    /** Original bid order hash — returns the counter-offer for this specific bid. */
    originalOrderHash?: string;
    /** Seller address — returns all counter-offers sent by this seller. */
    sellerAddress?: string;
    page?: number;
    limit?: number;
}
declare const OPEN_LICENSES: readonly ["CC0", "CC BY", "CC BY-SA", "CC BY-NC"];
type OpenLicense = (typeof OPEN_LICENSES)[number];
type RemixOfferStatus = "PENDING" | "AUTO_PENDING" | "APPROVED" | "COMPLETED" | "REJECTED" | "EXPIRED" | "SELF_MINTED";
interface ApiRemixOfferPrice {
    raw: string;
    formatted: string;
    currency: string;
    decimals: number;
}
interface ApiRemixOffer {
    id: string;
    status: RemixOfferStatus;
    originalContract: string;
    originalTokenId: string;
    creatorAddress: string;
    requesterAddress: string | null;
    message?: string | null;
    /** Visible only to creator and requester — includes formatted price */
    price?: ApiRemixOfferPrice;
    licenseType: string;
    commercial: boolean;
    derivatives: boolean;
    royaltyPct: number | null;
    approvedCollection: string | null;
    remixContract: string | null;
    remixTokenId: string | null;
    orderHash: string | null;
    createdAt: string;
    expiresAt: string;
    updatedAt: string;
}
/** Public remix record — price/currency omitted for non-participants */
interface ApiPublicRemix {
    id: string;
    remixContract: string | null;
    remixTokenId: string | null;
    licenseType: string;
    commercial: boolean;
    derivatives: boolean;
    createdAt: string;
}
interface CreateRemixOfferParams {
    originalContract: string;
    originalTokenId: string;
    licenseType: string;
    commercial: boolean;
    derivatives: boolean;
    royaltyPct?: number;
    proposedPrice?: string;
    proposedCurrency?: string;
    message?: string;
    /** Offer validity in days (server default applies if omitted) */
    expiresInDays?: number;
}
interface AutoRemixOfferParams {
    originalContract: string;
    originalTokenId: string;
    licenseType: string;
}
interface ConfirmSelfRemixParams {
    originalContract: string;
    originalTokenId: string;
    remixContract: string;
    remixTokenId: string;
    /** On-chain transaction hash of the mint tx */
    txHash?: string;
    licenseType: string;
    commercial: boolean;
    derivatives: boolean;
    royaltyPct?: number;
}
interface ConfirmRemixOfferParams {
    approvedCollection: string;
    remixContract: string;
    remixTokenId: string;
    orderHash?: string;
}
interface ApiRemixOffersQuery {
    /** "creator" = offers where you are the original creator; "requester" = offers you made */
    role: "creator" | "requester";
    page?: number;
    limit?: number;
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
interface ApiCollectionProfile {
    contractAddress: string;
    chain: string;
    displayName: string | null;
    description: string | null;
    image: string | null;
    bannerImage: string | null;
    websiteUrl: string | null;
    twitterUrl: string | null;
    discordUrl: string | null;
    telegramUrl: string | null;
    hasGatedContent: boolean;
    updatedBy: string | null;
    updatedAt: string;
}
interface ApiCreatorProfile {
    walletAddress: string;
    chain: string;
    username: string | null;
    displayName: string | null;
    bio: string | null;
    avatarImage: string | null;
    bannerImage: string | null;
    websiteUrl: string | null;
    twitterUrl: string | null;
    discordUrl: string | null;
    telegramUrl: string | null;
    updatedAt: string;
}
interface ApiCreatorListResult {
    creators: ApiCreatorProfile[];
    total: number;
    page: number;
    limit: number;
}
interface ApiUserWallet {
    walletAddress: string;
}
interface ApiCollectionClaim {
    id: string;
    contractAddress: string;
    chain: string;
    claimantAddress: string | null;
    status: "PENDING" | "AUTO_APPROVED" | "APPROVED" | "REJECTED";
    verificationMethod: "ONCHAIN" | "SIGNATURE" | "MANUAL";
    createdAt: string;
}
interface ApiAdminCollectionClaim extends ApiCollectionClaim {
    claimantEmail: string | null;
    notes: string | null;
    adminNotes: string | null;
    reviewedBy: string | null;
    reviewedAt: string | null;
    updatedAt: string;
}

declare class MedialaneApiError extends Error {
    readonly status: number;
    readonly code: MedialaneErrorCode;
    constructor(status: number, message: string);
}
declare class ApiClient {
    private readonly baseUrl;
    private readonly baseHeaders;
    private readonly retryOptions;
    constructor(baseUrl: string, apiKey?: string, retryOptions?: RetryOptions);
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
    getCollections(page?: number, limit?: number, isKnown?: boolean, sort?: CollectionSort): Promise<ApiResponse<ApiCollection[]>>;
    getCollectionsByOwner(owner: string, page?: number, limit?: number): Promise<ApiResponse<ApiCollection[]>>;
    getCollection(contract: string): Promise<ApiResponse<ApiCollection>>;
    getCollectionTokens(contract: string, page?: number, limit?: number): Promise<ApiResponse<ApiToken[]>>;
    getActivities(query?: ApiActivitiesQuery): Promise<ApiResponse<ApiActivity[]>>;
    getActivitiesByAddress(address: string, page?: number, limit?: number): Promise<ApiResponse<ApiActivity[]>>;
    getTokenComments(contract: string, tokenId: string, opts?: {
        page?: number;
        limit?: number;
    }): Promise<ApiResponse<ApiComment[]>>;
    search(q: string, limit?: number): Promise<ApiResponse<ApiSearchResult> & {
        query: string;
    }>;
    createListingIntent(params: CreateListingIntentParams): Promise<ApiResponse<ApiIntentCreated>>;
    createOfferIntent(params: MakeOfferIntentParams): Promise<ApiResponse<ApiIntentCreated>>;
    createFulfillIntent(params: FulfillOrderIntentParams): Promise<ApiResponse<ApiIntentCreated>>;
    createCancelIntent(params: CancelOrderIntentParams): Promise<ApiResponse<ApiIntentCreated>>;
    getIntent(id: string): Promise<ApiResponse<ApiIntent>>;
    submitIntentSignature(id: string, signature: string[]): Promise<ApiResponse<ApiIntent>>;
    confirmIntent(id: string, txHash: string): Promise<ApiResponse<ApiIntent>>;
    createMintIntent(params: CreateMintIntentParams): Promise<ApiResponse<ApiIntentCreated>>;
    createCollectionIntent(params: CreateCollectionIntentParams): Promise<ApiResponse<ApiIntentCreated>>;
    /**
     * Create a counter-offer intent. The seller proposes a new price in response
     * to a buyer's active bid. clerkToken is optional — the endpoint authenticates
     * via the tenant API key; pass a Clerk JWT only if your backend requires it.
     */
    createCounterOfferIntent(params: CreateCounterOfferIntentParams, clerkToken?: string): Promise<ApiResponse<ApiIntentCreated>>;
    /**
     * Fetch counter-offers. Pass `originalOrderHash` (buyer view) or
     * `sellerAddress` (seller view) — at least one is required.
     */
    getCounterOffers(query: ApiCounterOffersQuery): Promise<ApiResponse<ApiOrder[]>>;
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
    /**
     * Path 1: On-chain auto claim. Sends both x-api-key (tenant auth) and
     * Authorization: Bearer (Clerk JWT) simultaneously.
     */
    claimCollection(contractAddress: string, walletAddress: string, clerkToken: string): Promise<{
        verified: boolean;
        collection?: ApiCollection;
        reason?: string;
    }>;
    /**
     * Path 3: Manual off-chain claim request (email-based).
     */
    requestCollectionClaim(params: {
        contractAddress: string;
        walletAddress?: string;
        email: string;
        notes?: string;
    }): Promise<{
        claim: ApiCollectionClaim;
    }>;
    getCollectionProfile(contractAddress: string): Promise<ApiCollectionProfile | null>;
    /**
     * Update collection profile. Requires Clerk JWT for ownership check.
     */
    updateCollectionProfile(contractAddress: string, data: Partial<Omit<ApiCollectionProfile, "contractAddress" | "chain" | "updatedBy" | "updatedAt">>, clerkToken: string): Promise<ApiCollectionProfile>;
    /** List all creators with an approved username. */
    getCreators(opts?: {
        search?: string;
        page?: number;
        limit?: number;
    }): Promise<ApiCreatorListResult>;
    getCreatorProfile(walletAddress: string): Promise<ApiCreatorProfile | null>;
    /** Resolve a username slug to a creator profile (public). */
    getCreatorByUsername(username: string): Promise<ApiCreatorProfile | null>;
    /**
     * Update creator profile. Requires Clerk JWT; wallet must match authenticated user.
     */
    updateCreatorProfile(walletAddress: string, data: Partial<Omit<ApiCreatorProfile, "walletAddress" | "chain" | "updatedAt">>, clerkToken: string): Promise<ApiCreatorProfile>;
    /**
     * Upsert the authenticated user's wallet address in the backend DB.
     * Call after onboarding when ChipiPay confirms the wallet address.
     * Requires Clerk JWT; no tenant API key needed.
     */
    upsertMyWallet(clerkToken: string): Promise<ApiUserWallet>;
    /**
     * Get the authenticated user's stored wallet address from the backend DB.
     * Returns null if the user has not completed onboarding yet.
     * Requires Clerk JWT; no tenant API key needed.
     */
    getMyWallet(clerkToken: string): Promise<ApiUserWallet | null>;
    /**
     * Get public remixes of a token (open to everyone).
     */
    getTokenRemixes(contract: string, tokenId: string, opts?: {
        page?: number;
        limit?: number;
    }): Promise<ApiResponse<ApiPublicRemix[]>>;
    /**
     * Submit a custom remix offer for a token. Requires Clerk JWT.
     */
    submitRemixOffer(params: CreateRemixOfferParams, clerkToken: string): Promise<ApiResponse<ApiRemixOffer>>;
    /**
     * Submit an auto remix offer for a token with an open license. Requires Clerk JWT.
     */
    submitAutoRemixOffer(params: AutoRemixOfferParams, clerkToken: string): Promise<ApiResponse<ApiRemixOffer>>;
    /**
     * Record a self-remix (owner remixing their own token). Requires Clerk JWT.
     */
    confirmSelfRemix(params: ConfirmSelfRemixParams, clerkToken: string): Promise<ApiResponse<ApiRemixOffer>>;
    /**
     * List remix offers by role. Requires Clerk JWT.
     * role="creator" — offers where you are the original creator.
     * role="requester" — offers you made.
     */
    getRemixOffers(query: ApiRemixOffersQuery, clerkToken: string): Promise<ApiResponse<ApiRemixOffer[]>>;
    /**
     * Get a single remix offer. Clerk JWT optional (price/currency hidden for non-participants).
     */
    getRemixOffer(id: string, clerkToken?: string): Promise<ApiResponse<ApiRemixOffer>>;
    /**
     * Creator approves a remix offer (authorises the requester to mint). Requires Clerk JWT.
     */
    confirmRemixOffer(id: string, params: ConfirmRemixOfferParams, clerkToken: string): Promise<ApiResponse<ApiRemixOffer>>;
    /**
     * Creator rejects a remix offer. Requires Clerk JWT.
     */
    rejectRemixOffer(id: string, clerkToken: string): Promise<ApiResponse<ApiRemixOffer>>;
    /**
     * Requester extends the expiry of a pending remix offer by 1–30 days.
     * Requires Clerk JWT.
     */
    extendRemixOffer(id: string, days: number, clerkToken: string): Promise<ApiResponse<ApiRemixOffer>>;
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
 * Return all tokens available for use in listing and offer dialogs.
 * Tokens with listable: false appear only as marketplace filter chips.
 */
declare function getListableTokens(): ReadonlyArray<SupportedToken>;

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

export { type ActivityType, type ApiActivitiesQuery, type ApiActivity, type ApiActivityPrice, type ApiAdminCollectionClaim, ApiClient, type ApiCollection, type ApiCollectionClaim, type ApiCollectionProfile, type ApiCollectionsQuery, type ApiComment, type ApiCounterOffersQuery, type ApiCreatorListResult, type ApiCreatorProfile, type ApiIntent, type ApiIntentCreated, type ApiKeyStatus, type ApiMeta, type ApiMetadataSignedUrl, type ApiMetadataUpload, type ApiOrder, type ApiOrderConsideration, type ApiOrderOffer, type ApiOrderPrice, type ApiOrderTokenMeta, type ApiOrderTxHash, type ApiOrdersQuery, type ApiPortalKey, type ApiPortalKeyCreated, type ApiPortalMe, type ApiPublicRemix, type ApiRemixOffer, type ApiRemixOfferPrice, type ApiRemixOffersQuery, type ApiResponse, type ApiSearchCollectionResult, type ApiSearchCreatorResult, type ApiSearchResult, type ApiSearchTokenResult, type ApiToken, type ApiTokenMetadata, type ApiUsageDay, type ApiUserWallet, type ApiWebhookCreated, type ApiWebhookEndpoint, type AutoRemixOfferParams, COLLECTION_CONTRACT_MAINNET, type CancelOrderIntentParams, type CancelOrderParams, type Cancelation, type CartItem, type CollectionSort, type ConfirmRemixOfferParams, type ConfirmSelfRemixParams, type ConsiderationItem, type CreateCollectionIntentParams, type CreateCollectionParams, type CreateCounterOfferIntentParams, type CreateListingIntentParams, type CreateListingParams, type CreateMintIntentParams, type CreateRemixOfferParams, type CreateWebhookParams, DEFAULT_RPC_URLS, type FulfillOrderIntentParams, type FulfillOrderParams, type Fulfillment, IPMarketplaceABI, type IPType, type IntentStatus, type IntentType, type IpAttribute, type IpNftMetadata, MARKETPLACE_CONTRACT_MAINNET, type MakeOfferIntentParams, type MakeOfferParams, MarketplaceModule, MedialaneApiError, MedialaneClient, type MedialaneConfig, MedialaneError, type MedialaneErrorCode, type MintParams, type Network, OPEN_LICENSES, type OfferItem, type OpenLicense, type Order, type OrderParameters, type OrderStatus, type RemixOfferStatus, type ResolvedConfig, type RetryOptions, SUPPORTED_NETWORKS, SUPPORTED_TOKENS, type SortOrder, type SupportedToken, type SupportedTokenSymbol, type TenantPlan, type TxResult, type WebhookEventType, type WebhookStatus, buildCancellationTypedData, buildFulfillmentTypedData, buildOrderTypedData, formatAmount, getListableTokens, getTokenByAddress, getTokenBySymbol, normalizeAddress, parseAmount, resolveConfig, shortenAddress, stringifyBigInts, u256ToBigInt };
