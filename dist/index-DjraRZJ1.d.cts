import { z } from 'zod';
import { C as Chain, V as VenueAdapter, O as OrderRef, A as AdapterTxResult, R as RegisterOrderParams } from './types-V6imkXvR.cjs';
import { AccountInterface, constants, TypedData, Call, ProviderInterface } from 'starknet';

interface RetryOptions {
    maxAttempts?: number;
    baseDelayMs?: number;
    maxDelayMs?: number;
}

declare const FeeConfigSchema: z.ZodObject<{
    enabled: z.ZodDefault<z.ZodBoolean>;
    fundAddress: z.ZodOptional<z.ZodString>;
    marketplaceBps: z.ZodDefault<z.ZodNumber>;
    launchpadBps: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    enabled: boolean;
    marketplaceBps: number;
    launchpadBps: number;
    fundAddress?: string | undefined;
}, {
    enabled?: boolean | undefined;
    fundAddress?: string | undefined;
    marketplaceBps?: number | undefined;
    launchpadBps?: number | undefined;
}>;
type FeeConfig = z.input<typeof FeeConfigSchema>;
interface ResolvedFeeConfig {
    enabled: boolean;
    fundAddress: string | undefined;
    marketplaceBps: number;
    launchpadBps: number;
}
declare function resolveFeeConfig(raw: FeeConfig | undefined): ResolvedFeeConfig;

declare const MedialaneConfigSchema: z.ZodObject<{
    chain: z.ZodDefault<z.ZodEnum<["STARKNET", "ETHEREUM", "SOLANA", "BASE", "STELLAR", "BITCOIN"]>>;
    rpcUrl: z.ZodOptional<z.ZodString>;
    backendUrl: z.ZodOptional<z.ZodString>;
    apiKey: z.ZodOptional<z.ZodString>;
    marketplace721Contract: z.ZodOptional<z.ZodString>;
    marketplaceContract: z.ZodOptional<z.ZodString>;
    marketplace1155Contract: z.ZodOptional<z.ZodString>;
    collection721Contract: z.ZodOptional<z.ZodString>;
    collectionContract: z.ZodOptional<z.ZodString>;
    collection1155Contract: z.ZodOptional<z.ZodString>;
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
    feeConfig: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        fundAddress: z.ZodOptional<z.ZodString>;
        marketplaceBps: z.ZodDefault<z.ZodNumber>;
        launchpadBps: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        marketplaceBps: number;
        launchpadBps: number;
        fundAddress?: string | undefined;
    }, {
        enabled?: boolean | undefined;
        fundAddress?: string | undefined;
        marketplaceBps?: number | undefined;
        launchpadBps?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    chain: "STARKNET" | "ETHEREUM" | "SOLANA" | "BASE" | "STELLAR" | "BITCOIN";
    rpcUrl?: string | undefined;
    backendUrl?: string | undefined;
    apiKey?: string | undefined;
    marketplace721Contract?: string | undefined;
    marketplaceContract?: string | undefined;
    marketplace1155Contract?: string | undefined;
    collection721Contract?: string | undefined;
    collectionContract?: string | undefined;
    collection1155Contract?: string | undefined;
    retryOptions?: {
        maxAttempts?: number | undefined;
        baseDelayMs?: number | undefined;
        maxDelayMs?: number | undefined;
    } | undefined;
    feeConfig?: {
        enabled: boolean;
        marketplaceBps: number;
        launchpadBps: number;
        fundAddress?: string | undefined;
    } | undefined;
}, {
    rpcUrl?: string | undefined;
    chain?: "STARKNET" | "ETHEREUM" | "SOLANA" | "BASE" | "STELLAR" | "BITCOIN" | undefined;
    backendUrl?: string | undefined;
    apiKey?: string | undefined;
    marketplace721Contract?: string | undefined;
    marketplaceContract?: string | undefined;
    marketplace1155Contract?: string | undefined;
    collection721Contract?: string | undefined;
    collectionContract?: string | undefined;
    collection1155Contract?: string | undefined;
    retryOptions?: {
        maxAttempts?: number | undefined;
        baseDelayMs?: number | undefined;
        maxDelayMs?: number | undefined;
    } | undefined;
    feeConfig?: {
        enabled?: boolean | undefined;
        fundAddress?: string | undefined;
        marketplaceBps?: number | undefined;
        launchpadBps?: number | undefined;
    } | undefined;
}>;
type MedialaneConfig = z.input<typeof MedialaneConfigSchema>;
interface ResolvedConfig {
    chain: Chain;
    rpcUrl: string;
    backendUrl: string | undefined;
    apiKey: string | undefined;
    marketplace721Contract: string;
    marketplaceContract: string;
    marketplace1155Contract: string;
    collection721Contract: string;
    collectionContract: string;
    collection1155Contract: string;
    retryOptions?: RetryOptions;
    feeConfig: ResolvedFeeConfig;
}
declare function resolveConfig(raw: MedialaneConfig): ResolvedConfig;

type IPType = "Audio" | "Art" | "Documents" | "NFT" | "Video" | "Photography" | "Patents" | "Posts" | "Publications" | "RWA" | "Software" | "Custom";
type CollectionSort = "recent" | "supply" | "floor" | "volume" | "name";
type CollectionTokensSort = "recent" | "oldest" | "name" | "price";
/** Bounded capability set (05-service-model §III). Expand the union when a
 *  service needs behavior outside it — never make it free-form. */
type ServiceCapability = "list" | "buy" | "make_offer" | "cancel" | "transfer" | "burn" | "mint" | "claim" | "airdrop" | "remix" | "license" | "subscribe" | "redeem" | "launch" | "swap" | "sponsor";
/** A service that bakes enforcement into its own contract declares it here
 *  (04-licensing-model §V, 05-service-model §IV). Absence/all-falsey =
 *  soft enforcement (the 00-principles §9 default). */
interface EnforcementDeclaration {
    royalty?: "erc2981" | "service-split" | "none";
    escrow?: boolean;
    timeLock?: boolean;
    revocable?: boolean;
}
/** An on-chain event the service emits. The indexer consumes this list to
 *  decide what to poll and how to parse — the year-2 "data-driven event
 *  parser registry" foundation (02-protocol-app-split §V).
 *
 *  The Cairo selector is derivable from `name` via
 *  `starknet.hash.getSelectorFromName(name)` — not stored to avoid
 *  duplication and keep the SDK runtime-free of pre-computed hashes.
 */
interface ServiceEventDeclaration {
    /** Cairo event struct name (e.g. "OrderCreated", "CollectionCreated"). */
    name: string;
    /**
     * Where this event is emitted:
     *  - "factory":  at the service's `onchain.factoryAddress` (fixed address).
     *                Examples: marketplace OrderCreated, factory CollectionCreated.
     *  - "instance": at the address of each deployed collection contract
     *                (variable; the indexer iterates discovered instances).
     *                Examples: ERC-721 Transfer, POP AllowlistUpdated.
     */
    emittedBy: "factory" | "instance";
    /**
     * Polling cadence the indexer should use:
     *  - "fast" (default): every indexer tick (~6s). Right for low-volume
     *                      protocol events like order/factory events.
     *  - "slow":           a separate slower loop (~2min). Right for
     *                      high-volume per-instance events like Transfer
     *                      and AllowlistUpdated — polling them every tick
     *                      against every known instance is RPC-expensive.
     */
    poll?: "fast" | "slow";
}
/** Declarative description of a service (05-service-model §II).
 *  SDK-resident in v1; on-chain registry in year 2. */
interface ServiceDefinition {
    /** Stable kebab-case id. NO version number (05 §II). */
    id: string;
    displayName: string;
    description: string;
    standard: "ERC721" | "ERC1155" | "ERC20" | "UNKNOWN";
    provenance: "MEDIALANE" | "EXTERNAL";
    onchain?: Partial<Record<Chain, {
        factoryAddress?: string;
        classHash?: string;
        startBlock?: number;
    }>>;
    /** Drives the dapp asset/collection page variant. */
    uiVariant: string;
    capabilities: ServiceCapability[];
    /** Events the indexer should poll + parse for this service.
     *  Optional during the year-1 transition — backend hand-coded pollers
     *  (medialane-backend/src/mirror/poller.ts) take precedence today.
     *  Populated here so consumers and the future data-driven indexer can
     *  read what events a service emits without code-spelunking. */
    events?: ServiceEventDeclaration[];
    metadataSchema?: {
        requiredTraits?: string[];
        /** Canonical platform default is "CC BY-SA" (04-licensing-model §III). */
        licenseDefault?: string;
        enforcement?: EnforcementDeclaration;
    };
}
interface ApiCollectionsQuery {
    page?: number;
    limit?: number;
    isKnown?: boolean;
    sort?: CollectionSort;
    owner?: string;
    /** Filter by service id. */
    service?: string;
}
/**
 * Order lifecycle states. **Four canonical values** per `01-core-model §V`.
 *
 * The legacy `"COUNTER_OFFERED"` value was removed in 0.23.0 (audit P0-1
 * Phase D). Counter-offers are linked orders via `parentOrderHash`, not a
 * third lifecycle state on the parent bid. Use `ApiOrder.hasActiveCounterOffer`
 * (added in 0.22.0) for the "this bid has been countered" affordance.
 */
type OrderStatus = "ACTIVE" | "FULFILLED" | "CANCELLED" | "EXPIRED";
type SortOrder = "price_asc" | "price_desc" | "recent";
type ActivityType = "mint" | "transfer" | "sale" | "listing" | "offer" | "cancelled";
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
/** Cross-chain read filter — a concrete chain, or "all" for aggregation
 *  (platform-federation spec §2.3). Omitted = the backend default (STARKNET). */
type ChainFilter = Chain | "all";
interface ApiOrdersQuery {
    chain?: ChainFilter;
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
    /** ERC-1155 only: units still available after the last partial fill. Null for ERC-721 or unfilled orders. */
    remainingAmount: string | null;
    createdAt: string;
    updatedAt: string;
    /** Embedded token metadata (name/image/description). Null when not yet indexed. */
    token: ApiOrderTokenMeta | null;
    /** Set when this is a counter-offer listing — points to the original buyer bid.
     *  Now always emitted by the backend (was conditional); kept optional in the
     *  type for back-compat with older response shapes. */
    parentOrderHash?: string | null;
    /** Optional seller message accompanying a counter-offer. */
    counterOfferMessage?: string | null;
    /** True when this order is a bid (ERC-20 offer) AND at least one ACTIVE counter
     *  exists with `parentOrderHash = this.orderHash`. Set by endpoints that compute
     *  it (currently `GET /v1/orders/user/:address` and `GET /v1/orders/:orderHash`);
     *  undefined on endpoints that don't.
     *
     *  Use this instead of `status === "COUNTER_OFFERED"` for "this bid has been
     *  countered" affordances. The status pattern is being phased out per
     *  01-core-model §V — counter-offers are linked orders, not a lifecycle state. */
    hasActiveCounterOffer?: boolean;
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
/** Per-holder balance entry. Present for ERC-1155 (multi-holder); single entry for ERC-721. */
interface ApiTokenBalance {
    owner: string;
    /** Quantity held. Always "1" for ERC-721. */
    amount: string;
}
interface ApiToken {
    id: string;
    chain: string;
    contractAddress: string;
    tokenId: string;
    /** @deprecated Use `balances` for ownership checks — always null after ERC-1155 migration. */
    owner: string | null;
    tokenUri: string | null;
    metadataStatus: "PENDING" | "FETCHING" | "FETCHED" | "FAILED";
    /** Token standard derived from the parent collection. Use this to determine ERC-721 vs ERC-1155 behavior. */
    standard: "ERC721" | "ERC1155" | "UNKNOWN";
    metadata: ApiTokenMetadata;
    /** Current holders with amounts. Only present on single-token fetches; null on list responses. */
    balances: ApiTokenBalance[] | null;
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
    /** Token standard detected via ERC-165. Collection is NFT-only since the
     *  2026-06-14 coin split — fungible coins are `ApiCoin`, served by getCoins(). */
    standard: "ERC721" | "ERC1155";
    isKnown: boolean;
    /** Hidden by ops/admin (content moderation). When true, list endpoints
     *  already filter the row out; single-collection fetches still return
     *  it so the UI can render a "hidden" banner instead of a 404. */
    isHidden: boolean;
    /** Promoted on homepage / browse surfaces. */
    isFeatured: boolean;
    /** Stable Medialane service ID, or null for external collections.
     *  Resolve via getService() (05-service-model). Primary field. */
    service: string | null;
    claimedBy: string | null;
    profile?: ApiCollectionProfile | null;
    floorPrice: string | null;
    totalVolume: string | null;
    holderCount: number | null;
    totalSupply: number | null;
    createdAt: string;
    updatedAt: string;
}
/** A fungible coin (ERC-20 today; SPL/etc. later). Distinct from ApiCollection:
 *  a coin has a supply + decimals + a market price (read live from Ekubo), no
 *  tokens, no orders. Served by getCoins()/getCoin() (spec 2026-06-14). */
interface ApiCoin {
    id: string;
    chain: string;
    contractAddress: string;
    standard: "ERC20";
    /** "creator-coin" | "external-erc20" */
    service: string;
    name: string | null;
    symbol: string | null;
    decimals: number;
    /** Fungible supply as a decimal string — NOT an item count. */
    totalSupply: string | null;
    description: string | null;
    image: string | null;
    creator: string | null;
    startBlock: string;
    isHidden: boolean;
    createdAt: string;
    updatedAt: string;
}
interface ApiCoinsQuery {
    chain?: ChainFilter;
    page?: number;
    limit?: number;
    /** Filter by coin service id ("creator-coin" | "external-erc20"). */
    service?: string;
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
    /** ERC-1155 quantity (transfer/mint rows). "1" for ERC-721. */
    amount?: string;
    orderHash?: string;
    nftContract?: string;
    nftTokenId?: string;
    offerer?: string;
    fulfiller?: string | null;
    price?: ApiActivityPrice;
    /** Token standard — present on order rows. */
    tokenStandard?: "ERC721" | "ERC1155";
    txHash: string | null;
    timestamp: string;
    /** Batch-enriched token metadata — avoids per-row fetches. */
    token?: {
        name: string | null;
        image: string | null;
    } | null;
}
interface ApiActivitiesQuery {
    chain?: ChainFilter;
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
/** A single Starknet call as returned in intent calldata. */
interface IntentCall {
    contractAddress: string;
    entrypoint: string;
    calldata: string[];
}
/**
 * Response from any `createXIntent` call. Discriminated on `requiresSignature`:
 *   • true  — SNIP-12 intent (listing / offer / cancel / counter-offer). Sign
 *             `typedData`, then call `submitIntentSignature(id, sig)` to obtain
 *             the executable calls.
 *   • false — prebuilt intent (fulfill / mint / create-collection). `calls` are
 *             ready to execute directly; there is no signature step.
 *
 * The discriminant makes the wrong access a compile error: `typedData` does not
 * exist on the `false` variant, nor `calls` on the `true` variant. Consumers
 * MUST narrow on `requiresSignature` before reading either.
 */
type ApiIntentCreated = {
    id: string;
    expiresAt: string;
    requiresSignature: true;
    typedData: unknown;
} | {
    id: string;
    expiresAt: string;
    requiresSignature: false;
    calls: IntentCall[];
};
interface CreateListingIntentParams {
    offerer: string;
    nftContract: string;
    tokenId: string;
    currency: string;
    price: string;
    endTime: number;
    salt?: string;
    /** Number of units to list — required for ERC-1155, omit for ERC-721. */
    amount?: string;
}
interface MakeOfferIntentParams {
    offerer: string;
    nftContract: string;
    tokenId: string;
    currency: string;
    price: string;
    endTime: number;
    salt?: string;
    /** Caller hint — "ERC1155" creates the bid on the ERC-1155 marketplace. */
    tokenStandard?: string;
    /** ERC-1155 only: number of editions requested. Defaults to 1. */
    quantity?: string;
}
interface FulfillOrderIntentParams {
    fulfiller: string;
    orderHash: string;
    /** Caller hint — "ERC1155" forces 1155 routing even if the order isn't in the DB yet */
    tokenStandard?: string;
    /** ERC-1155 only: units to purchase (1 ≤ quantity ≤ remaining_amount). Defaults to 1. */
    quantity?: string;
}
interface CancelOrderIntentParams {
    offerer: string;
    orderHash: string;
    /** Caller hint — "ERC1155" forces 1155 routing even if the order isn't in the DB yet */
    tokenStandard?: string;
}
interface CreateMintIntentParams {
    /** Collection owner wallet address — must be the collection owner on-chain */
    owner: string;
    collectionId: string;
    recipient: string;
    tokenUri: string;
    /**
     * EIP-2981 secondary-sale royalty in basis points (0–10_000). Set once at mint;
     * receiver is the immutable creator. Required since MIP v0.4.0 — pass 0 for none.
     */
    royaltyBps: number;
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
    priceRaw: string;
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
    gatedContentTitle: string | null;
    slug: string | null;
    updatedBy: string | null;
    updatedAt: string;
}
interface ApiCollectionSlugClaim {
    id: string;
    slug: string;
    contractAddress: string;
    chain: string;
    walletAddress: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    adminNotes: string | null;
    notifyEmail: string | null;
    reviewedAt: string | null;
    createdAt: string;
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
    /** Computed fallback used by the creator-list / creator-page endpoints
     *  ONLY when both `avatarImage` and `bannerImage` are null: image of
     *  any collection owned by this creator. Undefined on profile-detail
     *  endpoints where this lookup isn't performed. UI may use this to
     *  populate hero banners without an extra fetch. */
    collectionImage?: string | null;
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
type ApiAppSource = "MEDIALANE_STARKNET" | "MEDIALANE_IO" | "MEDIALANE_PORTAL" | "MEDIALANE_SDK" | "MEDIALANE_DAPP";
type ApiChain = "STARKNET" | "ETHEREUM" | "SOLANA" | "BASE" | "BITCOIN";
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
interface PopClaimStatus {
    isEligible: boolean;
    hasClaimed: boolean;
    tokenId: string | null;
}
interface PopBatchEligibilityItem extends PopClaimStatus {
    wallet: string;
}
type PopEventType = "Conference" | "Bootcamp" | "Workshop" | "Hackathon" | "Meetup" | "Course" | "Other";
interface DropMintStatus {
    mintedByWallet: number;
    totalMinted: number;
}
interface ApiRewardsBadge {
    key: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    category: string;
}
interface ApiRewardsLevel {
    level: number;
    name: string;
    xpRequired: number;
    badgeColor: string;
    description: string | null;
}
interface ApiUserRewards {
    address: string;
    accountId: string | null;
    publicId: string | null;
    totalXp: number;
    currentLevel: number;
    currentLevelName: string;
    badgeColor: string;
    nextLevel: {
        level: number;
        name: string;
        xpRequired: number;
    } | null;
    progressPct: number;
    breakdown: Record<string, number>;
    badges: ApiRewardsBadge[];
    computedAt: string | null;
}
interface ApiRewardsLeaderboardEntry {
    rank: number;
    address: string;
    accountId: string | null;
    publicId: string | null;
    totalXp: number;
    currentLevel: number;
    currentLevelName: string;
    badgeColor: string;
}
interface ApiRewardsConfig {
    levels: ApiRewardsLevel[];
    actions: {
        type: string;
        label: string;
        xp: number;
        dailyCap: number | null;
    }[];
    badges: ApiRewardsBadge[];
}
interface ApiRewardsBatchEntry {
    address: string;
    totalXp: number;
    currentLevel: number;
    currentLevelName: string;
    badgeColor: string;
}
interface ApiPointEvent {
    id: string;
    actionType: string;
    xp: number;
    multiplier: number;
    finalXp: number;
    txHash: string | null;
    createdAt: string;
}

type MedialaneErrorCode = "TOKEN_NOT_FOUND" | "COLLECTION_NOT_FOUND" | "ORDER_NOT_FOUND" | "INTENT_NOT_FOUND" | "INTENT_EXPIRED" | "RATE_LIMITED" | "NETWORK_NOT_SUPPORTED" | "APPROVAL_FAILED" | "TRANSACTION_FAILED" | "INVALID_PARAMS" | "UNAUTHORIZED" | "UNKNOWN";

declare class MedialaneApiError extends Error {
    readonly status: number;
    readonly code: MedialaneErrorCode;
    constructor(status: number, message: string);
}
declare class ApiClient {
    private readonly baseUrl;
    private readonly chain;
    private readonly baseHeaders;
    private readonly retryOptions;
    constructor(baseUrl: string, apiKey?: string, retryOptions?: RetryOptions, chain?: Chain);
    /** Normalize an address for this client's chain (chain-scoped — Decision B). */
    private addr;
    private request;
    private get;
    private post;
    private patch;
    private del;
    private checkResponse;
    getOrders(query?: ApiOrdersQuery): Promise<ApiResponse<ApiOrder[]>>;
    getOrder(orderHash: string): Promise<ApiResponse<ApiOrder>>;
    getActiveOrdersForToken(contract: string, tokenId: string): Promise<ApiResponse<ApiOrder[]>>;
    getOrdersByUser(address: string, page?: number, limit?: number): Promise<ApiResponse<ApiOrder[]>>;
    getToken(contract: string, tokenId: string, wait?: boolean): Promise<ApiResponse<ApiToken>>;
    getTokensByOwner(address: string, page?: number, limit?: number): Promise<ApiResponse<ApiToken[]>>;
    getTokenHistory(contract: string, tokenId: string, page?: number, limit?: number): Promise<ApiResponse<ApiActivity[]>>;
    getCollections(page?: number, limit?: number, isKnown?: boolean, sort?: CollectionSort, service?: string, chain?: ChainFilter): Promise<ApiResponse<ApiCollection[]>>;
    getCollectionsByOwner(owner: string, page?: number, limit?: number): Promise<ApiResponse<ApiCollection[]>>;
    getCollection(contract: string): Promise<ApiResponse<ApiCollection>>;
    getCollectionTokens(contract: string, page?: number, limit?: number, sort?: CollectionTokensSort): Promise<ApiResponse<ApiToken[]>>;
    getActivities(query?: ApiActivitiesQuery): Promise<ApiResponse<ApiActivity[]>>;
    getActivitiesByAddress(address: string, page?: number, limit?: number): Promise<ApiResponse<ApiActivity[]>>;
    getTokenComments(contract: string, tokenId: string, opts?: {
        page?: number;
        limit?: number;
    }): Promise<ApiResponse<ApiComment[]>>;
    search(q: string, limit?: number, chain?: ChainFilter): Promise<ApiResponse<ApiSearchResult> & {
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
    getGatedContent(contractAddress: string, clerkToken: string): Promise<{
        title: string;
        url: string;
        type: string;
    } | null>;
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
    /** Check if a collection slug is available (public, no auth). */
    checkCollectionSlugAvailability(slug: string): Promise<{
        available: boolean;
        reason?: string;
    }>;
    /** Submit a slug claim for a collection. Requires Clerk JWT — caller must be the collection owner. */
    submitCollectionSlugClaim(contractAddress: string, slug: string, clerkToken: string, notifyEmail?: string): Promise<{
        claim: ApiCollectionSlugClaim;
    }>;
    /** Returns all slug claims submitted by the authenticated wallet. Requires Clerk JWT. */
    getMyCollectionSlugClaims(clerkToken: string): Promise<{
        claims: ApiCollectionSlugClaim[];
    }>;
    /** Resolve a collection slug to a full collection. Returns null if not found. */
    getCollectionBySlug(slug: string): Promise<ApiCollection | null>;
    /**
     * Upsert the authenticated user's wallet address in the backend DB.
     * Call after onboarding when ChipiPay confirms the wallet address.
     * Requires Clerk JWT; no tenant API key needed.
     */
    /**
     * Frictionless wallet registration. Tenant API key only (no Clerk JWT required).
     * Idempotent — backend's ensureAccountForWallet upserts and upgrades existing
     * UNKNOWN walletType rows when a more specific value is supplied.
     */
    registerUser(params: {
        walletAddress: string;
        walletType?: string;
        appSource?: ApiAppSource;
        chain?: ApiChain;
    }): Promise<{
        accountId: string;
        publicId: string;
        walletAddress: string;
        chain: string;
        provider: string;
        appSource: ApiAppSource;
        createdAt: string;
    }>;
    upsertMyWallet(clerkToken: string, options?: {
        walletType?: string;
        appSource?: ApiAppSource;
        chain?: ApiChain;
    }): Promise<ApiUserWallet>;
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
    getPopCollections(opts?: {
        page?: number;
        limit?: number;
        sort?: CollectionSort;
    }): Promise<ApiResponse<ApiCollection[]>>;
    getPopEligibility(collection: string, wallet: string): Promise<PopClaimStatus>;
    getPopEligibilityBatch(collection: string, wallets: string[]): Promise<PopBatchEligibilityItem[]>;
    getCoins(opts?: ApiCoinsQuery): Promise<ApiResponse<ApiCoin[]>>;
    getCoin(contract: string): Promise<{
        data: ApiCoin;
    }>;
    getDropCollections(opts?: {
        page?: number;
        limit?: number;
        sort?: CollectionSort;
    }): Promise<ApiResponse<ApiCollection[]>>;
    getDropMintStatus(collection: string, wallet: string): Promise<DropMintStatus>;
    /** Score + level + progress + badges for one address (zeroed for unknown). */
    getRewards(address: string): Promise<ApiUserRewards>;
    /** Paginated XP leaderboard. */
    getRewardsLeaderboard(page?: number, limit?: number): Promise<ApiResponse<ApiRewardsLeaderboardEntry[]>>;
    /** Point-event history for an address. */
    getRewardsEvents(address: string, page?: number, limit?: number): Promise<ApiResponse<ApiPointEvent[]>>;
    /** Reward configuration: level ladder, enabled action XP values, badge catalog. */
    getRewardsConfig(): Promise<ApiRewardsConfig>;
    /** Minimal level info for up to 50 addresses — one call per list page. */
    getRewardsBatch(addresses: string[]): Promise<ApiRewardsBatchEntry[]>;
}

interface OfferItem {
    item_type: string;
    token: string;
    identifier_or_criteria: string;
    amount: string;
}
interface ConsiderationItem extends OfferItem {
    recipient: string;
}
interface OrderParameters {
    offerer: string;
    marketplace: string;
    offer: OfferItem;
    consideration: ConsiderationItem;
    royalty_max_bps: string;
    start_time: string;
    end_time: string;
    salt: string;
    counter: string;
}
interface Order {
    parameters: OrderParameters;
    signature: string[];
}
interface Cancelation {
    order_hash: string;
    offerer: string;
}
interface CreateListingParams {
    nftContract: string;
    tokenId: string;
    price: string;
    /** Currency symbol or token address. Defaults to "USDC" (native). */
    currency?: string;
    durationSeconds: number;
    /** Signed EIP-2981 royalty cap in bps. Defaults to the NFT's live 2981 rate. */
    royaltyMaxBps?: string;
}
interface MakeOfferParams {
    nftContract: string;
    tokenId: string;
    price: string;
    /** Currency symbol or token address. Defaults to "USDC" (native). */
    currency?: string;
    durationSeconds: number;
    /** Signed EIP-2981 royalty cap in bps. Defaults to the NFT's live 2981 rate. */
    royaltyMaxBps?: string;
}
interface FulfillOrderParams {
    orderHash: string;
    /** ERC-20 payment token address — the consideration token on the listing. */
    paymentToken: string;
    /** Total price in raw token units as a string (e.g. "1000000" for 1 USDC). */
    totalPrice: string;
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
    /** ERC-1155 only: number of units to purchase per item (defaults to "1") */
    quantity?: string;
}
interface MintParams {
    collectionId: string;
    recipient: string;
    tokenUri: string;
    /**
     * EIP-2981 secondary-sale royalty in basis points (0–10_000). Set once at mint;
     * the receiver is the immutable creator (the minting collection owner). Required
     * since MIP v0.4.0 — pass 0 for no royalty.
     */
    royaltyBps: number;
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
interface OrderDetails {
    offerer: string;
    offer: OfferItem;
    consideration: ConsiderationItem;
    royalty_max_bps: string;
    start_time: bigint;
    end_time: bigint;
    order_status: string;
    /** The offerer's bulk-cancel epoch at registration; re-checked at fulfilment. */
    counter: string;
    /** ERC-1155 only — units still available. */
    remaining_amount?: string;
}
interface CreateListing1155Params {
    /** ERC-1155 contract address */
    nftContract: string;
    /** Token type ID */
    tokenId: string;
    /** Number of tokens to sell */
    amount: string;
    /** Human-readable price per token (e.g. "1.5") */
    pricePerUnit: string;
    /** Currency symbol or token address. Defaults to "USDC". */
    currency?: string;
    /** How long the listing is valid, in seconds */
    durationSeconds: number;
    /** Signed EIP-2981 royalty cap in bps. Defaults to the NFT's live 2981 rate. */
    royaltyMaxBps?: string;
}
interface FulfillOrder1155Params {
    /** On-chain order hash */
    orderHash: string;
    /** ERC-20 payment token address (from order details) */
    paymentToken: string;
    /** Total price in raw token units (pricePerUnit × quantity, as string) */
    totalPrice: string;
    /** Number of units to purchase (1 ≤ quantity ≤ remaining_amount). Defaults to 1. */
    quantity?: string;
}
interface CancelOrder1155Params {
    /** On-chain order hash */
    orderHash: string;
}
interface MakeOffer1155Params {
    /** ERC-1155 contract address */
    nftContract: string;
    /** Token type ID */
    tokenId: string;
    /** Number of tokens requested */
    amount: string;
    /** Total offer price in human-readable units (e.g. "1.5") */
    price: string;
    /** Currency symbol or token address. Defaults to "USDC". */
    currency?: string;
    /** How long the offer is valid, in seconds */
    durationSeconds: number;
    /** Signed EIP-2981 royalty cap in bps. Defaults to the NFT's live 2981 rate. */
    royaltyMaxBps?: string;
}

interface CreatePopCollectionParams {
    name: string;
    symbol: string;
    baseUri: string;
    claimEndTime: number;
    eventType: PopEventType;
}
interface ClaimConditions {
    /** Unix timestamp when minting opens. 0 = open immediately. */
    startTime: number;
    /** Unix timestamp when minting closes. 0 = never closes. */
    endTime: number;
    /** Price per token in payment_token units. 0 = free mint. */
    price: bigint | string;
    /** ERC-20 token address for payment. Must be non-zero if price > 0. */
    paymentToken: string;
    /** Max tokens a single wallet may mint across all phases. 0 = unlimited. */
    maxQuantityPerWallet: bigint | string;
}
interface CreateDropParams {
    name: string;
    symbol: string;
    baseUri: string;
    maxSupply: bigint | string;
    initialConditions: ClaimConditions;
}
interface CreateTicketCollectionParams {
    collection: string;
    /** 0 = free ticket; must be non-zero with paymentToken set otherwise. */
    price: bigint | string;
    maxSupply: bigint | string;
    /** Unix timestamp; must be in the future. */
    expiration: number;
    /** Basis points, 0-10000. */
    royaltyBps: number;
    /** Required (non-zero) when price > 0; omit for free tickets. */
    paymentToken?: string;
    /** ipfs:// or ar:// only — enforced on-chain. */
    metadataUri: string;
}
interface CreateClubParams {
    name: string;
    symbol: string;
    /** ipfs:// or ar:// only — enforced on-chain. */
    metadataUri: string;
    maxMembers?: number;
    /** Required (non-zero) with paymentToken set; omit for a free club. */
    entryFee?: bigint | string;
    paymentToken?: string;
}
/** Factory-pattern deploy — one ERC-721 collection per creator. */
interface DeployClubParams {
    name: string;
    symbol: string;
    /** ipfs:// base URI for the collection. */
    baseUri: string;
    /** Max token supply; defaults to u128 max (effectively unlimited). */
    maxSupply?: bigint | string;
    /** Entry fee in payment token units; 0 = free. */
    entryFee?: bigint | string;
    /** Required when entryFee > 0. */
    paymentToken?: string;
    /** Royalty in basis points (0–10 000). */
    royaltyBps?: bigint | string;
    /** Override factory address. */
    factoryAddress?: string;
}
interface CreateSponsorshipOfferParams {
    nftContract: string;
    tokenId: bigint | string;
    minAmount: bigint | string;
    /** Seconds, applied from acceptance (not from offer creation). */
    duration: number;
    paymentToken: string;
    licenseTermsUri: string;
    transferable: boolean;
    /** Restricts acceptance to one sponsor address; omit for open bidding. */
    specificSponsor?: string;
}

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
    /** Bulk-cancel: bump the caller's counter, invalidating all their open orders. */
    incrementCounter(account: AccountInterface): Promise<TxResult>;
    getOrderDetails(orderHash: string): Promise<OrderDetails>;
    getCounter(address: string): Promise<bigint>;
    buildListingTypedData(params: Record<string, unknown>, chainId: constants.StarknetChainId): TypedData;
    buildCancellationTypedData(params: Record<string, unknown>, chainId: constants.StarknetChainId): TypedData;
}

declare class Medialane1155Module {
    private readonly config;
    constructor(config: ResolvedConfig);
    /**
     * Create an ERC-1155 sell listing.
     * Optionally grants `set_approval_for_all` if not already approved.
     */
    createListing(account: AccountInterface, params: CreateListing1155Params): Promise<TxResult>;
    /**
     * Make an offer (bid) on an ERC-1155 token.
     * Approves the ERC-20 spend then calls `register_order` atomically.
     */
    makeOffer(account: AccountInterface, params: MakeOffer1155Params): Promise<TxResult>;
    /**
     * Fulfill (buy) an ERC-1155 listing.
     * Approves the payment token then calls `fulfill_order` atomically.
     */
    fulfillOrder(account: AccountInterface, params: FulfillOrder1155Params): Promise<TxResult>;
    /**
     * Cancel an ERC-1155 listing (offerer only).
     */
    cancelOrder(account: AccountInterface, params: CancelOrder1155Params): Promise<TxResult>;
    /**
     * Checkout a cart of ERC-1155 orders atomically.
     * Signs one fulfillment per item (with quantity), sums ERC-20 approvals by token.
     */
    checkoutCart(account: AccountInterface, items: CartItem[]): Promise<TxResult>;
    /** Bulk-cancel on the 1155 venue: bump the caller's counter. */
    incrementCounter(account: AccountInterface): Promise<TxResult>;
    getOrderDetails(orderHash: string): Promise<OrderDetails>;
    getCounter(address: string): Promise<bigint>;
    buildListingTypedData(params: Record<string, unknown>, chainId: constants.StarknetChainId): TypedData;
    buildCancellationTypedData(params: Record<string, unknown>, chainId: constants.StarknetChainId): TypedData;
}

declare class PopService {
    private readonly factoryAddress;
    constructor(config: ResolvedConfig);
    private _collection;
    claim(account: AccountInterface, collectionAddress: string): Promise<TxResult>;
    adminMint(account: AccountInterface, params: {
        collection: string;
        recipient: string;
        customUri?: string;
    }): Promise<TxResult>;
    addToAllowlist(account: AccountInterface, params: {
        collection: string;
        address: string;
    }): Promise<TxResult>;
    batchAddToAllowlist(account: AccountInterface, params: {
        collection: string;
        addresses: string[];
    }): Promise<TxResult>;
    removeFromAllowlist(account: AccountInterface, params: {
        collection: string;
        address: string;
    }): Promise<TxResult>;
    setTokenUri(account: AccountInterface, params: {
        collection: string;
        tokenId: string | bigint;
        uri: string;
    }): Promise<TxResult>;
    setPaused(account: AccountInterface, params: {
        collection: string;
        paused: boolean;
    }): Promise<TxResult>;
    createCollection(account: AccountInterface, params: CreatePopCollectionParams): Promise<TxResult>;
}

declare class DropService {
    private readonly factoryAddress;
    private readonly config;
    constructor(config: ResolvedConfig);
    private _collection;
    claim(account: AccountInterface, collectionAddress: string, quantity?: bigint | string | number): Promise<TxResult>;
    adminMint(account: AccountInterface, params: {
        collection: string;
        recipient: string;
        quantity?: bigint | string | number;
        customUri?: string;
    }): Promise<TxResult>;
    setClaimConditions(account: AccountInterface, params: {
        collection: string;
        conditions: ClaimConditions;
    }): Promise<TxResult>;
    setAllowlistEnabled(account: AccountInterface, params: {
        collection: string;
        enabled: boolean;
    }): Promise<TxResult>;
    addToAllowlist(account: AccountInterface, params: {
        collection: string;
        address: string;
    }): Promise<TxResult>;
    batchAddToAllowlist(account: AccountInterface, params: {
        collection: string;
        addresses: string[];
    }): Promise<TxResult>;
    setPaused(account: AccountInterface, params: {
        collection: string;
        paused: boolean;
    }): Promise<TxResult>;
    withdrawPayments(account: AccountInterface, params: {
        collection: string;
    }): Promise<TxResult>;
    createDrop(account: AccountInterface, params: CreateDropParams): Promise<TxResult>;
}

interface DeployCollectionParams {
    /** Human-readable collection name (e.g. "My IP Collection") */
    name: string;
    /** Short ticker symbol (e.g. "MIP") */
    symbol: string;
    /**
     * Collection-level metadata URI (e.g. "ipfs://Qm…/collection.json").
     * Should point to a JSON containing `name`, `description`, `image`, and `external_link`.
     * Stored on-chain at deploy time. Pass an empty string if not available.
     */
    baseUri: string;
}
interface MintEditionParams {
    /** ERC-1155 collection contract address */
    collection: string;
    /** Recipient wallet address */
    to: string;
    /** Number of copies of this new edition to mint */
    value: bigint | string;
    /**
     * Metadata URI — must start with `ipfs://` or `ar://`.
     * Immutable: validated and stored at mint. The token id is assigned on-chain
     * (sequential from 1); read it from the `IPMinted` event of the returned tx.
     */
    tokenUri: string;
}
interface BatchMintEditionParams {
    /** ERC-1155 collection contract address */
    collection: string;
    /** Recipient wallet address */
    to: string;
    /** New editions to create; ids are assigned sequentially on-chain. */
    items: Array<{
        value: bigint | string;
        tokenUri: string;
    }>;
}
interface AddSupplyParams {
    /** ERC-1155 collection contract address */
    collection: string;
    /** Recipient wallet address */
    to: string;
    /** Existing edition id to mint more copies of (reverts if it doesn't exist) */
    tokenId: bigint | string;
    /** Number of additional copies */
    value: bigint | string;
}
declare class ERC1155CollectionService {
    private readonly factoryAddress;
    constructor(config: ResolvedConfig);
    private _factory;
    private _collection;
    /**
     * Deploy a new ERC-1155 IP collection.
     * Caller becomes the collection owner and can mint items.
     * Returns the transaction hash; the deployed collection address is emitted
     * in the `CollectionDeployed` event of the factory.
     */
    deployCollection(account: AccountInterface, params: DeployCollectionParams): Promise<TxResult>;
    /**
     * Mint a new edition into an existing ERC-1155 collection.
     * Caller must be the collection owner. The token id is assigned on-chain
     * (sequential from 1) — read it from the `IPMinted` event of the returned tx.
     * The `tokenUri` is immutable.
     */
    mintEdition(account: AccountInterface, params: MintEditionParams): Promise<TxResult>;
    /**
     * Batch-mint multiple new editions into an existing ERC-1155 collection.
     * All editions go to the same `to` address; ids are assigned sequentially
     * on-chain. Caller must be the collection owner.
     */
    batchMintEdition(account: AccountInterface, params: BatchMintEditionParams): Promise<TxResult>;
    /**
     * Mint additional copies of an EXISTING edition into an ERC-1155 collection.
     * Reverts on-chain if `tokenId` has never been minted. Provenance/URI unchanged.
     * Caller must be the collection owner.
     */
    addSupply(account: AccountInterface, params: AddSupplyParams): Promise<TxResult>;
    /**
     * Set the default ERC-2981 royalty for the entire collection.
     * `feeNumerator` is out of 10 000 (e.g. 500 = 5%).
     * Caller must be the collection owner.
     */
    setDefaultRoyalty(account: AccountInterface, params: {
        collection: string;
        receiver: string;
        feeNumerator: number;
    }): Promise<TxResult>;
    /**
     * Set a per-token ERC-2981 royalty override.
     * `feeNumerator` is out of 10 000. Caller must be the collection owner.
     */
    setTokenRoyalty(account: AccountInterface, params: {
        collection: string;
        tokenId: bigint | string;
        receiver: string;
        feeNumerator: number;
    }): Promise<TxResult>;
    /**
     * Approve the Medialane1155 marketplace (or any operator) to transfer
     * all tokens on behalf of `account`. Required before listing.
     */
    setApprovalForAll(account: AccountInterface, params: {
        collection: string;
        operator: string;
        approved: boolean;
    }): Promise<TxResult>;
}

interface CreateCreatorCoinParams {
    /** Owner of the new coin — the only address allowed to launch it. */
    owner: string;
    name: string;
    symbol: string;
    /** Full fixed supply (raw, 18 decimals). Minted to the Factory until launch. */
    initialSupply: bigint | string;
    /** Deterministic deploy salt. Defaults to a timestamp-derived value. */
    salt?: bigint | string;
}
/** Ekubo pool params (off-chain tick). The `startingPrice` is an Ekubo i129 tick. */
interface EkuboPoolParams {
    fee: bigint | string;
    tickSpacing: bigint | string;
    startingPrice: {
        mag: bigint | string;
        sign: boolean;
    };
    bound: bigint | string;
}
interface EkuboLaunchParams {
    creatorCoin: string;
    /** Quote token (e.g. STRK). Must NOT itself be a Creator Coin. */
    quoteToken: string;
    /** Team-allocation recipients (≤10% of supply, summed). */
    initialHolders: string[];
    initialHoldersAmounts: (bigint | string)[];
    /** Anti-snipe window in seconds. 0 = none. */
    transferRestrictionDelay?: number;
    /** Max % of supply buyable per tx during the window, in bps (≥50 = 0.5%). */
    maxPercentageBuyLaunch?: number;
    /** Ekubo pool params. Defaults to {@link VALIDATED_EKUBO_PARAMS} (0.01 quote/coin). */
    ekubo?: EkuboPoolParams;
    /**
     * Quote (raw units) to transfer to the Factory in the same multicall, used to
     * buy the team allocation back out of the pool. Must cover
     * `sum(initialHoldersAmounts) × price` (leftover is returned to the caller).
     * If omitted, the Factory must already hold enough quote.
     */
    quoteFundAmount?: bigint | string;
}
/**
 * Smoke-validated Ekubo params (mainnet 2026-06-04): 0.01 quote/coin for an
 * 18-decimal quote. `sign: true` yields 0.01 quote/coin regardless of token0/1
 * ordering — the launcher compensates internally.
 *
 * TODO: a `priceToEkuboParams(price, quoteDecimals, tickSpacing)` helper (port of
 * unrug's `ekubo/helpers.cairo` tick math) so callers can pick an arbitrary price.
 */
declare const VALIDATED_EKUBO_PARAMS: EkuboPoolParams;
/** A Creator Coin's live spot price, read from its Ekubo pool. */
interface CreatorCoinPrice {
    /** Quote tokens per 1 coin, human units (e.g. 0.0101 = 0.0101 STRK/coin). */
    quotePerCoin: number;
    /** The quote token the coin is paired against on Ekubo. */
    quoteToken: string;
    quoteSymbol: string | null;
    quoteDecimals: number;
}
/**
 * Read a Creator Coin's live spot price directly from its Ekubo pool (read-only).
 *
 * Self-contained: discovers the pool params (quote token, fee, tick spacing) from the
 * coin's own `launched_with_liquidity_parameters`, reads `Core.get_pool_price`, and
 * converts the `sqrt_ratio` to quote-per-coin (handling token0/1 ordering + decimals).
 * Returns `null` if the coin isn't launched on Ekubo. No backend, no swap-quote
 * dependency — works for day-one coins that AVNU doesn't index yet.
 */
declare function getCreatorCoinPrice(coinAddress: string, provider: ProviderInterface): Promise<CreatorCoinPrice | null>;
/** Build the `create_creator_coin` call (full supply minted to the Factory). */
declare function buildCreateCreatorCoinCall(params: CreateCreatorCoinParams): Call;
/**
 * Build the Ekubo launch multicall: optional quote `transfer` (pre-funds the
 * Factory for the team-allocation buyback) + `launch_on_ekubo`.
 */
declare function buildLaunchOnEkuboCalls(params: EkuboLaunchParams): Call[];
/** Minimal receipt shape — works with any starknet.js receipt version. */
interface CreatorCoinReceiptLike {
    events?: Array<{
        from_address?: string;
        keys?: string[];
        data?: string[];
    }>;
}
/**
 * Pull the deployed coin address from a `create_creator_coin` tx receipt.
 * Event data = [owner, name, symbol, supply_low, supply_high, coin_address].
 * Throws when the receipt carries no matching Factory event.
 */
declare function parseCreatorCoinCreated(receipt: CreatorCoinReceiptLike): string;
/**
 * On-chain Creator Coin interactions (Ekubo-only launchpad).
 * Faithful fork of unruggable.meme — permanent LP lock + team-allocation buyback.
 */
declare class CreatorCoinService {
    private readonly factoryAddress;
    private readonly config;
    constructor(config: ResolvedConfig);
    private _factory;
    /** Deploy a fixed-supply CreatorCoin (full supply minted to the Factory). */
    createCreatorCoin(account: AccountInterface, params: CreateCreatorCoinParams): Promise<TxResult>;
    /**
     * Launch a coin on Ekubo (owner-only). Optionally pre-funds the Factory with
     * quote (for the buyback) in the same multicall. Liquidity is permanently
     * locked in the EkuboLauncher.
     */
    launchOnEkubo(account: AccountInterface, params: EkuboLaunchParams): Promise<TxResult>;
    /** View: is this address a Factory-deployed Creator Coin? */
    isCreatorCoin(address: string, account: AccountInterface): Promise<boolean>;
    /** Read a coin's live Ekubo spot price (quote-per-coin) via the configured RPC.
     *  Read-only; returns null if the coin isn't launched on Ekubo. */
    getPrice(coinAddress: string): Promise<CreatorCoinPrice | null>;
}

declare class TicketService {
    private readonly factoryAddress?;
    constructor(config: ResolvedConfig);
    private _collection;
    /** Deploys a new IPTicketCollection via the factory. Caller becomes its owner. */
    deployTicketCollection(account: AccountInterface, params: {
        name: string;
        symbol: string;
        factoryAddress?: string;
    }): Promise<TxResult>;
    /** Owner-only. Creates a new ticket collection (event/tier) inside the caller's deployed IPTicketCollection. */
    createTicketCollection(account: AccountInterface, params: CreateTicketCollectionParams): Promise<TxResult>;
    /** Owner-only. Gates minting only — existing tickets keep access/transfer/redeem. */
    setCollectionActive(account: AccountInterface, params: {
        collection: string;
        collectionId: bigint | string;
        active: boolean;
    }): Promise<TxResult>;
    /** Mints a ticket. Prepends an ERC-20 approve when the collection is paid. */
    mintTicket(account: AccountInterface, params: {
        collection: string;
        collectionId: bigint | string;
        paymentToken?: string;
        price?: bigint | string;
    }): Promise<TxResult>;
    /** Only the current token owner may redeem. */
    redeemTicket(account: AccountInterface, params: {
        collection: string;
        tokenId: bigint | string;
    }): Promise<TxResult>;
}

declare class ClubService {
    private readonly registryAddress?;
    private readonly factoryAddress?;
    constructor(config: ResolvedConfig);
    private _registry;
    private _factory;
    private _collection;
    /** Deploy a new per-creator membership ERC-721 collection via the factory. */
    deployClub(account: AccountInterface, params: DeployClubParams): Promise<TxResult>;
    /** Owner-only — pause or resume new mints on a club collection. */
    setOpen(account: AccountInterface, params: {
        collectionAddress: string;
        open: boolean;
    }): Promise<TxResult>;
    /** Public mint — caller pays entry fee (if any) and receives the membership NFT. */
    mintMembership(account: AccountInterface, params: {
        collectionAddress: string;
        to?: string;
        entryFee?: bigint | string;
        paymentToken?: string;
    }): Promise<TxResult>;
    /** @deprecated Use deployClub — the factory pattern replaced the registry. */
    createClub(account: AccountInterface, params: CreateClubParams & {
        registryAddress?: string;
    }): Promise<TxResult>;
    /** @deprecated Legacy registry — use factory-deployed collection methods. */
    setClubOpen(account: AccountInterface, params: {
        clubId: bigint | string;
        open: boolean;
        registryAddress?: string;
    }): Promise<TxResult>;
    /** @deprecated Legacy registry — use mintMembership with factory-deployed collections. */
    joinClub(account: AccountInterface, params: {
        clubId: bigint | string;
        entryFee?: bigint | string;
        paymentToken?: string;
        registryAddress?: string;
    }): Promise<TxResult>;
    /** @deprecated Legacy registry — use factory-deployed collection burn. */
    leaveClub(account: AccountInterface, params: {
        clubId: bigint | string;
        tokenId: bigint | string;
        registryAddress?: string;
    }): Promise<TxResult>;
}

declare class SponsorshipService {
    private readonly sponsorshipAddress?;
    private readonly licenseReceiptAddress?;
    constructor(config: ResolvedConfig);
    private _sponsorship;
    /** The offer author must currently own (nftContract, tokenId) — enforced on-chain at create and accept. */
    createOffer(account: AccountInterface, params: CreateSponsorshipOfferParams & {
        sponsorshipAddress?: string;
    }): Promise<TxResult>;
    /** Reversible — gates new bids/acceptance only. */
    setOfferOpen(account: AccountInterface, params: {
        offerId: bigint | string;
        open: boolean;
        sponsorshipAddress?: string;
    }): Promise<TxResult>;
    /** A bid is a signal plus an open ERC-20 allowance — no tokens move until accepted. Prepends the approve. */
    placeBid(account: AccountInterface, params: {
        offerId: bigint | string;
        amount: bigint | string;
        paymentToken: string;
        sponsorshipAddress?: string;
    }): Promise<TxResult>;
    retractBid(account: AccountInterface, params: {
        offerId: bigint | string;
        sponsorshipAddress?: string;
    }): Promise<TxResult>;
    /**
     * Author-only. Settles the sponsor's payment (allowance pull, no escrow) and
     * mints a non-authoritative receipt NFT to the sponsor via the dedicated
     * sponsorship-license IPGenesis instance — never the genesis-mint instance.
     * `is_license_valid()` on IPSponsorship remains the sole authority for
     * gating/perks; the receipt is a wallet-visible courtesy only.
     */
    acceptBid(account: AccountInterface, params: {
        offerId: bigint | string;
        sponsor: string;
        licenseTermsUri: string;
        sponsorshipAddress?: string;
        licenseReceiptAddress?: string;
    }): Promise<TxResult>;
    /**
     * Best-effort — bundles a receipt-NFT transfer alongside `transfer_license`
     * when both `licenseReceiptAddress` and `receiptTokenId` are supplied.
     * IPSponsorship's own license ownership stays authoritative regardless of
     * whether the receipt NFT is kept in sync.
     */
    transferLicense(account: AccountInterface, params: {
        licenseId: bigint | string;
        to: string;
        sponsorshipAddress?: string;
        licenseReceiptAddress?: string;
        receiptTokenId?: bigint | string;
    }): Promise<TxResult>;
}

declare class MedialaneClient {
    /** On-chain marketplace interactions for ERC-721 assets (create listing, fulfill order, etc.) */
    readonly marketplace: MarketplaceModule;
    /** On-chain marketplace interactions for ERC-1155 assets (Medialane1155 contract). */
    readonly marketplace1155: Medialane1155Module;
    /**
     * Off-chain API client — covers all /v1/* backend endpoints.
     * Requires `backendUrl` in config; pass `apiKey` for authenticated routes.
     */
    readonly api: ApiClient;
    readonly services: {
        readonly pop: PopService;
        readonly drop: DropService;
        readonly erc1155Collection: ERC1155CollectionService;
        readonly creatorCoin: CreatorCoinService;
        readonly ticket: TicketService;
        readonly club: ClubService;
        readonly sponsorship: SponsorshipService;
    };
    private readonly config;
    constructor(rawConfig?: MedialaneConfig);
    get chain(): "STARKNET" | "ETHEREUM" | "SOLANA" | "BASE" | "STELLAR" | "BITCOIN";
    get rpcUrl(): string;
    get marketplaceContract(): string;
}

/** What a stored/registered order resolves to for fulfilment/cancellation. */
interface ResolvedOrder {
    /** ERC-20 consideration token address. */
    paymentToken: string;
    /** Per-unit price in raw token units, as a decimal string. The total paid is
     *  `unitPrice × quantity` (quantity is 1 for ERC-721). */
    unitPrice: string;
    /** Which venue the order lives on. */
    standard: "ERC721" | "ERC1155";
}
/**
 * Dependencies for {@link StarknetVenue}. The token standard is resolved through
 * injected reads (the backend already tracks it per collection) rather than an
 * on-chain interface probe — Starknet has no single canonical ERC-1155 interface
 * id and the app already carries the standard from the indexer.
 */
interface StarknetVenueDeps {
    config: ResolvedConfig;
    provider: ProviderInterface;
    /** Resolve a registered order (payment token, total, venue) from its digest. */
    resolveOrder: (orderRef: OrderRef) => Promise<ResolvedOrder>;
    /** Resolve a collection's token standard (from the indexer). */
    resolveStandard: (contract: string) => Promise<"ERC721" | "ERC1155">;
}
/**
 * First-class Starknet venue adapter. Wraps the maintained `MarketplaceModule`
 * (721) and `Medialane1155Module` (1155) — it does not reimplement SNIP-12
 * signing or calldata. `Signer` is a starknet.js `AccountInterface`.
 */
declare class StarknetVenue implements VenueAdapter<AccountInterface> {
    private readonly deps;
    readonly chain: "STARKNET";
    private readonly m721;
    private readonly m1155;
    constructor(deps: StarknetVenueDeps);
    incrementCounter(signer: AccountInterface): Promise<AdapterTxResult>;
    getOrderDetails(orderRef: OrderRef): Promise<unknown>;
    getCounter(address: string): Promise<bigint>;
    fulfillOrder(signer: AccountInterface, orderRef: OrderRef, opts?: {
        quantity?: string;
    } & Record<string, string | undefined>): Promise<AdapterTxResult>;
    cancelOrder(signer: AccountInterface, orderRef: OrderRef): Promise<AdapterTxResult>;
    registerOrder(signer: AccountInterface, p: RegisterOrderParams): Promise<AdapterTxResult & {
        orderRef: OrderRef;
    }>;
    private durationSeconds;
    /** The canonical Starknet order id = the contract-emitted `OrderCreated`
     *  hash (`keys[1]`), which is exactly what the indexer stores. */
    private orderRefFromReceipt;
}

type FeeSurface = "marketplace" | "launchpad";
interface BuildFeeCallParams {
    surface: FeeSurface;
    /** ERC-20 address the gross amount is denominated in. */
    token: string;
    /** Gross amount in raw token units (e.g. price in wei, or price * quantity). */
    grossAmount: bigint;
}
/**
 * The single source of truth for the platform fee. Returns one ERC-20
 * `transfer(fundAddress, feeAmount)` Call to bundle into the settlement
 * multicall, or `null` when no fee should be charged.
 *
 * Fail-safe: returns null if disabled, no fund address, or the fee floors to 0.
 */
declare function buildFeeCall(p: BuildFeeCallParams, cfg: ResolvedFeeConfig): Call | null;

declare const ADMIN_SCOPE = "admin-api";
/** The wallet-signed authorization for a session key. */
interface AdminGrant {
    wallet: string;
    chain: string;
    sessionPublicKey: string;
    sessionKeyHash: string;
    scope: string;
    issuedAt: number;
    expiresAt: number;
    walletSig: string[];
}
interface AdminSession {
    grant: AdminGrant;
    sessionPrivateKey: string;
}
interface AdminRequest {
    method: string;
    path: string;
    body: string;
    nonce: string;
    ts: number;
}
/** Compact session-key signature over adminRequestDigest. */
type AdminRequestSig = string;

/**
 * Canonical felt digest of a request — the SINGLE definition shared by signer
 * (portal/agent) and verifier (backend). Binds method+path+query+body+nonce+ts,
 * so a captured request cannot be retargeted or mutated without invalidating it.
 */
declare function adminRequestDigest(req: AdminRequest): string;

/** Sign a request with the session private key. */
declare function signAdminRequest(sessionPrivateKey: string, req: AdminRequest): AdminRequestSig;
/** Verify a request signature against the full session public key. */
declare function verifyAdminRequestSig(sessionPublicKey: string, req: AdminRequest, sig: AdminRequestSig): boolean;

interface AdminSessionTypedDataInput {
    sessionKeyHash: string;
    scope: string;
    issuedAt: number;
    expiresAt: number;
    chainId?: string;
}
/** The SNIP-12 typed data the wallet signs — rebuilt identically on the backend. */
declare function buildAdminSessionTypedData(p: AdminSessionTypedDataInput): {
    readonly types: {
        readonly StarknetDomain: readonly [{
            readonly name: "name";
            readonly type: "shortstring";
        }, {
            readonly name: "version";
            readonly type: "shortstring";
        }, {
            readonly name: "chainId";
            readonly type: "shortstring";
        }, {
            readonly name: "revision";
            readonly type: "shortstring";
        }];
        readonly AdminSession: readonly [{
            readonly name: "sessionKeyHash";
            readonly type: "felt";
        }, {
            readonly name: "scope";
            readonly type: "shortstring";
        }, {
            readonly name: "issuedAt";
            readonly type: "felt";
        }, {
            readonly name: "expiresAt";
            readonly type: "felt";
        }];
    };
    readonly primaryType: "AdminSession";
    readonly domain: {
        readonly name: "Medialane Admin";
        readonly version: "1";
        readonly chainId: string;
        readonly revision: "1";
    };
    readonly message: {
        readonly sessionKeyHash: string;
        readonly scope: string;
        readonly issuedAt: string;
        readonly expiresAt: string;
    };
};
/** felt commitment to a full session public key (fits in the signed message). */
declare function sessionKeyHashOf(sessionPublicKey: string): string;
interface CreateGrantOpts {
    wallet: string;
    chain?: string;
    chainId?: string;
    ttlSeconds?: number;
    now?: () => number;
}
/**
 * Generate an ephemeral session keypair and have `signTypedData` (the connected
 * wallet's signMessage) sign the grant. The private key never leaves the caller.
 */
declare function createAdminSessionGrant(signTypedData: (data: ReturnType<typeof buildAdminSessionTypedData>) => Promise<string[]>, opts: CreateGrantOpts): Promise<AdminSession>;

declare const ADMIN_HEADERS: {
    readonly grant: "x-ml-admin-grant";
    readonly sig: "x-ml-admin-sig";
    readonly nonce: "x-ml-admin-nonce";
    readonly ts: "x-ml-admin-ts";
};
declare function randomNonce(): string;
/** Build the four request headers from a session + (method, path, body). */
declare function encodeAdminHeaders(session: AdminSession, reqInit: {
    method: string;
    path: string;
    body?: string;
    now?: () => number;
}): Record<string, string>;
interface ParsedAdminHeaders {
    grant: AdminGrant;
    sig: string;
    nonce: string;
    ts: number;
}
/** Parse + shape-check the headers on the backend. Returns null if malformed. */
declare function parseAdminHeaders(get: (name: string) => string | null | undefined): ParsedAdminHeaders | null;

/** Anything that can produce a Starknet signature over SNIP-12 typed data. */
interface SiwsSigner {
    signMessage: (typedData: TypedData) => Promise<unknown>;
}
interface RequestSiwsTokenArgs {
    /** Medialane backend base URL (each app resolves this per its own env/proxy setup). */
    backendUrl: string;
    walletAddress: string;
    signer: SiwsSigner;
}

declare function getSiwsStorageKey(address: string): string;
declare function isSiwsTokenValid(token: string | null | undefined): token is string;
/** Browser-only (returns null server-side, same as a cache miss). */
declare function getStoredSiwsToken(address: string): string | null;
/** Browser-only (no-op server-side). */
declare function storeSiwsToken(address: string, token: string): void;
declare function normalizeSiwsSignature(signature: unknown): string[];
/**
 * Request a nonce, sign it with `signer`, verify with the backend, and cache
 * the resulting token in localStorage (expiry-aware). Single source for the
 * SIWS client protocol — medialane-starknet and medialane-io both delegate
 * to this instead of keeping their own copies (see medialane-core/docs/specs/
 * 2026-06-30-remove-clerk-from-backend-design.md §IX).
 */
declare function requestSiwsToken({ backendUrl, walletAddress, signer, }: RequestSiwsTokenArgs): Promise<string>;

declare const IPMarketplaceABI: readonly [{
    readonly type: "impl";
    readonly name: "Medialane721Impl";
    readonly interface_name: "medialane_marketplace_erc721::core::interface::IMedialane";
}, {
    readonly type: "struct";
    readonly name: "medialane_marketplace_erc721::core::types::OfferItem";
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
        readonly name: "amount";
        readonly type: "core::felt252";
    }];
}, {
    readonly type: "struct";
    readonly name: "medialane_marketplace_erc721::core::types::ConsiderationItem";
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
        readonly name: "amount";
        readonly type: "core::felt252";
    }, {
        readonly name: "recipient";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }];
}, {
    readonly type: "struct";
    readonly name: "medialane_marketplace_erc721::core::types::OrderParameters";
    readonly members: readonly [{
        readonly name: "offerer";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }, {
        readonly name: "marketplace";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }, {
        readonly name: "offer";
        readonly type: "medialane_marketplace_erc721::core::types::OfferItem";
    }, {
        readonly name: "consideration";
        readonly type: "medialane_marketplace_erc721::core::types::ConsiderationItem";
    }, {
        readonly name: "royalty_max_bps";
        readonly type: "core::felt252";
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
        readonly name: "counter";
        readonly type: "core::felt252";
    }];
}, {
    readonly type: "struct";
    readonly name: "medialane_marketplace_erc721::core::types::Order";
    readonly members: readonly [{
        readonly name: "parameters";
        readonly type: "medialane_marketplace_erc721::core::types::OrderParameters";
    }, {
        readonly name: "signature";
        readonly type: "core::array::Array::<core::felt252>";
    }];
}, {
    readonly type: "struct";
    readonly name: "medialane_marketplace_erc721::core::types::OrderCancellation";
    readonly members: readonly [{
        readonly name: "order_hash";
        readonly type: "core::felt252";
    }, {
        readonly name: "offerer";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }];
}, {
    readonly type: "struct";
    readonly name: "medialane_marketplace_erc721::core::types::CancelRequest";
    readonly members: readonly [{
        readonly name: "cancelation";
        readonly type: "medialane_marketplace_erc721::core::types::OrderCancellation";
    }, {
        readonly name: "signature";
        readonly type: "core::array::Array::<core::felt252>";
    }];
}, {
    readonly type: "enum";
    readonly name: "medialane_marketplace_erc721::core::types::OrderStatus";
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
    readonly type: "struct";
    readonly name: "medialane_marketplace_erc721::core::types::OrderDetails";
    readonly members: readonly [{
        readonly name: "offerer";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }, {
        readonly name: "offer";
        readonly type: "medialane_marketplace_erc721::core::types::OfferItem";
    }, {
        readonly name: "consideration";
        readonly type: "medialane_marketplace_erc721::core::types::ConsiderationItem";
    }, {
        readonly name: "royalty_max_bps";
        readonly type: "core::felt252";
    }, {
        readonly name: "start_time";
        readonly type: "core::integer::u64";
    }, {
        readonly name: "end_time";
        readonly type: "core::integer::u64";
    }, {
        readonly name: "order_status";
        readonly type: "medialane_marketplace_erc721::core::types::OrderStatus";
    }, {
        readonly name: "counter";
        readonly type: "core::felt252";
    }];
}, {
    readonly type: "interface";
    readonly name: "medialane_marketplace_erc721::core::interface::IMedialane";
    readonly items: readonly [{
        readonly type: "function";
        readonly name: "register_order";
        readonly inputs: readonly [{
            readonly name: "order";
            readonly type: "medialane_marketplace_erc721::core::types::Order";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "fulfill_order";
        readonly inputs: readonly [{
            readonly name: "order_hash";
            readonly type: "core::felt252";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "cancel_order";
        readonly inputs: readonly [{
            readonly name: "cancel_request";
            readonly type: "medialane_marketplace_erc721::core::types::CancelRequest";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "increment_counter";
        readonly inputs: readonly [];
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
            readonly type: "medialane_marketplace_erc721::core::types::OrderDetails";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "get_order_hash";
        readonly inputs: readonly [{
            readonly name: "parameters";
            readonly type: "medialane_marketplace_erc721::core::types::OrderParameters";
        }, {
            readonly name: "signer";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly outputs: readonly [{
            readonly type: "core::felt252";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "get_cancellation_hash";
        readonly inputs: readonly [{
            readonly name: "cancellation";
            readonly type: "medialane_marketplace_erc721::core::types::OrderCancellation";
        }, {
            readonly name: "signer";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly outputs: readonly [{
            readonly type: "core::felt252";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "get_counter";
        readonly inputs: readonly [{
            readonly name: "offerer";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly outputs: readonly [{
            readonly type: "core::felt252";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "get_native_token_address";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly state_mutability: "view";
    }];
}, {
    readonly type: "constructor";
    readonly name: "constructor";
    readonly inputs: readonly [{
        readonly name: "native_token_address";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }];
}, {
    readonly type: "event";
    readonly name: "medialane_marketplace_erc721::core::events::OrderCreated";
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
    readonly type: "struct";
    readonly name: "core::integer::u256";
    readonly members: readonly [{
        readonly name: "low";
        readonly type: "core::integer::u128";
    }, {
        readonly name: "high";
        readonly type: "core::integer::u128";
    }];
}, {
    readonly type: "event";
    readonly name: "medialane_marketplace_erc721::core::events::OrderFulfilled";
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
    }, {
        readonly name: "sale_amount";
        readonly type: "core::integer::u256";
        readonly kind: "data";
    }, {
        readonly name: "royalty_receiver";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "data";
    }, {
        readonly name: "royalty_amount";
        readonly type: "core::integer::u256";
        readonly kind: "data";
    }];
}, {
    readonly type: "event";
    readonly name: "medialane_marketplace_erc721::core::events::OrderCancelled";
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
    readonly name: "medialane_marketplace_erc721::core::events::CounterIncremented";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "offerer";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "new_counter";
        readonly type: "core::felt252";
        readonly kind: "data";
    }];
}, {
    readonly type: "event";
    readonly name: "medialane_marketplace_erc721::core::medialane::Medialane721::Event";
    readonly kind: "enum";
    readonly variants: readonly [{
        readonly name: "OrderCreated";
        readonly type: "medialane_marketplace_erc721::core::events::OrderCreated";
        readonly kind: "nested";
    }, {
        readonly name: "OrderFulfilled";
        readonly type: "medialane_marketplace_erc721::core::events::OrderFulfilled";
        readonly kind: "nested";
    }, {
        readonly name: "OrderCancelled";
        readonly type: "medialane_marketplace_erc721::core::events::OrderCancelled";
        readonly kind: "nested";
    }, {
        readonly name: "CounterIncremented";
        readonly type: "medialane_marketplace_erc721::core::events::CounterIncremented";
        readonly kind: "nested";
    }];
}];

declare const POPCollectionABI: readonly [{
    readonly type: "struct";
    readonly name: "core::byte_array::ByteArray";
    readonly members: readonly [{
        readonly name: "data";
        readonly type: "core::array::Array::<core::felt252>";
    }, {
        readonly name: "pending_word";
        readonly type: "core::felt252";
    }, {
        readonly name: "pending_word_len";
        readonly type: "core::integer::u32";
    }];
}, {
    readonly type: "function";
    readonly name: "claim";
    readonly inputs: readonly [];
    readonly outputs: readonly [];
    readonly state_mutability: "external";
}, {
    readonly type: "function";
    readonly name: "admin_mint";
    readonly inputs: readonly [{
        readonly name: "recipient";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }, {
        readonly name: "custom_uri";
        readonly type: "core::byte_array::ByteArray";
    }];
    readonly outputs: readonly [];
    readonly state_mutability: "external";
}, {
    readonly type: "function";
    readonly name: "add_to_allowlist";
    readonly inputs: readonly [{
        readonly name: "address";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }];
    readonly outputs: readonly [];
    readonly state_mutability: "external";
}, {
    readonly type: "function";
    readonly name: "batch_add_to_allowlist";
    readonly inputs: readonly [{
        readonly name: "addresses";
        readonly type: "core::array::Array::<core::starknet::contract_address::ContractAddress>";
    }];
    readonly outputs: readonly [];
    readonly state_mutability: "external";
}, {
    readonly type: "function";
    readonly name: "remove_from_allowlist";
    readonly inputs: readonly [{
        readonly name: "address";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }];
    readonly outputs: readonly [];
    readonly state_mutability: "external";
}, {
    readonly type: "function";
    readonly name: "set_token_uri";
    readonly inputs: readonly [{
        readonly name: "token_id";
        readonly type: "core::integer::u256";
    }, {
        readonly name: "uri";
        readonly type: "core::byte_array::ByteArray";
    }];
    readonly outputs: readonly [];
    readonly state_mutability: "external";
}, {
    readonly type: "function";
    readonly name: "set_paused";
    readonly inputs: readonly [{
        readonly name: "paused";
        readonly type: "core::bool";
    }];
    readonly outputs: readonly [];
    readonly state_mutability: "external";
}, {
    readonly type: "function";
    readonly name: "is_eligible";
    readonly inputs: readonly [{
        readonly name: "address";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }];
    readonly outputs: readonly [{
        readonly type: "core::bool";
    }];
    readonly state_mutability: "view";
}, {
    readonly type: "function";
    readonly name: "has_claimed";
    readonly inputs: readonly [{
        readonly name: "address";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }];
    readonly outputs: readonly [{
        readonly type: "core::bool";
    }];
    readonly state_mutability: "view";
}, {
    readonly type: "function";
    readonly name: "total_minted";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "core::integer::u256";
    }];
    readonly state_mutability: "view";
}];

declare const POPFactoryABI: readonly [{
    readonly type: "struct";
    readonly name: "core::byte_array::ByteArray";
    readonly members: readonly [{
        readonly name: "data";
        readonly type: "core::array::Array::<core::felt252>";
    }, {
        readonly name: "pending_word";
        readonly type: "core::felt252";
    }, {
        readonly name: "pending_word_len";
        readonly type: "core::integer::u32";
    }];
}, {
    readonly type: "enum";
    readonly name: "pop_protocol::types::EventType";
    readonly variants: readonly [{
        readonly name: "Conference";
        readonly type: "()";
    }, {
        readonly name: "Bootcamp";
        readonly type: "()";
    }, {
        readonly name: "Workshop";
        readonly type: "()";
    }, {
        readonly name: "Hackathon";
        readonly type: "()";
    }, {
        readonly name: "Meetup";
        readonly type: "()";
    }, {
        readonly name: "Course";
        readonly type: "()";
    }, {
        readonly name: "Other";
        readonly type: "()";
    }];
}, {
    readonly type: "function";
    readonly name: "create_collection";
    readonly inputs: readonly [{
        readonly name: "name";
        readonly type: "core::byte_array::ByteArray";
    }, {
        readonly name: "symbol";
        readonly type: "core::byte_array::ByteArray";
    }, {
        readonly name: "base_uri";
        readonly type: "core::byte_array::ByteArray";
    }, {
        readonly name: "claim_end_time";
        readonly type: "core::integer::u64";
    }, {
        readonly name: "event_type";
        readonly type: "pop_protocol::types::EventType";
    }];
    readonly outputs: readonly [{
        readonly type: "core::starknet::contract_address::ContractAddress";
    }];
    readonly state_mutability: "external";
}, {
    readonly type: "function";
    readonly name: "register_provider";
    readonly inputs: readonly [{
        readonly name: "provider";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }, {
        readonly name: "name";
        readonly type: "core::byte_array::ByteArray";
    }, {
        readonly name: "website_url";
        readonly type: "core::byte_array::ByteArray";
    }];
    readonly outputs: readonly [];
    readonly state_mutability: "external";
}, {
    readonly type: "function";
    readonly name: "set_pop_collection_class_hash";
    readonly inputs: readonly [{
        readonly name: "new_class_hash";
        readonly type: "core::starknet::class_hash::ClassHash";
    }];
    readonly outputs: readonly [];
    readonly state_mutability: "external";
}];

declare const DropCollectionABI: readonly [{
    readonly type: "struct";
    readonly name: "core::byte_array::ByteArray";
    readonly members: readonly [{
        readonly name: "data";
        readonly type: "core::array::Array::<core::felt252>";
    }, {
        readonly name: "pending_word";
        readonly type: "core::felt252";
    }, {
        readonly name: "pending_word_len";
        readonly type: "core::integer::u32";
    }];
}, {
    readonly type: "struct";
    readonly name: "collection_drop::types::ClaimConditions";
    readonly members: readonly [{
        readonly name: "start_time";
        readonly type: "core::integer::u64";
    }, {
        readonly name: "end_time";
        readonly type: "core::integer::u64";
    }, {
        readonly name: "price";
        readonly type: "core::integer::u256";
    }, {
        readonly name: "payment_token";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }, {
        readonly name: "max_quantity_per_wallet";
        readonly type: "core::integer::u256";
    }];
}, {
    readonly type: "function";
    readonly name: "claim";
    readonly inputs: readonly [{
        readonly name: "quantity";
        readonly type: "core::integer::u256";
    }];
    readonly outputs: readonly [];
    readonly state_mutability: "external";
}, {
    readonly type: "function";
    readonly name: "admin_mint";
    readonly inputs: readonly [{
        readonly name: "recipient";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }, {
        readonly name: "quantity";
        readonly type: "core::integer::u256";
    }, {
        readonly name: "custom_uri";
        readonly type: "core::byte_array::ByteArray";
    }];
    readonly outputs: readonly [];
    readonly state_mutability: "external";
}, {
    readonly type: "function";
    readonly name: "set_claim_conditions";
    readonly inputs: readonly [{
        readonly name: "conditions";
        readonly type: "collection_drop::types::ClaimConditions";
    }];
    readonly outputs: readonly [];
    readonly state_mutability: "external";
}, {
    readonly type: "function";
    readonly name: "get_claim_conditions";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "collection_drop::types::ClaimConditions";
    }];
    readonly state_mutability: "view";
}, {
    readonly type: "function";
    readonly name: "set_allowlist_enabled";
    readonly inputs: readonly [{
        readonly name: "enabled";
        readonly type: "core::bool";
    }];
    readonly outputs: readonly [];
    readonly state_mutability: "external";
}, {
    readonly type: "function";
    readonly name: "is_allowlist_enabled";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "core::bool";
    }];
    readonly state_mutability: "view";
}, {
    readonly type: "function";
    readonly name: "add_to_allowlist";
    readonly inputs: readonly [{
        readonly name: "address";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }];
    readonly outputs: readonly [];
    readonly state_mutability: "external";
}, {
    readonly type: "function";
    readonly name: "batch_add_to_allowlist";
    readonly inputs: readonly [{
        readonly name: "addresses";
        readonly type: "core::array::Array::<core::starknet::contract_address::ContractAddress>";
    }];
    readonly outputs: readonly [];
    readonly state_mutability: "external";
}, {
    readonly type: "function";
    readonly name: "remove_from_allowlist";
    readonly inputs: readonly [{
        readonly name: "address";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }];
    readonly outputs: readonly [];
    readonly state_mutability: "external";
}, {
    readonly type: "function";
    readonly name: "is_allowlisted";
    readonly inputs: readonly [{
        readonly name: "address";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }];
    readonly outputs: readonly [{
        readonly type: "core::bool";
    }];
    readonly state_mutability: "view";
}, {
    readonly type: "function";
    readonly name: "set_base_uri";
    readonly inputs: readonly [{
        readonly name: "new_uri";
        readonly type: "core::byte_array::ByteArray";
    }];
    readonly outputs: readonly [];
    readonly state_mutability: "external";
}, {
    readonly type: "function";
    readonly name: "set_token_uri";
    readonly inputs: readonly [{
        readonly name: "token_id";
        readonly type: "core::integer::u256";
    }, {
        readonly name: "uri";
        readonly type: "core::byte_array::ByteArray";
    }];
    readonly outputs: readonly [];
    readonly state_mutability: "external";
}, {
    readonly type: "function";
    readonly name: "set_paused";
    readonly inputs: readonly [{
        readonly name: "paused";
        readonly type: "core::bool";
    }];
    readonly outputs: readonly [];
    readonly state_mutability: "external";
}, {
    readonly type: "function";
    readonly name: "withdraw_payments";
    readonly inputs: readonly [];
    readonly outputs: readonly [];
    readonly state_mutability: "external";
}, {
    readonly type: "function";
    readonly name: "get_drop_id";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "core::integer::u256";
    }];
    readonly state_mutability: "view";
}, {
    readonly type: "function";
    readonly name: "get_max_supply";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "core::integer::u256";
    }];
    readonly state_mutability: "view";
}, {
    readonly type: "function";
    readonly name: "total_minted";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "core::integer::u256";
    }];
    readonly state_mutability: "view";
}, {
    readonly type: "function";
    readonly name: "remaining_supply";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "core::integer::u256";
    }];
    readonly state_mutability: "view";
}, {
    readonly type: "function";
    readonly name: "minted_by_wallet";
    readonly inputs: readonly [{
        readonly name: "wallet";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }];
    readonly outputs: readonly [{
        readonly type: "core::integer::u256";
    }];
    readonly state_mutability: "view";
}, {
    readonly type: "function";
    readonly name: "is_paused";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "core::bool";
    }];
    readonly state_mutability: "view";
}];

declare const DropFactoryABI: readonly [{
    readonly type: "struct";
    readonly name: "core::byte_array::ByteArray";
    readonly members: readonly [{
        readonly name: "data";
        readonly type: "core::array::Array::<core::felt252>";
    }, {
        readonly name: "pending_word";
        readonly type: "core::felt252";
    }, {
        readonly name: "pending_word_len";
        readonly type: "core::integer::u32";
    }];
}, {
    readonly type: "struct";
    readonly name: "collection_drop::types::ClaimConditions";
    readonly members: readonly [{
        readonly name: "start_time";
        readonly type: "core::integer::u64";
    }, {
        readonly name: "end_time";
        readonly type: "core::integer::u64";
    }, {
        readonly name: "price";
        readonly type: "core::integer::u256";
    }, {
        readonly name: "payment_token";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }, {
        readonly name: "max_quantity_per_wallet";
        readonly type: "core::integer::u256";
    }];
}, {
    readonly type: "function";
    readonly name: "register_organizer";
    readonly inputs: readonly [{
        readonly name: "organizer";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }, {
        readonly name: "name";
        readonly type: "core::byte_array::ByteArray";
    }];
    readonly outputs: readonly [];
    readonly state_mutability: "external";
}, {
    readonly type: "function";
    readonly name: "revoke_organizer";
    readonly inputs: readonly [{
        readonly name: "organizer";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }];
    readonly outputs: readonly [];
    readonly state_mutability: "external";
}, {
    readonly type: "function";
    readonly name: "is_active_organizer";
    readonly inputs: readonly [{
        readonly name: "organizer";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }];
    readonly outputs: readonly [{
        readonly type: "core::bool";
    }];
    readonly state_mutability: "view";
}, {
    readonly type: "function";
    readonly name: "create_drop";
    readonly inputs: readonly [{
        readonly name: "name";
        readonly type: "core::byte_array::ByteArray";
    }, {
        readonly name: "symbol";
        readonly type: "core::byte_array::ByteArray";
    }, {
        readonly name: "base_uri";
        readonly type: "core::byte_array::ByteArray";
    }, {
        readonly name: "max_supply";
        readonly type: "core::integer::u256";
    }, {
        readonly name: "initial_conditions";
        readonly type: "collection_drop::types::ClaimConditions";
    }];
    readonly outputs: readonly [{
        readonly type: "core::starknet::contract_address::ContractAddress";
    }];
    readonly state_mutability: "external";
}, {
    readonly type: "function";
    readonly name: "get_drop_address";
    readonly inputs: readonly [{
        readonly name: "drop_id";
        readonly type: "core::integer::u256";
    }];
    readonly outputs: readonly [{
        readonly type: "core::starknet::contract_address::ContractAddress";
    }];
    readonly state_mutability: "view";
}, {
    readonly type: "function";
    readonly name: "get_last_drop_id";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly type: "core::integer::u256";
    }];
    readonly state_mutability: "view";
}, {
    readonly type: "function";
    readonly name: "get_organizer_drop_count";
    readonly inputs: readonly [{
        readonly name: "organizer";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }];
    readonly outputs: readonly [{
        readonly type: "core::integer::u32";
    }];
    readonly state_mutability: "view";
}, {
    readonly type: "function";
    readonly name: "set_drop_collection_class_hash";
    readonly inputs: readonly [{
        readonly name: "new_class_hash";
        readonly type: "core::starknet::class_hash::ClassHash";
    }];
    readonly outputs: readonly [];
    readonly state_mutability: "external";
}];

declare const Medialane1155ABI: readonly [{
    readonly type: "impl";
    readonly name: "Medialane1155Impl";
    readonly interface_name: "medialane_marketplace_erc1155::core::interface::IMedialane1155";
}, {
    readonly type: "struct";
    readonly name: "medialane_marketplace_erc1155::core::types::OfferItem";
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
        readonly name: "amount";
        readonly type: "core::felt252";
    }];
}, {
    readonly type: "struct";
    readonly name: "medialane_marketplace_erc1155::core::types::ConsiderationItem";
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
        readonly name: "amount";
        readonly type: "core::felt252";
    }, {
        readonly name: "recipient";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }];
}, {
    readonly type: "struct";
    readonly name: "medialane_marketplace_erc1155::core::types::OrderParameters";
    readonly members: readonly [{
        readonly name: "offerer";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }, {
        readonly name: "marketplace";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }, {
        readonly name: "offer";
        readonly type: "medialane_marketplace_erc1155::core::types::OfferItem";
    }, {
        readonly name: "consideration";
        readonly type: "medialane_marketplace_erc1155::core::types::ConsiderationItem";
    }, {
        readonly name: "royalty_max_bps";
        readonly type: "core::felt252";
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
        readonly name: "counter";
        readonly type: "core::felt252";
    }];
}, {
    readonly type: "struct";
    readonly name: "medialane_marketplace_erc1155::core::types::Order";
    readonly members: readonly [{
        readonly name: "parameters";
        readonly type: "medialane_marketplace_erc1155::core::types::OrderParameters";
    }, {
        readonly name: "signature";
        readonly type: "core::array::Array::<core::felt252>";
    }];
}, {
    readonly type: "struct";
    readonly name: "medialane_marketplace_erc1155::core::types::OrderCancellation";
    readonly members: readonly [{
        readonly name: "order_hash";
        readonly type: "core::felt252";
    }, {
        readonly name: "offerer";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }];
}, {
    readonly type: "struct";
    readonly name: "medialane_marketplace_erc1155::core::types::CancelRequest";
    readonly members: readonly [{
        readonly name: "cancelation";
        readonly type: "medialane_marketplace_erc1155::core::types::OrderCancellation";
    }, {
        readonly name: "signature";
        readonly type: "core::array::Array::<core::felt252>";
    }];
}, {
    readonly type: "enum";
    readonly name: "medialane_marketplace_erc1155::core::types::OrderStatus";
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
    readonly type: "struct";
    readonly name: "medialane_marketplace_erc1155::core::types::OrderDetails";
    readonly members: readonly [{
        readonly name: "offerer";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }, {
        readonly name: "offer";
        readonly type: "medialane_marketplace_erc1155::core::types::OfferItem";
    }, {
        readonly name: "consideration";
        readonly type: "medialane_marketplace_erc1155::core::types::ConsiderationItem";
    }, {
        readonly name: "royalty_max_bps";
        readonly type: "core::felt252";
    }, {
        readonly name: "start_time";
        readonly type: "core::integer::u64";
    }, {
        readonly name: "end_time";
        readonly type: "core::integer::u64";
    }, {
        readonly name: "order_status";
        readonly type: "medialane_marketplace_erc1155::core::types::OrderStatus";
    }, {
        readonly name: "remaining_amount";
        readonly type: "core::felt252";
    }, {
        readonly name: "counter";
        readonly type: "core::felt252";
    }];
}, {
    readonly type: "interface";
    readonly name: "medialane_marketplace_erc1155::core::interface::IMedialane1155";
    readonly items: readonly [{
        readonly type: "function";
        readonly name: "register_order";
        readonly inputs: readonly [{
            readonly name: "order";
            readonly type: "medialane_marketplace_erc1155::core::types::Order";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "fulfill_order";
        readonly inputs: readonly [{
            readonly name: "order_hash";
            readonly type: "core::felt252";
        }, {
            readonly name: "quantity";
            readonly type: "core::felt252";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "cancel_order";
        readonly inputs: readonly [{
            readonly name: "cancel_request";
            readonly type: "medialane_marketplace_erc1155::core::types::CancelRequest";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "increment_counter";
        readonly inputs: readonly [];
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
            readonly type: "medialane_marketplace_erc1155::core::types::OrderDetails";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "get_order_hash";
        readonly inputs: readonly [{
            readonly name: "parameters";
            readonly type: "medialane_marketplace_erc1155::core::types::OrderParameters";
        }, {
            readonly name: "signer";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly outputs: readonly [{
            readonly type: "core::felt252";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "get_cancellation_hash";
        readonly inputs: readonly [{
            readonly name: "cancellation";
            readonly type: "medialane_marketplace_erc1155::core::types::OrderCancellation";
        }, {
            readonly name: "signer";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly outputs: readonly [{
            readonly type: "core::felt252";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "get_counter";
        readonly inputs: readonly [{
            readonly name: "offerer";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly outputs: readonly [{
            readonly type: "core::felt252";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "get_native_token_address";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly state_mutability: "view";
    }];
}, {
    readonly type: "constructor";
    readonly name: "constructor";
    readonly inputs: readonly [{
        readonly name: "native_token_address";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }];
}, {
    readonly type: "event";
    readonly name: "medialane_marketplace_erc1155::core::events::OrderCreated";
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
    readonly type: "struct";
    readonly name: "core::integer::u256";
    readonly members: readonly [{
        readonly name: "low";
        readonly type: "core::integer::u128";
    }, {
        readonly name: "high";
        readonly type: "core::integer::u128";
    }];
}, {
    readonly type: "event";
    readonly name: "medialane_marketplace_erc1155::core::events::OrderFulfilled";
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
    }, {
        readonly name: "quantity";
        readonly type: "core::felt252";
        readonly kind: "data";
    }, {
        readonly name: "remaining_amount";
        readonly type: "core::felt252";
        readonly kind: "data";
    }, {
        readonly name: "sale_amount";
        readonly type: "core::integer::u256";
        readonly kind: "data";
    }, {
        readonly name: "royalty_receiver";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "data";
    }, {
        readonly name: "royalty_amount";
        readonly type: "core::integer::u256";
        readonly kind: "data";
    }];
}, {
    readonly type: "event";
    readonly name: "medialane_marketplace_erc1155::core::events::OrderCancelled";
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
    readonly name: "medialane_marketplace_erc1155::core::events::CounterIncremented";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "offerer";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "new_counter";
        readonly type: "core::felt252";
        readonly kind: "data";
    }];
}, {
    readonly type: "event";
    readonly name: "medialane_marketplace_erc1155::core::medialane::Medialane1155::Event";
    readonly kind: "enum";
    readonly variants: readonly [{
        readonly name: "OrderCreated";
        readonly type: "medialane_marketplace_erc1155::core::events::OrderCreated";
        readonly kind: "nested";
    }, {
        readonly name: "OrderFulfilled";
        readonly type: "medialane_marketplace_erc1155::core::events::OrderFulfilled";
        readonly kind: "nested";
    }, {
        readonly name: "OrderCancelled";
        readonly type: "medialane_marketplace_erc1155::core::events::OrderCancelled";
        readonly kind: "nested";
    }, {
        readonly name: "CounterIncremented";
        readonly type: "medialane_marketplace_erc1155::core::events::CounterIncremented";
        readonly kind: "nested";
    }];
}];

declare const IPCollection1155FactoryABI: readonly [{
    readonly type: "impl";
    readonly name: "IPCollectionFactoryImpl";
    readonly interface_name: "ip_programmable_erc1155_collections::interfaces::IIPCollectionFactory::IIPCollectionFactory";
}, {
    readonly type: "struct";
    readonly name: "core::byte_array::ByteArray";
    readonly members: readonly [{
        readonly name: "data";
        readonly type: "core::array::Array::<core::bytes_31::bytes31>";
    }, {
        readonly name: "pending_word";
        readonly type: "core::felt252";
    }, {
        readonly name: "pending_word_len";
        readonly type: "core::internal::bounded_int::BoundedInt::<0, 30>";
    }];
}, {
    readonly type: "interface";
    readonly name: "ip_programmable_erc1155_collections::interfaces::IIPCollectionFactory::IIPCollectionFactory";
    readonly items: readonly [{
        readonly type: "function";
        readonly name: "collection_class_hash";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "core::starknet::class_hash::ClassHash";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "version";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "core::byte_array::ByteArray";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "deploy_collection";
        readonly inputs: readonly [{
            readonly name: "name";
            readonly type: "core::byte_array::ByteArray";
        }, {
            readonly name: "symbol";
            readonly type: "core::byte_array::ByteArray";
        }, {
            readonly name: "base_uri";
            readonly type: "core::byte_array::ByteArray";
        }];
        readonly outputs: readonly [{
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly state_mutability: "external";
    }];
}, {
    readonly type: "constructor";
    readonly name: "constructor";
    readonly inputs: readonly [{
        readonly name: "collection_class_hash";
        readonly type: "core::starknet::class_hash::ClassHash";
    }];
}, {
    readonly type: "event";
    readonly name: "ip_programmable_erc1155_collections::IPCollectionFactory::IPCollectionFactory::CollectionDeployed";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "collection_address";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "owner";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "name";
        readonly type: "core::byte_array::ByteArray";
        readonly kind: "data";
    }, {
        readonly name: "symbol";
        readonly type: "core::byte_array::ByteArray";
        readonly kind: "data";
    }, {
        readonly name: "base_uri";
        readonly type: "core::byte_array::ByteArray";
        readonly kind: "data";
    }];
}, {
    readonly type: "event";
    readonly name: "ip_programmable_erc1155_collections::IPCollectionFactory::IPCollectionFactory::Event";
    readonly kind: "enum";
    readonly variants: readonly [{
        readonly name: "CollectionDeployed";
        readonly type: "ip_programmable_erc1155_collections::IPCollectionFactory::IPCollectionFactory::CollectionDeployed";
        readonly kind: "nested";
    }];
}];

declare const IPCollection1155ABI: readonly [{
    readonly type: "impl";
    readonly name: "ERC1155MetadataURIImpl";
    readonly interface_name: "openzeppelin_token::erc1155::interface::IERC1155MetadataURI";
}, {
    readonly type: "struct";
    readonly name: "core::integer::u256";
    readonly members: readonly [{
        readonly name: "low";
        readonly type: "core::integer::u128";
    }, {
        readonly name: "high";
        readonly type: "core::integer::u128";
    }];
}, {
    readonly type: "struct";
    readonly name: "core::byte_array::ByteArray";
    readonly members: readonly [{
        readonly name: "data";
        readonly type: "core::array::Array::<core::bytes_31::bytes31>";
    }, {
        readonly name: "pending_word";
        readonly type: "core::felt252";
    }, {
        readonly name: "pending_word_len";
        readonly type: "core::internal::bounded_int::BoundedInt::<0, 30>";
    }];
}, {
    readonly type: "interface";
    readonly name: "openzeppelin_token::erc1155::interface::IERC1155MetadataURI";
    readonly items: readonly [{
        readonly type: "function";
        readonly name: "uri";
        readonly inputs: readonly [{
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "core::byte_array::ByteArray";
        }];
        readonly state_mutability: "view";
    }];
}, {
    readonly type: "impl";
    readonly name: "IPCollectionImpl";
    readonly interface_name: "ip_programmable_erc1155_collections::interfaces::IIPCollection::IIPCollection";
}, {
    readonly type: "struct";
    readonly name: "core::array::Span::<core::integer::u256>";
    readonly members: readonly [{
        readonly name: "snapshot";
        readonly type: "@core::array::Array::<core::integer::u256>";
    }];
}, {
    readonly type: "struct";
    readonly name: "ip_programmable_erc1155_collections::types::TokenData";
    readonly members: readonly [{
        readonly name: "token_id";
        readonly type: "core::integer::u256";
    }, {
        readonly name: "metadata_uri";
        readonly type: "core::byte_array::ByteArray";
    }, {
        readonly name: "original_creator";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }, {
        readonly name: "registered_at";
        readonly type: "core::integer::u64";
    }];
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
    readonly name: "ip_programmable_erc1155_collections::interfaces::IIPCollection::IIPCollection";
    readonly items: readonly [{
        readonly type: "function";
        readonly name: "name";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "core::byte_array::ByteArray";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "symbol";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "core::byte_array::ByteArray";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "base_uri";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "core::byte_array::ByteArray";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "version";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "core::byte_array::ByteArray";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "mint_edition";
        readonly inputs: readonly [{
            readonly name: "to";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "value";
            readonly type: "core::integer::u256";
        }, {
            readonly name: "token_uri";
            readonly type: "core::byte_array::ByteArray";
        }];
        readonly outputs: readonly [{
            readonly type: "core::integer::u256";
        }];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "batch_mint_edition";
        readonly inputs: readonly [{
            readonly name: "to";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "values";
            readonly type: "core::array::Span::<core::integer::u256>";
        }, {
            readonly name: "token_uris";
            readonly type: "core::array::Array::<core::byte_array::ByteArray>";
        }];
        readonly outputs: readonly [{
            readonly type: "core::array::Span::<core::integer::u256>";
        }];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "add_supply";
        readonly inputs: readonly [{
            readonly name: "to";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }, {
            readonly name: "value";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "get_collection_creator";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "get_token_creator";
        readonly inputs: readonly [{
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "get_token_registered_at";
        readonly inputs: readonly [{
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "core::integer::u64";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "get_token_data";
        readonly inputs: readonly [{
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "ip_programmable_erc1155_collections::types::TokenData";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "total_editions";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "core::integer::u256";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "token_exists";
        readonly inputs: readonly [{
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "core::bool";
        }];
        readonly state_mutability: "view";
    }];
}, {
    readonly type: "impl";
    readonly name: "OwnableMixinImpl";
    readonly interface_name: "openzeppelin_access::ownable::interface::OwnableABI";
}, {
    readonly type: "interface";
    readonly name: "openzeppelin_access::ownable::interface::OwnableABI";
    readonly items: readonly [{
        readonly type: "function";
        readonly name: "owner";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "transfer_ownership";
        readonly inputs: readonly [{
            readonly name: "new_owner";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "renounce_ownership";
        readonly inputs: readonly [];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "transferOwnership";
        readonly inputs: readonly [{
            readonly name: "newOwner";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "renounceOwnership";
        readonly inputs: readonly [];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }];
}, {
    readonly type: "impl";
    readonly name: "SRC5Impl";
    readonly interface_name: "openzeppelin_introspection::interface::ISRC5";
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
    readonly type: "impl";
    readonly name: "ERC1155Impl";
    readonly interface_name: "openzeppelin_token::erc1155::interface::IERC1155";
}, {
    readonly type: "struct";
    readonly name: "core::array::Span::<core::starknet::contract_address::ContractAddress>";
    readonly members: readonly [{
        readonly name: "snapshot";
        readonly type: "@core::array::Array::<core::starknet::contract_address::ContractAddress>";
    }];
}, {
    readonly type: "struct";
    readonly name: "core::array::Span::<core::felt252>";
    readonly members: readonly [{
        readonly name: "snapshot";
        readonly type: "@core::array::Array::<core::felt252>";
    }];
}, {
    readonly type: "interface";
    readonly name: "openzeppelin_token::erc1155::interface::IERC1155";
    readonly items: readonly [{
        readonly type: "function";
        readonly name: "balance_of";
        readonly inputs: readonly [{
            readonly name: "account";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "core::integer::u256";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "balance_of_batch";
        readonly inputs: readonly [{
            readonly name: "accounts";
            readonly type: "core::array::Span::<core::starknet::contract_address::ContractAddress>";
        }, {
            readonly name: "token_ids";
            readonly type: "core::array::Span::<core::integer::u256>";
        }];
        readonly outputs: readonly [{
            readonly type: "core::array::Span::<core::integer::u256>";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "safe_transfer_from";
        readonly inputs: readonly [{
            readonly name: "from";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "to";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }, {
            readonly name: "value";
            readonly type: "core::integer::u256";
        }, {
            readonly name: "data";
            readonly type: "core::array::Span::<core::felt252>";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "safe_batch_transfer_from";
        readonly inputs: readonly [{
            readonly name: "from";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "to";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "token_ids";
            readonly type: "core::array::Span::<core::integer::u256>";
        }, {
            readonly name: "values";
            readonly type: "core::array::Span::<core::integer::u256>";
        }, {
            readonly name: "data";
            readonly type: "core::array::Span::<core::felt252>";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "is_approved_for_all";
        readonly inputs: readonly [{
            readonly name: "owner";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "operator";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly outputs: readonly [{
            readonly type: "core::bool";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "set_approval_for_all";
        readonly inputs: readonly [{
            readonly name: "operator";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "approved";
            readonly type: "core::bool";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }];
}, {
    readonly type: "impl";
    readonly name: "ERC1155CamelImpl";
    readonly interface_name: "openzeppelin_token::erc1155::interface::IERC1155Camel";
}, {
    readonly type: "interface";
    readonly name: "openzeppelin_token::erc1155::interface::IERC1155Camel";
    readonly items: readonly [{
        readonly type: "function";
        readonly name: "balanceOf";
        readonly inputs: readonly [{
            readonly name: "account";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "tokenId";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "core::integer::u256";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "balanceOfBatch";
        readonly inputs: readonly [{
            readonly name: "accounts";
            readonly type: "core::array::Span::<core::starknet::contract_address::ContractAddress>";
        }, {
            readonly name: "tokenIds";
            readonly type: "core::array::Span::<core::integer::u256>";
        }];
        readonly outputs: readonly [{
            readonly type: "core::array::Span::<core::integer::u256>";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "safeTransferFrom";
        readonly inputs: readonly [{
            readonly name: "from";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "to";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "tokenId";
            readonly type: "core::integer::u256";
        }, {
            readonly name: "value";
            readonly type: "core::integer::u256";
        }, {
            readonly name: "data";
            readonly type: "core::array::Span::<core::felt252>";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "safeBatchTransferFrom";
        readonly inputs: readonly [{
            readonly name: "from";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "to";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "tokenIds";
            readonly type: "core::array::Span::<core::integer::u256>";
        }, {
            readonly name: "values";
            readonly type: "core::array::Span::<core::integer::u256>";
        }, {
            readonly name: "data";
            readonly type: "core::array::Span::<core::felt252>";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "isApprovedForAll";
        readonly inputs: readonly [{
            readonly name: "owner";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "operator";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly outputs: readonly [{
            readonly type: "core::bool";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "setApprovalForAll";
        readonly inputs: readonly [{
            readonly name: "operator";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "approved";
            readonly type: "core::bool";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }];
}, {
    readonly type: "impl";
    readonly name: "ERC2981Impl";
    readonly interface_name: "openzeppelin_token::common::erc2981::interface::IERC2981";
}, {
    readonly type: "interface";
    readonly name: "openzeppelin_token::common::erc2981::interface::IERC2981";
    readonly items: readonly [{
        readonly type: "function";
        readonly name: "royalty_info";
        readonly inputs: readonly [{
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }, {
            readonly name: "sale_price";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "(core::starknet::contract_address::ContractAddress, core::integer::u256)";
        }];
        readonly state_mutability: "view";
    }];
}, {
    readonly type: "impl";
    readonly name: "ERC2981InfoImpl";
    readonly interface_name: "openzeppelin_token::common::erc2981::interface::IERC2981Info";
}, {
    readonly type: "interface";
    readonly name: "openzeppelin_token::common::erc2981::interface::IERC2981Info";
    readonly items: readonly [{
        readonly type: "function";
        readonly name: "default_royalty";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "(core::starknet::contract_address::ContractAddress, core::integer::u128, core::integer::u128)";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "token_royalty";
        readonly inputs: readonly [{
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "(core::starknet::contract_address::ContractAddress, core::integer::u128, core::integer::u128)";
        }];
        readonly state_mutability: "view";
    }];
}, {
    readonly type: "impl";
    readonly name: "ERC2981AdminOwnableImpl";
    readonly interface_name: "openzeppelin_token::common::erc2981::interface::IERC2981Admin";
}, {
    readonly type: "interface";
    readonly name: "openzeppelin_token::common::erc2981::interface::IERC2981Admin";
    readonly items: readonly [{
        readonly type: "function";
        readonly name: "set_default_royalty";
        readonly inputs: readonly [{
            readonly name: "receiver";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "fee_numerator";
            readonly type: "core::integer::u128";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "delete_default_royalty";
        readonly inputs: readonly [];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "set_token_royalty";
        readonly inputs: readonly [{
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }, {
            readonly name: "receiver";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "fee_numerator";
            readonly type: "core::integer::u128";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "reset_token_royalty";
        readonly inputs: readonly [{
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }];
}, {
    readonly type: "constructor";
    readonly name: "constructor";
    readonly inputs: readonly [{
        readonly name: "name";
        readonly type: "core::byte_array::ByteArray";
    }, {
        readonly name: "symbol";
        readonly type: "core::byte_array::ByteArray";
    }, {
        readonly name: "base_uri";
        readonly type: "core::byte_array::ByteArray";
    }, {
        readonly name: "owner";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }];
}, {
    readonly type: "event";
    readonly name: "openzeppelin_introspection::src5::SRC5Component::Event";
    readonly kind: "enum";
    readonly variants: readonly [];
}, {
    readonly type: "event";
    readonly name: "openzeppelin_access::ownable::ownable::OwnableComponent::OwnershipTransferred";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "previous_owner";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "new_owner";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }];
}, {
    readonly type: "event";
    readonly name: "openzeppelin_access::ownable::ownable::OwnableComponent::OwnershipTransferStarted";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "previous_owner";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "new_owner";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }];
}, {
    readonly type: "event";
    readonly name: "openzeppelin_access::ownable::ownable::OwnableComponent::Event";
    readonly kind: "enum";
    readonly variants: readonly [{
        readonly name: "OwnershipTransferred";
        readonly type: "openzeppelin_access::ownable::ownable::OwnableComponent::OwnershipTransferred";
        readonly kind: "nested";
    }, {
        readonly name: "OwnershipTransferStarted";
        readonly type: "openzeppelin_access::ownable::ownable::OwnableComponent::OwnershipTransferStarted";
        readonly kind: "nested";
    }];
}, {
    readonly type: "event";
    readonly name: "openzeppelin_token::erc1155::erc1155::ERC1155Component::TransferSingle";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "operator";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "from";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "to";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "id";
        readonly type: "core::integer::u256";
        readonly kind: "data";
    }, {
        readonly name: "value";
        readonly type: "core::integer::u256";
        readonly kind: "data";
    }];
}, {
    readonly type: "event";
    readonly name: "openzeppelin_token::erc1155::erc1155::ERC1155Component::TransferBatch";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "operator";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "from";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "to";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "ids";
        readonly type: "core::array::Span::<core::integer::u256>";
        readonly kind: "data";
    }, {
        readonly name: "values";
        readonly type: "core::array::Span::<core::integer::u256>";
        readonly kind: "data";
    }];
}, {
    readonly type: "event";
    readonly name: "openzeppelin_token::erc1155::erc1155::ERC1155Component::ApprovalForAll";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "owner";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "operator";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "approved";
        readonly type: "core::bool";
        readonly kind: "data";
    }];
}, {
    readonly type: "event";
    readonly name: "openzeppelin_token::erc1155::erc1155::ERC1155Component::URI";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "value";
        readonly type: "core::byte_array::ByteArray";
        readonly kind: "data";
    }, {
        readonly name: "id";
        readonly type: "core::integer::u256";
        readonly kind: "key";
    }];
}, {
    readonly type: "event";
    readonly name: "openzeppelin_token::erc1155::erc1155::ERC1155Component::Event";
    readonly kind: "enum";
    readonly variants: readonly [{
        readonly name: "TransferSingle";
        readonly type: "openzeppelin_token::erc1155::erc1155::ERC1155Component::TransferSingle";
        readonly kind: "nested";
    }, {
        readonly name: "TransferBatch";
        readonly type: "openzeppelin_token::erc1155::erc1155::ERC1155Component::TransferBatch";
        readonly kind: "nested";
    }, {
        readonly name: "ApprovalForAll";
        readonly type: "openzeppelin_token::erc1155::erc1155::ERC1155Component::ApprovalForAll";
        readonly kind: "nested";
    }, {
        readonly name: "URI";
        readonly type: "openzeppelin_token::erc1155::erc1155::ERC1155Component::URI";
        readonly kind: "nested";
    }];
}, {
    readonly type: "event";
    readonly name: "openzeppelin_token::common::erc2981::erc2981::ERC2981Component::Event";
    readonly kind: "enum";
    readonly variants: readonly [];
}, {
    readonly type: "event";
    readonly name: "ip_programmable_erc1155_collections::IPCollection::IPCollection::IPMinted";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "token_id";
        readonly type: "core::integer::u256";
        readonly kind: "key";
    }, {
        readonly name: "recipient";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "value";
        readonly type: "core::integer::u256";
        readonly kind: "data";
    }, {
        readonly name: "uri";
        readonly type: "core::byte_array::ByteArray";
        readonly kind: "data";
    }, {
        readonly name: "creator";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "data";
    }, {
        readonly name: "registered_at";
        readonly type: "core::integer::u64";
        readonly kind: "data";
    }];
}, {
    readonly type: "event";
    readonly name: "ip_programmable_erc1155_collections::IPCollection::IPCollection::Event";
    readonly kind: "enum";
    readonly variants: readonly [{
        readonly name: "SRC5Event";
        readonly type: "openzeppelin_introspection::src5::SRC5Component::Event";
        readonly kind: "flat";
    }, {
        readonly name: "OwnableEvent";
        readonly type: "openzeppelin_access::ownable::ownable::OwnableComponent::Event";
        readonly kind: "flat";
    }, {
        readonly name: "ERC1155Event";
        readonly type: "openzeppelin_token::erc1155::erc1155::ERC1155Component::Event";
        readonly kind: "flat";
    }, {
        readonly name: "ERC2981Event";
        readonly type: "openzeppelin_token::common::erc2981::erc2981::ERC2981Component::Event";
        readonly kind: "flat";
    }, {
        readonly name: "IPMinted";
        readonly type: "ip_programmable_erc1155_collections::IPCollection::IPCollection::IPMinted";
        readonly kind: "nested";
    }];
}];

declare const IPCollectionABI: readonly [{
    readonly type: "impl";
    readonly name: "IPCollectionImpl";
    readonly interface_name: "ip_collection_erc_721::interfaces::IIPCollection::IIPCollection";
}, {
    readonly type: "struct";
    readonly name: "core::byte_array::ByteArray";
    readonly members: readonly [{
        readonly name: "data";
        readonly type: "core::array::Array::<core::bytes_31::bytes31>";
    }, {
        readonly name: "pending_word";
        readonly type: "core::felt252";
    }, {
        readonly name: "pending_word_len";
        readonly type: "core::internal::bounded_int::BoundedInt::<0, 30>";
    }];
}, {
    readonly type: "struct";
    readonly name: "core::integer::u256";
    readonly members: readonly [{
        readonly name: "low";
        readonly type: "core::integer::u128";
    }, {
        readonly name: "high";
        readonly type: "core::integer::u128";
    }];
}, {
    readonly type: "struct";
    readonly name: "core::array::Span::<core::integer::u256>";
    readonly members: readonly [{
        readonly name: "snapshot";
        readonly type: "@core::array::Array::<core::integer::u256>";
    }];
}, {
    readonly type: "struct";
    readonly name: "ip_collection_erc_721::types::Collection";
    readonly members: readonly [{
        readonly name: "name";
        readonly type: "core::byte_array::ByteArray";
    }, {
        readonly name: "symbol";
        readonly type: "core::byte_array::ByteArray";
    }, {
        readonly name: "base_uri";
        readonly type: "core::byte_array::ByteArray";
    }, {
        readonly name: "owner";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }, {
        readonly name: "ip_nft";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }];
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
    readonly type: "struct";
    readonly name: "ip_collection_erc_721::types::CollectionStats";
    readonly members: readonly [{
        readonly name: "total_minted";
        readonly type: "core::integer::u256";
    }, {
        readonly name: "total_archived";
        readonly type: "core::integer::u256";
    }, {
        readonly name: "protocol_routed_transfers";
        readonly type: "core::integer::u256";
    }, {
        readonly name: "last_mint_time";
        readonly type: "core::integer::u64";
    }, {
        readonly name: "last_archive_time";
        readonly type: "core::integer::u64";
    }, {
        readonly name: "last_transfer_time";
        readonly type: "core::integer::u64";
    }];
}, {
    readonly type: "struct";
    readonly name: "ip_collection_erc_721::types::TokenData";
    readonly members: readonly [{
        readonly name: "collection_id";
        readonly type: "core::integer::u256";
    }, {
        readonly name: "token_id";
        readonly type: "core::integer::u256";
    }, {
        readonly name: "owner";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }, {
        readonly name: "metadata_uri";
        readonly type: "core::byte_array::ByteArray";
    }, {
        readonly name: "original_creator";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }, {
        readonly name: "registered_at";
        readonly type: "core::integer::u64";
    }];
}, {
    readonly type: "interface";
    readonly name: "ip_collection_erc_721::interfaces::IIPCollection::IIPCollection";
    readonly items: readonly [{
        readonly type: "function";
        readonly name: "create_collection";
        readonly inputs: readonly [{
            readonly name: "name";
            readonly type: "core::byte_array::ByteArray";
        }, {
            readonly name: "symbol";
            readonly type: "core::byte_array::ByteArray";
        }, {
            readonly name: "base_uri";
            readonly type: "core::byte_array::ByteArray";
        }];
        readonly outputs: readonly [{
            readonly type: "core::integer::u256";
        }];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "mint";
        readonly inputs: readonly [{
            readonly name: "collection_id";
            readonly type: "core::integer::u256";
        }, {
            readonly name: "recipient";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "token_uri";
            readonly type: "core::byte_array::ByteArray";
        }, {
            readonly name: "royalty_bps";
            readonly type: "core::integer::u128";
        }];
        readonly outputs: readonly [{
            readonly type: "core::integer::u256";
        }];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "batch_mint";
        readonly inputs: readonly [{
            readonly name: "collection_id";
            readonly type: "core::integer::u256";
        }, {
            readonly name: "recipients";
            readonly type: "core::array::Array::<core::starknet::contract_address::ContractAddress>";
        }, {
            readonly name: "token_uris";
            readonly type: "core::array::Array::<core::byte_array::ByteArray>";
        }, {
            readonly name: "royalty_bps";
            readonly type: "core::array::Array::<core::integer::u128>";
        }];
        readonly outputs: readonly [{
            readonly type: "core::array::Span::<core::integer::u256>";
        }];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "transfer_collection_ownership";
        readonly inputs: readonly [{
            readonly name: "collection_id";
            readonly type: "core::integer::u256";
        }, {
            readonly name: "new_owner";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "archive";
        readonly inputs: readonly [{
            readonly name: "collection_id";
            readonly type: "core::integer::u256";
        }, {
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "batch_archive";
        readonly inputs: readonly [{
            readonly name: "collection_ids";
            readonly type: "core::array::Array::<core::integer::u256>";
        }, {
            readonly name: "token_ids";
            readonly type: "core::array::Array::<core::integer::u256>";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "transfer_token";
        readonly inputs: readonly [{
            readonly name: "to";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "collection_id";
            readonly type: "core::integer::u256";
        }, {
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "batch_transfer";
        readonly inputs: readonly [{
            readonly name: "to";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "collection_ids";
            readonly type: "core::array::Array::<core::integer::u256>";
        }, {
            readonly name: "token_ids";
            readonly type: "core::array::Array::<core::integer::u256>";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "list_user_tokens_per_collection";
        readonly inputs: readonly [{
            readonly name: "collection_id";
            readonly type: "core::integer::u256";
        }, {
            readonly name: "user";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly outputs: readonly [{
            readonly type: "core::array::Span::<core::integer::u256>";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "list_user_collections";
        readonly inputs: readonly [{
            readonly name: "user";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly outputs: readonly [{
            readonly type: "core::array::Span::<core::integer::u256>";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "get_collection";
        readonly inputs: readonly [{
            readonly name: "collection_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "ip_collection_erc_721::types::Collection";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "get_collection_count";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "core::integer::u256";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "version";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "core::byte_array::ByteArray";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "is_valid_collection";
        readonly inputs: readonly [{
            readonly name: "collection_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "core::bool";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "get_collection_stats";
        readonly inputs: readonly [{
            readonly name: "collection_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "ip_collection_erc_721::types::CollectionStats";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "is_collection_owner";
        readonly inputs: readonly [{
            readonly name: "collection_id";
            readonly type: "core::integer::u256";
        }, {
            readonly name: "owner";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly outputs: readonly [{
            readonly type: "core::bool";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "get_token";
        readonly inputs: readonly [{
            readonly name: "collection_id";
            readonly type: "core::integer::u256";
        }, {
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "ip_collection_erc_721::types::TokenData";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "is_valid_token";
        readonly inputs: readonly [{
            readonly name: "collection_id";
            readonly type: "core::integer::u256";
        }, {
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "core::bool";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "is_transferable_token";
        readonly inputs: readonly [{
            readonly name: "collection_id";
            readonly type: "core::integer::u256";
        }, {
            readonly name: "token_id";
            readonly type: "core::integer::u256";
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
        readonly name: "ip_nft_class_hash";
        readonly type: "core::starknet::class_hash::ClassHash";
    }];
}, {
    readonly type: "event";
    readonly name: "ip_collection_erc_721::IPCollection::IPCollection::CollectionCreated";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "collection_id";
        readonly type: "core::integer::u256";
        readonly kind: "key";
    }, {
        readonly name: "owner";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "data";
    }, {
        readonly name: "name";
        readonly type: "core::byte_array::ByteArray";
        readonly kind: "data";
    }, {
        readonly name: "symbol";
        readonly type: "core::byte_array::ByteArray";
        readonly kind: "data";
    }, {
        readonly name: "base_uri";
        readonly type: "core::byte_array::ByteArray";
        readonly kind: "data";
    }];
}, {
    readonly type: "event";
    readonly name: "ip_collection_erc_721::IPCollection::IPCollection::CollectionOwnershipTransferred";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "collection_id";
        readonly type: "core::integer::u256";
        readonly kind: "key";
    }, {
        readonly name: "previous_owner";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "data";
    }, {
        readonly name: "new_owner";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "data";
    }, {
        readonly name: "timestamp";
        readonly type: "core::integer::u64";
        readonly kind: "data";
    }];
}, {
    readonly type: "event";
    readonly name: "ip_collection_erc_721::IPCollection::IPCollection::TokenMinted";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "collection_id";
        readonly type: "core::integer::u256";
        readonly kind: "key";
    }, {
        readonly name: "token_id";
        readonly type: "core::integer::u256";
        readonly kind: "key";
    }, {
        readonly name: "owner";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "data";
    }, {
        readonly name: "metadata_uri";
        readonly type: "core::byte_array::ByteArray";
        readonly kind: "data";
    }, {
        readonly name: "royalty_bps";
        readonly type: "core::integer::u128";
        readonly kind: "data";
    }];
}, {
    readonly type: "event";
    readonly name: "ip_collection_erc_721::IPCollection::IPCollection::TokenMintedBatch";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "collection_id";
        readonly type: "core::integer::u256";
        readonly kind: "key";
    }, {
        readonly name: "token_ids";
        readonly type: "core::array::Span::<core::integer::u256>";
        readonly kind: "data";
    }, {
        readonly name: "owners";
        readonly type: "core::array::Array::<core::starknet::contract_address::ContractAddress>";
        readonly kind: "data";
    }, {
        readonly name: "metadata_uris";
        readonly type: "core::array::Array::<core::byte_array::ByteArray>";
        readonly kind: "data";
    }, {
        readonly name: "operator";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "data";
    }, {
        readonly name: "timestamp";
        readonly type: "core::integer::u64";
        readonly kind: "data";
    }];
}, {
    readonly type: "event";
    readonly name: "ip_collection_erc_721::IPCollection::IPCollection::TokenArchived";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "collection_id";
        readonly type: "core::integer::u256";
        readonly kind: "key";
    }, {
        readonly name: "token_id";
        readonly type: "core::integer::u256";
        readonly kind: "key";
    }, {
        readonly name: "operator";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "data";
    }, {
        readonly name: "timestamp";
        readonly type: "core::integer::u64";
        readonly kind: "data";
    }];
}, {
    readonly type: "event";
    readonly name: "ip_collection_erc_721::IPCollection::IPCollection::TokenArchivedBatch";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "collection_ids";
        readonly type: "core::array::Span::<core::integer::u256>";
        readonly kind: "data";
    }, {
        readonly name: "token_ids";
        readonly type: "core::array::Span::<core::integer::u256>";
        readonly kind: "data";
    }, {
        readonly name: "operator";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "data";
    }, {
        readonly name: "timestamp";
        readonly type: "core::integer::u64";
        readonly kind: "data";
    }];
}, {
    readonly type: "event";
    readonly name: "ip_collection_erc_721::IPCollection::IPCollection::TokenTransferred";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "collection_id";
        readonly type: "core::integer::u256";
        readonly kind: "key";
    }, {
        readonly name: "token_id";
        readonly type: "core::integer::u256";
        readonly kind: "key";
    }, {
        readonly name: "from";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "data";
    }, {
        readonly name: "to";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "data";
    }, {
        readonly name: "operator";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "data";
    }, {
        readonly name: "timestamp";
        readonly type: "core::integer::u64";
        readonly kind: "data";
    }];
}, {
    readonly type: "event";
    readonly name: "ip_collection_erc_721::IPCollection::IPCollection::TokenTransferredBatch";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "from";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "data";
    }, {
        readonly name: "to";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "data";
    }, {
        readonly name: "collection_ids";
        readonly type: "core::array::Span::<core::integer::u256>";
        readonly kind: "data";
    }, {
        readonly name: "token_ids";
        readonly type: "core::array::Span::<core::integer::u256>";
        readonly kind: "data";
    }, {
        readonly name: "operator";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "data";
    }, {
        readonly name: "timestamp";
        readonly type: "core::integer::u64";
        readonly kind: "data";
    }];
}, {
    readonly type: "event";
    readonly name: "ip_collection_erc_721::IPCollection::IPCollection::Event";
    readonly kind: "enum";
    readonly variants: readonly [{
        readonly name: "CollectionCreated";
        readonly type: "ip_collection_erc_721::IPCollection::IPCollection::CollectionCreated";
        readonly kind: "nested";
    }, {
        readonly name: "CollectionOwnershipTransferred";
        readonly type: "ip_collection_erc_721::IPCollection::IPCollection::CollectionOwnershipTransferred";
        readonly kind: "nested";
    }, {
        readonly name: "TokenMinted";
        readonly type: "ip_collection_erc_721::IPCollection::IPCollection::TokenMinted";
        readonly kind: "nested";
    }, {
        readonly name: "TokenMintedBatch";
        readonly type: "ip_collection_erc_721::IPCollection::IPCollection::TokenMintedBatch";
        readonly kind: "nested";
    }, {
        readonly name: "TokenArchived";
        readonly type: "ip_collection_erc_721::IPCollection::IPCollection::TokenArchived";
        readonly kind: "nested";
    }, {
        readonly name: "TokenArchivedBatch";
        readonly type: "ip_collection_erc_721::IPCollection::IPCollection::TokenArchivedBatch";
        readonly kind: "nested";
    }, {
        readonly name: "TokenTransferred";
        readonly type: "ip_collection_erc_721::IPCollection::IPCollection::TokenTransferred";
        readonly kind: "nested";
    }, {
        readonly name: "TokenTransferredBatch";
        readonly type: "ip_collection_erc_721::IPCollection::IPCollection::TokenTransferredBatch";
        readonly kind: "nested";
    }];
}];

declare const IPNftABI: readonly [{
    readonly type: "impl";
    readonly name: "ERC721Metadata";
    readonly interface_name: "openzeppelin_token::erc721::interface::IERC721Metadata";
}, {
    readonly type: "struct";
    readonly name: "core::byte_array::ByteArray";
    readonly members: readonly [{
        readonly name: "data";
        readonly type: "core::array::Array::<core::bytes_31::bytes31>";
    }, {
        readonly name: "pending_word";
        readonly type: "core::felt252";
    }, {
        readonly name: "pending_word_len";
        readonly type: "core::internal::bounded_int::BoundedInt::<0, 30>";
    }];
}, {
    readonly type: "struct";
    readonly name: "core::integer::u256";
    readonly members: readonly [{
        readonly name: "low";
        readonly type: "core::integer::u128";
    }, {
        readonly name: "high";
        readonly type: "core::integer::u128";
    }];
}, {
    readonly type: "interface";
    readonly name: "openzeppelin_token::erc721::interface::IERC721Metadata";
    readonly items: readonly [{
        readonly type: "function";
        readonly name: "name";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "core::byte_array::ByteArray";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "symbol";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "core::byte_array::ByteArray";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "token_uri";
        readonly inputs: readonly [{
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "core::byte_array::ByteArray";
        }];
        readonly state_mutability: "view";
    }];
}, {
    readonly type: "impl";
    readonly name: "ERC721MetadataCamelOnly";
    readonly interface_name: "openzeppelin_token::erc721::interface::IERC721MetadataCamelOnly";
}, {
    readonly type: "interface";
    readonly name: "openzeppelin_token::erc721::interface::IERC721MetadataCamelOnly";
    readonly items: readonly [{
        readonly type: "function";
        readonly name: "tokenURI";
        readonly inputs: readonly [{
            readonly name: "tokenId";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "core::byte_array::ByteArray";
        }];
        readonly state_mutability: "view";
    }];
}, {
    readonly type: "impl";
    readonly name: "IPNftImpl";
    readonly interface_name: "ip_collection_erc_721::interfaces::IIPNFT::IIPNft";
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
    readonly type: "struct";
    readonly name: "core::array::Span::<core::integer::u256>";
    readonly members: readonly [{
        readonly name: "snapshot";
        readonly type: "@core::array::Array::<core::integer::u256>";
    }];
}, {
    readonly type: "interface";
    readonly name: "ip_collection_erc_721::interfaces::IIPNFT::IIPNft";
    readonly items: readonly [{
        readonly type: "function";
        readonly name: "mint";
        readonly inputs: readonly [{
            readonly name: "recipient";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }, {
            readonly name: "token_uri";
            readonly type: "core::byte_array::ByteArray";
        }, {
            readonly name: "creator";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "royalty_bps";
            readonly type: "core::integer::u128";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "archive";
        readonly inputs: readonly [{
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "is_archived";
        readonly inputs: readonly [{
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "core::bool";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "get_collection_id";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "core::integer::u256";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "get_registry";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "version";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "core::byte_array::ByteArray";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "base_uri";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "core::byte_array::ByteArray";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "all_tokens_of_owner";
        readonly inputs: readonly [{
            readonly name: "owner";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly outputs: readonly [{
            readonly type: "core::array::Span::<core::integer::u256>";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "token_exists";
        readonly inputs: readonly [{
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "core::bool";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "get_full_token_data";
        readonly inputs: readonly [{
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "(core::starknet::contract_address::ContractAddress, core::byte_array::ByteArray, core::starknet::contract_address::ContractAddress, core::integer::u64)";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "get_token_creator";
        readonly inputs: readonly [{
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "get_token_registered_at";
        readonly inputs: readonly [{
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "core::integer::u64";
        }];
        readonly state_mutability: "view";
    }];
}, {
    readonly type: "impl";
    readonly name: "ERC721Impl";
    readonly interface_name: "openzeppelin_token::erc721::interface::IERC721";
}, {
    readonly type: "struct";
    readonly name: "core::array::Span::<core::felt252>";
    readonly members: readonly [{
        readonly name: "snapshot";
        readonly type: "@core::array::Array::<core::felt252>";
    }];
}, {
    readonly type: "interface";
    readonly name: "openzeppelin_token::erc721::interface::IERC721";
    readonly items: readonly [{
        readonly type: "function";
        readonly name: "balance_of";
        readonly inputs: readonly [{
            readonly name: "account";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly outputs: readonly [{
            readonly type: "core::integer::u256";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "owner_of";
        readonly inputs: readonly [{
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "safe_transfer_from";
        readonly inputs: readonly [{
            readonly name: "from";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "to";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }, {
            readonly name: "data";
            readonly type: "core::array::Span::<core::felt252>";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "transfer_from";
        readonly inputs: readonly [{
            readonly name: "from";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "to";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "approve";
        readonly inputs: readonly [{
            readonly name: "to";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "set_approval_for_all";
        readonly inputs: readonly [{
            readonly name: "operator";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "approved";
            readonly type: "core::bool";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "get_approved";
        readonly inputs: readonly [{
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "is_approved_for_all";
        readonly inputs: readonly [{
            readonly name: "owner";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "operator";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly outputs: readonly [{
            readonly type: "core::bool";
        }];
        readonly state_mutability: "view";
    }];
}, {
    readonly type: "impl";
    readonly name: "ERC721CamelOnly";
    readonly interface_name: "openzeppelin_token::erc721::interface::IERC721CamelOnly";
}, {
    readonly type: "interface";
    readonly name: "openzeppelin_token::erc721::interface::IERC721CamelOnly";
    readonly items: readonly [{
        readonly type: "function";
        readonly name: "balanceOf";
        readonly inputs: readonly [{
            readonly name: "account";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly outputs: readonly [{
            readonly type: "core::integer::u256";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "ownerOf";
        readonly inputs: readonly [{
            readonly name: "tokenId";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "safeTransferFrom";
        readonly inputs: readonly [{
            readonly name: "from";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "to";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "tokenId";
            readonly type: "core::integer::u256";
        }, {
            readonly name: "data";
            readonly type: "core::array::Span::<core::felt252>";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "transferFrom";
        readonly inputs: readonly [{
            readonly name: "from";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "to";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "tokenId";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "setApprovalForAll";
        readonly inputs: readonly [{
            readonly name: "operator";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "approved";
            readonly type: "core::bool";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "getApproved";
        readonly inputs: readonly [{
            readonly name: "tokenId";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "isApprovedForAll";
        readonly inputs: readonly [{
            readonly name: "owner";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "operator";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly outputs: readonly [{
            readonly type: "core::bool";
        }];
        readonly state_mutability: "view";
    }];
}, {
    readonly type: "impl";
    readonly name: "ERC721EnumerableImpl";
    readonly interface_name: "openzeppelin_token::erc721::extensions::erc721_enumerable::interface::IERC721Enumerable";
}, {
    readonly type: "interface";
    readonly name: "openzeppelin_token::erc721::extensions::erc721_enumerable::interface::IERC721Enumerable";
    readonly items: readonly [{
        readonly type: "function";
        readonly name: "total_supply";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "core::integer::u256";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "token_by_index";
        readonly inputs: readonly [{
            readonly name: "index";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "core::integer::u256";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "token_of_owner_by_index";
        readonly inputs: readonly [{
            readonly name: "owner";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "index";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "core::integer::u256";
        }];
        readonly state_mutability: "view";
    }];
}, {
    readonly type: "impl";
    readonly name: "SRC5Impl";
    readonly interface_name: "openzeppelin_introspection::interface::ISRC5";
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
    readonly type: "impl";
    readonly name: "ERC2981Impl";
    readonly interface_name: "openzeppelin_token::common::erc2981::interface::IERC2981";
}, {
    readonly type: "interface";
    readonly name: "openzeppelin_token::common::erc2981::interface::IERC2981";
    readonly items: readonly [{
        readonly type: "function";
        readonly name: "royalty_info";
        readonly inputs: readonly [{
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }, {
            readonly name: "sale_price";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "(core::starknet::contract_address::ContractAddress, core::integer::u256)";
        }];
        readonly state_mutability: "view";
    }];
}, {
    readonly type: "impl";
    readonly name: "ERC2981InfoImpl";
    readonly interface_name: "openzeppelin_token::common::erc2981::interface::IERC2981Info";
}, {
    readonly type: "interface";
    readonly name: "openzeppelin_token::common::erc2981::interface::IERC2981Info";
    readonly items: readonly [{
        readonly type: "function";
        readonly name: "default_royalty";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "(core::starknet::contract_address::ContractAddress, core::integer::u128, core::integer::u128)";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "token_royalty";
        readonly inputs: readonly [{
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "(core::starknet::contract_address::ContractAddress, core::integer::u128, core::integer::u128)";
        }];
        readonly state_mutability: "view";
    }];
}, {
    readonly type: "constructor";
    readonly name: "constructor";
    readonly inputs: readonly [{
        readonly name: "name";
        readonly type: "core::byte_array::ByteArray";
    }, {
        readonly name: "symbol";
        readonly type: "core::byte_array::ByteArray";
    }, {
        readonly name: "base_uri";
        readonly type: "core::byte_array::ByteArray";
    }, {
        readonly name: "collection_id";
        readonly type: "core::integer::u256";
    }, {
        readonly name: "registry";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }];
}, {
    readonly type: "event";
    readonly name: "openzeppelin_token::erc721::erc721::ERC721Component::Transfer";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "from";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "to";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "token_id";
        readonly type: "core::integer::u256";
        readonly kind: "key";
    }];
}, {
    readonly type: "event";
    readonly name: "openzeppelin_token::erc721::erc721::ERC721Component::Approval";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "owner";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "approved";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "token_id";
        readonly type: "core::integer::u256";
        readonly kind: "key";
    }];
}, {
    readonly type: "event";
    readonly name: "openzeppelin_token::erc721::erc721::ERC721Component::ApprovalForAll";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "owner";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "operator";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "approved";
        readonly type: "core::bool";
        readonly kind: "data";
    }];
}, {
    readonly type: "event";
    readonly name: "openzeppelin_token::erc721::erc721::ERC721Component::Event";
    readonly kind: "enum";
    readonly variants: readonly [{
        readonly name: "Transfer";
        readonly type: "openzeppelin_token::erc721::erc721::ERC721Component::Transfer";
        readonly kind: "nested";
    }, {
        readonly name: "Approval";
        readonly type: "openzeppelin_token::erc721::erc721::ERC721Component::Approval";
        readonly kind: "nested";
    }, {
        readonly name: "ApprovalForAll";
        readonly type: "openzeppelin_token::erc721::erc721::ERC721Component::ApprovalForAll";
        readonly kind: "nested";
    }];
}, {
    readonly type: "event";
    readonly name: "openzeppelin_introspection::src5::SRC5Component::Event";
    readonly kind: "enum";
    readonly variants: readonly [];
}, {
    readonly type: "event";
    readonly name: "openzeppelin_token::erc721::extensions::erc721_enumerable::erc721_enumerable::ERC721EnumerableComponent::Event";
    readonly kind: "enum";
    readonly variants: readonly [];
}, {
    readonly type: "event";
    readonly name: "openzeppelin_token::common::erc2981::erc2981::ERC2981Component::Event";
    readonly kind: "enum";
    readonly variants: readonly [];
}, {
    readonly type: "event";
    readonly name: "ip_collection_erc_721::IPNft::IPNft::Event";
    readonly kind: "enum";
    readonly variants: readonly [{
        readonly name: "ERC721Event";
        readonly type: "openzeppelin_token::erc721::erc721::ERC721Component::Event";
        readonly kind: "flat";
    }, {
        readonly name: "SRC5Event";
        readonly type: "openzeppelin_introspection::src5::SRC5Component::Event";
        readonly kind: "flat";
    }, {
        readonly name: "ERC721EnumerableEvent";
        readonly type: "openzeppelin_token::erc721::extensions::erc721_enumerable::erc721_enumerable::ERC721EnumerableComponent::Event";
        readonly kind: "flat";
    }, {
        readonly name: "ERC2981Event";
        readonly type: "openzeppelin_token::common::erc2981::erc2981::ERC2981Component::Event";
        readonly kind: "flat";
    }];
}];

declare const CreatorCoinFactoryABI: readonly [{
    readonly type: "impl";
    readonly name: "FactoryImpl";
    readonly interface_name: "creator_coin::factory::interface::IFactory";
}, {
    readonly type: "struct";
    readonly name: "core::integer::u256";
    readonly members: readonly [{
        readonly name: "low";
        readonly type: "core::integer::u128";
    }, {
        readonly name: "high";
        readonly type: "core::integer::u128";
    }];
}, {
    readonly type: "struct";
    readonly name: "core::array::Span::<core::starknet::contract_address::ContractAddress>";
    readonly members: readonly [{
        readonly name: "snapshot";
        readonly type: "@core::array::Array::<core::starknet::contract_address::ContractAddress>";
    }];
}, {
    readonly type: "struct";
    readonly name: "core::array::Span::<core::integer::u256>";
    readonly members: readonly [{
        readonly name: "snapshot";
        readonly type: "@core::array::Array::<core::integer::u256>";
    }];
}, {
    readonly type: "struct";
    readonly name: "creator_coin::factory::LaunchParameters";
    readonly members: readonly [{
        readonly name: "creator_coin_address";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }, {
        readonly name: "transfer_restriction_delay";
        readonly type: "core::integer::u64";
    }, {
        readonly name: "max_percentage_buy_launch";
        readonly type: "core::integer::u16";
    }, {
        readonly name: "quote_address";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }, {
        readonly name: "initial_holders";
        readonly type: "core::array::Span::<core::starknet::contract_address::ContractAddress>";
    }, {
        readonly name: "initial_holders_amounts";
        readonly type: "core::array::Span::<core::integer::u256>";
    }];
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
    readonly type: "struct";
    readonly name: "ekubo::types::i129::i129";
    readonly members: readonly [{
        readonly name: "mag";
        readonly type: "core::integer::u128";
    }, {
        readonly name: "sign";
        readonly type: "core::bool";
    }];
}, {
    readonly type: "struct";
    readonly name: "creator_coin::exchanges::ekubo::ekubo_adapter::EkuboPoolParameters";
    readonly members: readonly [{
        readonly name: "fee";
        readonly type: "core::integer::u128";
    }, {
        readonly name: "tick_spacing";
        readonly type: "core::integer::u128";
    }, {
        readonly name: "starting_price";
        readonly type: "ekubo::types::i129::i129";
    }, {
        readonly name: "bound";
        readonly type: "core::integer::u128";
    }];
}, {
    readonly type: "struct";
    readonly name: "ekubo::types::keys::PoolKey";
    readonly members: readonly [{
        readonly name: "token0";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }, {
        readonly name: "token1";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }, {
        readonly name: "fee";
        readonly type: "core::integer::u128";
    }, {
        readonly name: "tick_spacing";
        readonly type: "core::integer::u128";
    }, {
        readonly name: "extension";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }];
}, {
    readonly type: "struct";
    readonly name: "ekubo::types::bounds::Bounds";
    readonly members: readonly [{
        readonly name: "lower";
        readonly type: "ekubo::types::i129::i129";
    }, {
        readonly name: "upper";
        readonly type: "ekubo::types::i129::i129";
    }];
}, {
    readonly type: "struct";
    readonly name: "creator_coin::exchanges::ekubo::launcher::EkuboLP";
    readonly members: readonly [{
        readonly name: "owner";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }, {
        readonly name: "quote_address";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }, {
        readonly name: "pool_key";
        readonly type: "ekubo::types::keys::PoolKey";
    }, {
        readonly name: "bounds";
        readonly type: "ekubo::types::bounds::Bounds";
    }];
}, {
    readonly type: "enum";
    readonly name: "creator_coin::exchanges::SupportedExchanges";
    readonly variants: readonly [{
        readonly name: "Jediswap";
        readonly type: "()";
    }, {
        readonly name: "Ekubo";
        readonly type: "()";
    }, {
        readonly name: "Starkdefi";
        readonly type: "()";
    }];
}, {
    readonly type: "enum";
    readonly name: "creator_coin::token::creator_coin::LiquidityType";
    readonly variants: readonly [{
        readonly name: "JediERC20";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }, {
        readonly name: "StarkDeFiERC20";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }, {
        readonly name: "EkuboNFT";
        readonly type: "core::integer::u64";
    }];
}, {
    readonly type: "enum";
    readonly name: "core::option::Option::<(core::starknet::contract_address::ContractAddress, creator_coin::token::creator_coin::LiquidityType)>";
    readonly variants: readonly [{
        readonly name: "Some";
        readonly type: "(core::starknet::contract_address::ContractAddress, creator_coin::token::creator_coin::LiquidityType)";
    }, {
        readonly name: "None";
        readonly type: "()";
    }];
}, {
    readonly type: "interface";
    readonly name: "creator_coin::factory::interface::IFactory";
    readonly items: readonly [{
        readonly type: "function";
        readonly name: "create_creator_coin";
        readonly inputs: readonly [{
            readonly name: "owner";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "name";
            readonly type: "core::felt252";
        }, {
            readonly name: "symbol";
            readonly type: "core::felt252";
        }, {
            readonly name: "initial_supply";
            readonly type: "core::integer::u256";
        }, {
            readonly name: "contract_address_salt";
            readonly type: "core::felt252";
        }];
        readonly outputs: readonly [{
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "launch_on_jediswap";
        readonly inputs: readonly [{
            readonly name: "launch_parameters";
            readonly type: "creator_coin::factory::LaunchParameters";
        }, {
            readonly name: "quote_amount";
            readonly type: "core::integer::u256";
        }, {
            readonly name: "unlock_time";
            readonly type: "core::integer::u64";
        }];
        readonly outputs: readonly [{
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "launch_on_ekubo";
        readonly inputs: readonly [{
            readonly name: "launch_parameters";
            readonly type: "creator_coin::factory::LaunchParameters";
        }, {
            readonly name: "ekubo_parameters";
            readonly type: "creator_coin::exchanges::ekubo::ekubo_adapter::EkuboPoolParameters";
        }];
        readonly outputs: readonly [{
            readonly type: "(core::integer::u64, creator_coin::exchanges::ekubo::launcher::EkuboLP)";
        }];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "launch_on_starkdefi";
        readonly inputs: readonly [{
            readonly name: "launch_parameters";
            readonly type: "creator_coin::factory::LaunchParameters";
        }, {
            readonly name: "quote_amount";
            readonly type: "core::integer::u256";
        }, {
            readonly name: "unlock_time";
            readonly type: "core::integer::u64";
        }];
        readonly outputs: readonly [{
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "exchange_address";
        readonly inputs: readonly [{
            readonly name: "exchange";
            readonly type: "creator_coin::exchanges::SupportedExchanges";
        }];
        readonly outputs: readonly [{
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "lock_manager_address";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "locked_liquidity";
        readonly inputs: readonly [{
            readonly name: "token";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly outputs: readonly [{
            readonly type: "core::option::Option::<(core::starknet::contract_address::ContractAddress, creator_coin::token::creator_coin::LiquidityType)>";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "is_creator_coin";
        readonly inputs: readonly [{
            readonly name: "address";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly outputs: readonly [{
            readonly type: "core::bool";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "ekubo_core_address";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly state_mutability: "view";
    }];
}, {
    readonly type: "struct";
    readonly name: "core::array::Span::<(creator_coin::exchanges::SupportedExchanges, core::starknet::contract_address::ContractAddress)>";
    readonly members: readonly [{
        readonly name: "snapshot";
        readonly type: "@core::array::Array::<(creator_coin::exchanges::SupportedExchanges, core::starknet::contract_address::ContractAddress)>";
    }];
}, {
    readonly type: "struct";
    readonly name: "core::array::Span::<(core::starknet::contract_address::ContractAddress, core::starknet::contract_address::ContractAddress)>";
    readonly members: readonly [{
        readonly name: "snapshot";
        readonly type: "@core::array::Array::<(core::starknet::contract_address::ContractAddress, core::starknet::contract_address::ContractAddress)>";
    }];
}, {
    readonly type: "constructor";
    readonly name: "constructor";
    readonly inputs: readonly [{
        readonly name: "creator_coin_class_hash";
        readonly type: "core::starknet::class_hash::ClassHash";
    }, {
        readonly name: "lock_manager_address";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }, {
        readonly name: "exchanges";
        readonly type: "core::array::Span::<(creator_coin::exchanges::SupportedExchanges, core::starknet::contract_address::ContractAddress)>";
    }, {
        readonly name: "migrated_tokens";
        readonly type: "core::array::Span::<(core::starknet::contract_address::ContractAddress, core::starknet::contract_address::ContractAddress)>";
    }];
}, {
    readonly type: "event";
    readonly name: "creator_coin::factory::factory::Factory::CreatorCoinCreated";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "owner";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "data";
    }, {
        readonly name: "name";
        readonly type: "core::felt252";
        readonly kind: "data";
    }, {
        readonly name: "symbol";
        readonly type: "core::felt252";
        readonly kind: "data";
    }, {
        readonly name: "initial_supply";
        readonly type: "core::integer::u256";
        readonly kind: "data";
    }, {
        readonly name: "creator_coin_address";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "data";
    }];
}, {
    readonly type: "event";
    readonly name: "creator_coin::factory::factory::Factory::CreatorCoinLaunched";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "creator_coin_address";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "data";
    }, {
        readonly name: "quote_token";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "data";
    }, {
        readonly name: "exchange_name";
        readonly type: "core::felt252";
        readonly kind: "data";
    }];
}, {
    readonly type: "event";
    readonly name: "creator_coin::factory::factory::Factory::Event";
    readonly kind: "enum";
    readonly variants: readonly [{
        readonly name: "CreatorCoinCreated";
        readonly type: "creator_coin::factory::factory::Factory::CreatorCoinCreated";
        readonly kind: "nested";
    }, {
        readonly name: "CreatorCoinLaunched";
        readonly type: "creator_coin::factory::factory::Factory::CreatorCoinLaunched";
        readonly kind: "nested";
    }];
}];

declare const IPTicketCollectionABI: readonly [{
    readonly type: "impl";
    readonly name: "ERC721MetadataImpl";
    readonly interface_name: "openzeppelin_token::erc721::interface::IERC721Metadata";
}, {
    readonly type: "struct";
    readonly name: "core::byte_array::ByteArray";
    readonly members: readonly [{
        readonly name: "data";
        readonly type: "core::array::Array::<core::bytes_31::bytes31>";
    }, {
        readonly name: "pending_word";
        readonly type: "core::felt252";
    }, {
        readonly name: "pending_word_len";
        readonly type: "core::internal::bounded_int::BoundedInt::<0, 30>";
    }];
}, {
    readonly type: "struct";
    readonly name: "core::integer::u256";
    readonly members: readonly [{
        readonly name: "low";
        readonly type: "core::integer::u128";
    }, {
        readonly name: "high";
        readonly type: "core::integer::u128";
    }];
}, {
    readonly type: "interface";
    readonly name: "openzeppelin_token::erc721::interface::IERC721Metadata";
    readonly items: readonly [{
        readonly type: "function";
        readonly name: "name";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "core::byte_array::ByteArray";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "symbol";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "core::byte_array::ByteArray";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "token_uri";
        readonly inputs: readonly [{
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "core::byte_array::ByteArray";
        }];
        readonly state_mutability: "view";
    }];
}, {
    readonly type: "impl";
    readonly name: "ERC721MetadataCamelOnlyImpl";
    readonly interface_name: "openzeppelin_token::erc721::interface::IERC721MetadataCamelOnly";
}, {
    readonly type: "interface";
    readonly name: "openzeppelin_token::erc721::interface::IERC721MetadataCamelOnly";
    readonly items: readonly [{
        readonly type: "function";
        readonly name: "tokenURI";
        readonly inputs: readonly [{
            readonly name: "tokenId";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "core::byte_array::ByteArray";
        }];
        readonly state_mutability: "view";
    }];
}, {
    readonly type: "impl";
    readonly name: "IPTicketImpl";
    readonly interface_name: "ip_ticket::interface::IIPTicketCollection";
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
    readonly type: "struct";
    readonly name: "ip_ticket::types::TicketCollection";
    readonly members: readonly [{
        readonly name: "creator";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }, {
        readonly name: "price";
        readonly type: "core::integer::u256";
    }, {
        readonly name: "max_supply";
        readonly type: "core::integer::u256";
    }, {
        readonly name: "minted";
        readonly type: "core::integer::u256";
    }, {
        readonly name: "expiration";
        readonly type: "core::integer::u64";
    }, {
        readonly name: "royalty_bps";
        readonly type: "core::integer::u256";
    }, {
        readonly name: "payment_token";
        readonly type: "core::option::Option::<core::starknet::contract_address::ContractAddress>";
    }, {
        readonly name: "metadata_uri";
        readonly type: "core::byte_array::ByteArray";
    }, {
        readonly name: "active";
        readonly type: "core::bool";
    }];
}, {
    readonly type: "struct";
    readonly name: "ip_ticket::types::TicketData";
    readonly members: readonly [{
        readonly name: "token_id";
        readonly type: "core::integer::u256";
    }, {
        readonly name: "owner";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }, {
        readonly name: "collection_id";
        readonly type: "core::integer::u256";
    }, {
        readonly name: "creator";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }, {
        readonly name: "metadata_uri";
        readonly type: "core::byte_array::ByteArray";
    }, {
        readonly name: "expiration";
        readonly type: "core::integer::u64";
    }, {
        readonly name: "redeemed";
        readonly type: "core::bool";
    }, {
        readonly name: "valid";
        readonly type: "core::bool";
    }];
}, {
    readonly type: "interface";
    readonly name: "ip_ticket::interface::IIPTicketCollection";
    readonly items: readonly [{
        readonly type: "function";
        readonly name: "create_ticket_collection";
        readonly inputs: readonly [{
            readonly name: "price";
            readonly type: "core::integer::u256";
        }, {
            readonly name: "max_supply";
            readonly type: "core::integer::u256";
        }, {
            readonly name: "expiration";
            readonly type: "core::integer::u64";
        }, {
            readonly name: "royalty_bps";
            readonly type: "core::integer::u256";
        }, {
            readonly name: "payment_token";
            readonly type: "core::option::Option::<core::starknet::contract_address::ContractAddress>";
        }, {
            readonly name: "metadata_uri";
            readonly type: "core::byte_array::ByteArray";
        }];
        readonly outputs: readonly [{
            readonly type: "core::integer::u256";
        }];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "set_collection_active";
        readonly inputs: readonly [{
            readonly name: "collection_id";
            readonly type: "core::integer::u256";
        }, {
            readonly name: "active";
            readonly type: "core::bool";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "mint_ticket";
        readonly inputs: readonly [{
            readonly name: "collection_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "core::integer::u256";
        }];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "redeem_ticket";
        readonly inputs: readonly [{
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "has_valid_ticket";
        readonly inputs: readonly [{
            readonly name: "user";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "collection_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "core::bool";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "get_ticket_collection";
        readonly inputs: readonly [{
            readonly name: "collection_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "ip_ticket::types::TicketCollection";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "get_ticket_data";
        readonly inputs: readonly [{
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "ip_ticket::types::TicketData";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "get_ticket_collection_id";
        readonly inputs: readonly [{
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "core::integer::u256";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "get_active_ticket_balance";
        readonly inputs: readonly [{
            readonly name: "user";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "collection_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "core::integer::u256";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "get_last_collection_id";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "core::integer::u256";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "total_supply";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "core::integer::u256";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "royalty_info";
        readonly inputs: readonly [{
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }, {
            readonly name: "sale_price";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "(core::starknet::contract_address::ContractAddress, core::integer::u256)";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "royaltyInfo";
        readonly inputs: readonly [{
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }, {
            readonly name: "sale_price";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "(core::starknet::contract_address::ContractAddress, core::integer::u256)";
        }];
        readonly state_mutability: "view";
    }];
}, {
    readonly type: "impl";
    readonly name: "ERC721Impl";
    readonly interface_name: "openzeppelin_token::erc721::interface::IERC721";
}, {
    readonly type: "struct";
    readonly name: "core::array::Span::<core::felt252>";
    readonly members: readonly [{
        readonly name: "snapshot";
        readonly type: "@core::array::Array::<core::felt252>";
    }];
}, {
    readonly type: "interface";
    readonly name: "openzeppelin_token::erc721::interface::IERC721";
    readonly items: readonly [{
        readonly type: "function";
        readonly name: "balance_of";
        readonly inputs: readonly [{
            readonly name: "account";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly outputs: readonly [{
            readonly type: "core::integer::u256";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "owner_of";
        readonly inputs: readonly [{
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "safe_transfer_from";
        readonly inputs: readonly [{
            readonly name: "from";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "to";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }, {
            readonly name: "data";
            readonly type: "core::array::Span::<core::felt252>";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "transfer_from";
        readonly inputs: readonly [{
            readonly name: "from";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "to";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "approve";
        readonly inputs: readonly [{
            readonly name: "to";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "set_approval_for_all";
        readonly inputs: readonly [{
            readonly name: "operator";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "approved";
            readonly type: "core::bool";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "get_approved";
        readonly inputs: readonly [{
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "is_approved_for_all";
        readonly inputs: readonly [{
            readonly name: "owner";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "operator";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly outputs: readonly [{
            readonly type: "core::bool";
        }];
        readonly state_mutability: "view";
    }];
}, {
    readonly type: "impl";
    readonly name: "ERC721CamelOnly";
    readonly interface_name: "openzeppelin_token::erc721::interface::IERC721CamelOnly";
}, {
    readonly type: "interface";
    readonly name: "openzeppelin_token::erc721::interface::IERC721CamelOnly";
    readonly items: readonly [{
        readonly type: "function";
        readonly name: "balanceOf";
        readonly inputs: readonly [{
            readonly name: "account";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly outputs: readonly [{
            readonly type: "core::integer::u256";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "ownerOf";
        readonly inputs: readonly [{
            readonly name: "tokenId";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "safeTransferFrom";
        readonly inputs: readonly [{
            readonly name: "from";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "to";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "tokenId";
            readonly type: "core::integer::u256";
        }, {
            readonly name: "data";
            readonly type: "core::array::Span::<core::felt252>";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "transferFrom";
        readonly inputs: readonly [{
            readonly name: "from";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "to";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "tokenId";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "setApprovalForAll";
        readonly inputs: readonly [{
            readonly name: "operator";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "approved";
            readonly type: "core::bool";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "getApproved";
        readonly inputs: readonly [{
            readonly name: "tokenId";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "isApprovedForAll";
        readonly inputs: readonly [{
            readonly name: "owner";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "operator";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly outputs: readonly [{
            readonly type: "core::bool";
        }];
        readonly state_mutability: "view";
    }];
}, {
    readonly type: "impl";
    readonly name: "SRC5Impl";
    readonly interface_name: "openzeppelin_introspection::interface::ISRC5";
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
    readonly type: "impl";
    readonly name: "OwnableMixinImpl";
    readonly interface_name: "openzeppelin_access::ownable::interface::OwnableABI";
}, {
    readonly type: "interface";
    readonly name: "openzeppelin_access::ownable::interface::OwnableABI";
    readonly items: readonly [{
        readonly type: "function";
        readonly name: "owner";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "transfer_ownership";
        readonly inputs: readonly [{
            readonly name: "new_owner";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "renounce_ownership";
        readonly inputs: readonly [];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "transferOwnership";
        readonly inputs: readonly [{
            readonly name: "newOwner";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "renounceOwnership";
        readonly inputs: readonly [];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }];
}, {
    readonly type: "constructor";
    readonly name: "constructor";
    readonly inputs: readonly [{
        readonly name: "name";
        readonly type: "core::byte_array::ByteArray";
    }, {
        readonly name: "symbol";
        readonly type: "core::byte_array::ByteArray";
    }, {
        readonly name: "owner";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }];
}, {
    readonly type: "event";
    readonly name: "openzeppelin_token::erc721::erc721::ERC721Component::Transfer";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "from";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "to";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "token_id";
        readonly type: "core::integer::u256";
        readonly kind: "key";
    }];
}, {
    readonly type: "event";
    readonly name: "openzeppelin_token::erc721::erc721::ERC721Component::Approval";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "owner";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "approved";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "token_id";
        readonly type: "core::integer::u256";
        readonly kind: "key";
    }];
}, {
    readonly type: "event";
    readonly name: "openzeppelin_token::erc721::erc721::ERC721Component::ApprovalForAll";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "owner";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "operator";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "approved";
        readonly type: "core::bool";
        readonly kind: "data";
    }];
}, {
    readonly type: "event";
    readonly name: "openzeppelin_token::erc721::erc721::ERC721Component::Event";
    readonly kind: "enum";
    readonly variants: readonly [{
        readonly name: "Transfer";
        readonly type: "openzeppelin_token::erc721::erc721::ERC721Component::Transfer";
        readonly kind: "nested";
    }, {
        readonly name: "Approval";
        readonly type: "openzeppelin_token::erc721::erc721::ERC721Component::Approval";
        readonly kind: "nested";
    }, {
        readonly name: "ApprovalForAll";
        readonly type: "openzeppelin_token::erc721::erc721::ERC721Component::ApprovalForAll";
        readonly kind: "nested";
    }];
}, {
    readonly type: "event";
    readonly name: "openzeppelin_introspection::src5::SRC5Component::Event";
    readonly kind: "enum";
    readonly variants: readonly [];
}, {
    readonly type: "event";
    readonly name: "openzeppelin_access::ownable::ownable::OwnableComponent::OwnershipTransferred";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "previous_owner";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "new_owner";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }];
}, {
    readonly type: "event";
    readonly name: "openzeppelin_access::ownable::ownable::OwnableComponent::OwnershipTransferStarted";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "previous_owner";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "new_owner";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }];
}, {
    readonly type: "event";
    readonly name: "openzeppelin_access::ownable::ownable::OwnableComponent::Event";
    readonly kind: "enum";
    readonly variants: readonly [{
        readonly name: "OwnershipTransferred";
        readonly type: "openzeppelin_access::ownable::ownable::OwnableComponent::OwnershipTransferred";
        readonly kind: "nested";
    }, {
        readonly name: "OwnershipTransferStarted";
        readonly type: "openzeppelin_access::ownable::ownable::OwnableComponent::OwnershipTransferStarted";
        readonly kind: "nested";
    }];
}, {
    readonly type: "event";
    readonly name: "ip_ticket::IPTicketCollection::IPTicketCollection::TicketCollectionCreated";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "collection_id";
        readonly type: "core::integer::u256";
        readonly kind: "key";
    }, {
        readonly name: "creator";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "price";
        readonly type: "core::integer::u256";
        readonly kind: "data";
    }, {
        readonly name: "max_supply";
        readonly type: "core::integer::u256";
        readonly kind: "data";
    }, {
        readonly name: "expiration";
        readonly type: "core::integer::u64";
        readonly kind: "data";
    }, {
        readonly name: "royalty_bps";
        readonly type: "core::integer::u256";
        readonly kind: "data";
    }, {
        readonly name: "payment_token";
        readonly type: "core::option::Option::<core::starknet::contract_address::ContractAddress>";
        readonly kind: "data";
    }, {
        readonly name: "metadata_uri";
        readonly type: "core::byte_array::ByteArray";
        readonly kind: "data";
    }, {
        readonly name: "created_at";
        readonly type: "core::integer::u64";
        readonly kind: "data";
    }];
}, {
    readonly type: "event";
    readonly name: "ip_ticket::IPTicketCollection::IPTicketCollection::CollectionStatusUpdated";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "collection_id";
        readonly type: "core::integer::u256";
        readonly kind: "key";
    }, {
        readonly name: "active";
        readonly type: "core::bool";
        readonly kind: "data";
    }, {
        readonly name: "updated_at";
        readonly type: "core::integer::u64";
        readonly kind: "data";
    }];
}, {
    readonly type: "event";
    readonly name: "ip_ticket::IPTicketCollection::IPTicketCollection::TicketMinted";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "token_id";
        readonly type: "core::integer::u256";
        readonly kind: "key";
    }, {
        readonly name: "collection_id";
        readonly type: "core::integer::u256";
        readonly kind: "key";
    }, {
        readonly name: "owner";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "minted_at";
        readonly type: "core::integer::u64";
        readonly kind: "data";
    }];
}, {
    readonly type: "event";
    readonly name: "ip_ticket::IPTicketCollection::IPTicketCollection::TicketRedeemed";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "token_id";
        readonly type: "core::integer::u256";
        readonly kind: "key";
    }, {
        readonly name: "collection_id";
        readonly type: "core::integer::u256";
        readonly kind: "key";
    }, {
        readonly name: "owner";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "redeemed_at";
        readonly type: "core::integer::u64";
        readonly kind: "data";
    }];
}, {
    readonly type: "event";
    readonly name: "ip_ticket::IPTicketCollection::IPTicketCollection::Event";
    readonly kind: "enum";
    readonly variants: readonly [{
        readonly name: "ERC721Event";
        readonly type: "openzeppelin_token::erc721::erc721::ERC721Component::Event";
        readonly kind: "flat";
    }, {
        readonly name: "SRC5Event";
        readonly type: "openzeppelin_introspection::src5::SRC5Component::Event";
        readonly kind: "flat";
    }, {
        readonly name: "OwnableEvent";
        readonly type: "openzeppelin_access::ownable::ownable::OwnableComponent::Event";
        readonly kind: "flat";
    }, {
        readonly name: "TicketCollectionCreated";
        readonly type: "ip_ticket::IPTicketCollection::IPTicketCollection::TicketCollectionCreated";
        readonly kind: "nested";
    }, {
        readonly name: "CollectionStatusUpdated";
        readonly type: "ip_ticket::IPTicketCollection::IPTicketCollection::CollectionStatusUpdated";
        readonly kind: "nested";
    }, {
        readonly name: "TicketMinted";
        readonly type: "ip_ticket::IPTicketCollection::IPTicketCollection::TicketMinted";
        readonly kind: "nested";
    }, {
        readonly name: "TicketRedeemed";
        readonly type: "ip_ticket::IPTicketCollection::IPTicketCollection::TicketRedeemed";
        readonly kind: "nested";
    }];
}];

declare const IPTicketCollectionFactoryABI: readonly [{
    readonly type: "impl";
    readonly name: "IPTicketCollectionFactoryImpl";
    readonly interface_name: "ip_ticket::interface::IIPTicketCollectionFactory";
}, {
    readonly type: "struct";
    readonly name: "core::byte_array::ByteArray";
    readonly members: readonly [{
        readonly name: "data";
        readonly type: "core::array::Array::<core::bytes_31::bytes31>";
    }, {
        readonly name: "pending_word";
        readonly type: "core::felt252";
    }, {
        readonly name: "pending_word_len";
        readonly type: "core::internal::bounded_int::BoundedInt::<0, 30>";
    }];
}, {
    readonly type: "interface";
    readonly name: "ip_ticket::interface::IIPTicketCollectionFactory";
    readonly items: readonly [{
        readonly type: "function";
        readonly name: "collection_class_hash";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "core::starknet::class_hash::ClassHash";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "version";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "core::byte_array::ByteArray";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "deploy_ticket_collection";
        readonly inputs: readonly [{
            readonly name: "name";
            readonly type: "core::byte_array::ByteArray";
        }, {
            readonly name: "symbol";
            readonly type: "core::byte_array::ByteArray";
        }];
        readonly outputs: readonly [{
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly state_mutability: "external";
    }];
}, {
    readonly type: "constructor";
    readonly name: "constructor";
    readonly inputs: readonly [{
        readonly name: "collection_class_hash";
        readonly type: "core::starknet::class_hash::ClassHash";
    }];
}, {
    readonly type: "event";
    readonly name: "ip_ticket::IPTicketCollectionFactory::IPTicketCollectionFactory::CollectionDeployed";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "collection_address";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "owner";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "name";
        readonly type: "core::byte_array::ByteArray";
        readonly kind: "data";
    }, {
        readonly name: "symbol";
        readonly type: "core::byte_array::ByteArray";
        readonly kind: "data";
    }];
}, {
    readonly type: "event";
    readonly name: "ip_ticket::IPTicketCollectionFactory::IPTicketCollectionFactory::Event";
    readonly kind: "enum";
    readonly variants: readonly [{
        readonly name: "CollectionDeployed";
        readonly type: "ip_ticket::IPTicketCollectionFactory::IPTicketCollectionFactory::CollectionDeployed";
        readonly kind: "nested";
    }];
}];

declare const IPClubABI: readonly [{
    readonly type: "impl";
    readonly name: "IPClubImpl";
    readonly interface_name: "ip_club::interfaces::IIPClub::IIPClub";
}, {
    readonly type: "struct";
    readonly name: "core::byte_array::ByteArray";
    readonly members: readonly [{
        readonly name: "data";
        readonly type: "core::array::Array::<core::bytes_31::bytes31>";
    }, {
        readonly name: "pending_word";
        readonly type: "core::felt252";
    }, {
        readonly name: "pending_word_len";
        readonly type: "core::internal::bounded_int::BoundedInt::<0, 30>";
    }];
}, {
    readonly type: "enum";
    readonly name: "core::option::Option::<core::integer::u32>";
    readonly variants: readonly [{
        readonly name: "Some";
        readonly type: "core::integer::u32";
    }, {
        readonly name: "None";
        readonly type: "()";
    }];
}, {
    readonly type: "struct";
    readonly name: "core::integer::u256";
    readonly members: readonly [{
        readonly name: "low";
        readonly type: "core::integer::u128";
    }, {
        readonly name: "high";
        readonly type: "core::integer::u128";
    }];
}, {
    readonly type: "enum";
    readonly name: "core::option::Option::<core::integer::u256>";
    readonly variants: readonly [{
        readonly name: "Some";
        readonly type: "core::integer::u256";
    }, {
        readonly name: "None";
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
    readonly type: "struct";
    readonly name: "ip_club::types::ClubRecord";
    readonly members: readonly [{
        readonly name: "creator";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }, {
        readonly name: "club_nft";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }, {
        readonly name: "open";
        readonly type: "core::bool";
    }, {
        readonly name: "num_members";
        readonly type: "core::integer::u32";
    }, {
        readonly name: "max_members";
        readonly type: "core::option::Option::<core::integer::u32>";
    }, {
        readonly name: "entry_fee";
        readonly type: "core::option::Option::<core::integer::u256>";
    }, {
        readonly name: "payment_token";
        readonly type: "core::option::Option::<core::starknet::contract_address::ContractAddress>";
    }];
}, {
    readonly type: "interface";
    readonly name: "ip_club::interfaces::IIPClub::IIPClub";
    readonly items: readonly [{
        readonly type: "function";
        readonly name: "create_club";
        readonly inputs: readonly [{
            readonly name: "name";
            readonly type: "core::byte_array::ByteArray";
        }, {
            readonly name: "symbol";
            readonly type: "core::byte_array::ByteArray";
        }, {
            readonly name: "metadata_uri";
            readonly type: "core::byte_array::ByteArray";
        }, {
            readonly name: "max_members";
            readonly type: "core::option::Option::<core::integer::u32>";
        }, {
            readonly name: "entry_fee";
            readonly type: "core::option::Option::<core::integer::u256>";
        }, {
            readonly name: "payment_token";
            readonly type: "core::option::Option::<core::starknet::contract_address::ContractAddress>";
        }];
        readonly outputs: readonly [{
            readonly type: "core::integer::u256";
        }];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "set_club_open";
        readonly inputs: readonly [{
            readonly name: "club_id";
            readonly type: "core::integer::u256";
        }, {
            readonly name: "open";
            readonly type: "core::bool";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "join_club";
        readonly inputs: readonly [{
            readonly name: "club_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "leave_club";
        readonly inputs: readonly [{
            readonly name: "club_id";
            readonly type: "core::integer::u256";
        }, {
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "get_club_record";
        readonly inputs: readonly [{
            readonly name: "club_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "ip_club::types::ClubRecord";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "is_member";
        readonly inputs: readonly [{
            readonly name: "club_id";
            readonly type: "core::integer::u256";
        }, {
            readonly name: "user";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly outputs: readonly [{
            readonly type: "core::bool";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "get_last_club_id";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "core::integer::u256";
        }];
        readonly state_mutability: "view";
    }];
}, {
    readonly type: "impl";
    readonly name: "SRC5Impl";
    readonly interface_name: "openzeppelin_introspection::interface::ISRC5";
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
        readonly name: "ip_club_nft_class_hash";
        readonly type: "core::starknet::class_hash::ClassHash";
    }];
}, {
    readonly type: "event";
    readonly name: "openzeppelin_introspection::src5::SRC5Component::Event";
    readonly kind: "enum";
    readonly variants: readonly [];
}, {
    readonly type: "event";
    readonly name: "ip_club::events::NewClubCreated";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "club_id";
        readonly type: "core::integer::u256";
        readonly kind: "key";
    }, {
        readonly name: "creator";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "club_nft";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "data";
    }, {
        readonly name: "metadata_uri";
        readonly type: "core::byte_array::ByteArray";
        readonly kind: "data";
    }, {
        readonly name: "timestamp";
        readonly type: "core::integer::u64";
        readonly kind: "data";
    }];
}, {
    readonly type: "event";
    readonly name: "ip_club::events::ClubStatusUpdated";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "club_id";
        readonly type: "core::integer::u256";
        readonly kind: "key";
    }, {
        readonly name: "open";
        readonly type: "core::bool";
        readonly kind: "data";
    }, {
        readonly name: "timestamp";
        readonly type: "core::integer::u64";
        readonly kind: "data";
    }];
}, {
    readonly type: "event";
    readonly name: "ip_club::events::NewMember";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "club_id";
        readonly type: "core::integer::u256";
        readonly kind: "key";
    }, {
        readonly name: "member";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "timestamp";
        readonly type: "core::integer::u64";
        readonly kind: "data";
    }];
}, {
    readonly type: "event";
    readonly name: "ip_club::events::MemberLeft";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "club_id";
        readonly type: "core::integer::u256";
        readonly kind: "key";
    }, {
        readonly name: "member";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "timestamp";
        readonly type: "core::integer::u64";
        readonly kind: "data";
    }];
}, {
    readonly type: "event";
    readonly name: "ip_club::IPClub::IPClub::Event";
    readonly kind: "enum";
    readonly variants: readonly [{
        readonly name: "SRC5Event";
        readonly type: "openzeppelin_introspection::src5::SRC5Component::Event";
        readonly kind: "flat";
    }, {
        readonly name: "NewClubCreated";
        readonly type: "ip_club::events::NewClubCreated";
        readonly kind: "nested";
    }, {
        readonly name: "ClubStatusUpdated";
        readonly type: "ip_club::events::ClubStatusUpdated";
        readonly kind: "nested";
    }, {
        readonly name: "NewMember";
        readonly type: "ip_club::events::NewMember";
        readonly kind: "nested";
    }, {
        readonly name: "MemberLeft";
        readonly type: "ip_club::events::MemberLeft";
        readonly kind: "nested";
    }];
}];

declare const IPClubNFTABI: readonly [{
    readonly type: "impl";
    readonly name: "IIPClubNFTImpl";
    readonly interface_name: "ip_club::interfaces::IIPClubNFT::IIPClubNFT";
}, {
    readonly type: "struct";
    readonly name: "core::integer::u256";
    readonly members: readonly [{
        readonly name: "low";
        readonly type: "core::integer::u128";
    }, {
        readonly name: "high";
        readonly type: "core::integer::u128";
    }];
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
    readonly name: "ip_club::interfaces::IIPClubNFT::IIPClubNFT";
    readonly items: readonly [{
        readonly type: "function";
        readonly name: "mint";
        readonly inputs: readonly [{
            readonly name: "recipient";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "burn";
        readonly inputs: readonly [{
            readonly name: "member";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "has_nft";
        readonly inputs: readonly [{
            readonly name: "user";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly outputs: readonly [{
            readonly type: "core::bool";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "get_nft_creator";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "get_ip_club_manager";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "get_associated_club_id";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "core::integer::u256";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "get_last_minted_id";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "core::integer::u256";
        }];
        readonly state_mutability: "view";
    }];
}, {
    readonly type: "impl";
    readonly name: "ERC721MixinImpl";
    readonly interface_name: "openzeppelin_token::erc721::interface::ERC721ABI";
}, {
    readonly type: "struct";
    readonly name: "core::array::Span::<core::felt252>";
    readonly members: readonly [{
        readonly name: "snapshot";
        readonly type: "@core::array::Array::<core::felt252>";
    }];
}, {
    readonly type: "struct";
    readonly name: "core::byte_array::ByteArray";
    readonly members: readonly [{
        readonly name: "data";
        readonly type: "core::array::Array::<core::bytes_31::bytes31>";
    }, {
        readonly name: "pending_word";
        readonly type: "core::felt252";
    }, {
        readonly name: "pending_word_len";
        readonly type: "core::internal::bounded_int::BoundedInt::<0, 30>";
    }];
}, {
    readonly type: "interface";
    readonly name: "openzeppelin_token::erc721::interface::ERC721ABI";
    readonly items: readonly [{
        readonly type: "function";
        readonly name: "balance_of";
        readonly inputs: readonly [{
            readonly name: "account";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly outputs: readonly [{
            readonly type: "core::integer::u256";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "owner_of";
        readonly inputs: readonly [{
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "safe_transfer_from";
        readonly inputs: readonly [{
            readonly name: "from";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "to";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }, {
            readonly name: "data";
            readonly type: "core::array::Span::<core::felt252>";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "transfer_from";
        readonly inputs: readonly [{
            readonly name: "from";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "to";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "approve";
        readonly inputs: readonly [{
            readonly name: "to";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "set_approval_for_all";
        readonly inputs: readonly [{
            readonly name: "operator";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "approved";
            readonly type: "core::bool";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "get_approved";
        readonly inputs: readonly [{
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "is_approved_for_all";
        readonly inputs: readonly [{
            readonly name: "owner";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "operator";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly outputs: readonly [{
            readonly type: "core::bool";
        }];
        readonly state_mutability: "view";
    }, {
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
    }, {
        readonly type: "function";
        readonly name: "name";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "core::byte_array::ByteArray";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "symbol";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "core::byte_array::ByteArray";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "token_uri";
        readonly inputs: readonly [{
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "core::byte_array::ByteArray";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "balanceOf";
        readonly inputs: readonly [{
            readonly name: "account";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly outputs: readonly [{
            readonly type: "core::integer::u256";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "ownerOf";
        readonly inputs: readonly [{
            readonly name: "tokenId";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "safeTransferFrom";
        readonly inputs: readonly [{
            readonly name: "from";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "to";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "tokenId";
            readonly type: "core::integer::u256";
        }, {
            readonly name: "data";
            readonly type: "core::array::Span::<core::felt252>";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "transferFrom";
        readonly inputs: readonly [{
            readonly name: "from";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "to";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "tokenId";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "setApprovalForAll";
        readonly inputs: readonly [{
            readonly name: "operator";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "approved";
            readonly type: "core::bool";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "getApproved";
        readonly inputs: readonly [{
            readonly name: "tokenId";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "isApprovedForAll";
        readonly inputs: readonly [{
            readonly name: "owner";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "operator";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly outputs: readonly [{
            readonly type: "core::bool";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "tokenURI";
        readonly inputs: readonly [{
            readonly name: "tokenId";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "core::byte_array::ByteArray";
        }];
        readonly state_mutability: "view";
    }];
}, {
    readonly type: "constructor";
    readonly name: "constructor";
    readonly inputs: readonly [{
        readonly name: "name";
        readonly type: "core::byte_array::ByteArray";
    }, {
        readonly name: "symbol";
        readonly type: "core::byte_array::ByteArray";
    }, {
        readonly name: "club_id";
        readonly type: "core::integer::u256";
    }, {
        readonly name: "creator";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }, {
        readonly name: "ip_club_manager";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }, {
        readonly name: "metadata_uri";
        readonly type: "core::byte_array::ByteArray";
    }];
}, {
    readonly type: "event";
    readonly name: "openzeppelin_token::erc721::erc721::ERC721Component::Transfer";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "from";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "to";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "token_id";
        readonly type: "core::integer::u256";
        readonly kind: "key";
    }];
}, {
    readonly type: "event";
    readonly name: "openzeppelin_token::erc721::erc721::ERC721Component::Approval";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "owner";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "approved";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "token_id";
        readonly type: "core::integer::u256";
        readonly kind: "key";
    }];
}, {
    readonly type: "event";
    readonly name: "openzeppelin_token::erc721::erc721::ERC721Component::ApprovalForAll";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "owner";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "operator";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "approved";
        readonly type: "core::bool";
        readonly kind: "data";
    }];
}, {
    readonly type: "event";
    readonly name: "openzeppelin_token::erc721::erc721::ERC721Component::Event";
    readonly kind: "enum";
    readonly variants: readonly [{
        readonly name: "Transfer";
        readonly type: "openzeppelin_token::erc721::erc721::ERC721Component::Transfer";
        readonly kind: "nested";
    }, {
        readonly name: "Approval";
        readonly type: "openzeppelin_token::erc721::erc721::ERC721Component::Approval";
        readonly kind: "nested";
    }, {
        readonly name: "ApprovalForAll";
        readonly type: "openzeppelin_token::erc721::erc721::ERC721Component::ApprovalForAll";
        readonly kind: "nested";
    }];
}, {
    readonly type: "event";
    readonly name: "openzeppelin_introspection::src5::SRC5Component::Event";
    readonly kind: "enum";
    readonly variants: readonly [];
}, {
    readonly type: "event";
    readonly name: "ip_club::IPClubNFT::IPClubNFT::Event";
    readonly kind: "enum";
    readonly variants: readonly [{
        readonly name: "ERC721Event";
        readonly type: "openzeppelin_token::erc721::erc721::ERC721Component::Event";
        readonly kind: "flat";
    }, {
        readonly name: "SRC5Event";
        readonly type: "openzeppelin_introspection::src5::SRC5Component::Event";
        readonly kind: "flat";
    }];
}];

declare const IPClubFactoryABI: readonly [{
    readonly type: "impl";
    readonly name: "IPClubFactoryImpl";
    readonly interface_name: "ip_club::interface::IIPClubFactory";
}, {
    readonly type: "struct";
    readonly name: "core::byte_array::ByteArray";
    readonly members: readonly [{
        readonly name: "data";
        readonly type: "core::array::Array::<core::bytes_31::bytes31>";
    }, {
        readonly name: "pending_word";
        readonly type: "core::felt252";
    }, {
        readonly name: "pending_word_len";
        readonly type: "core::internal::bounded_int::BoundedInt::<0, 30>";
    }];
}, {
    readonly type: "struct";
    readonly name: "core::integer::u256";
    readonly members: readonly [{
        readonly name: "low";
        readonly type: "core::integer::u128";
    }, {
        readonly name: "high";
        readonly type: "core::integer::u128";
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
    readonly type: "interface";
    readonly name: "ip_club::interface::IIPClubFactory";
    readonly items: readonly [{
        readonly type: "function";
        readonly name: "collection_class_hash";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "core::starknet::class_hash::ClassHash";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "version";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "core::byte_array::ByteArray";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "deploy_club";
        readonly inputs: readonly [{
            readonly name: "name";
            readonly type: "core::byte_array::ByteArray";
        }, {
            readonly name: "symbol";
            readonly type: "core::byte_array::ByteArray";
        }, {
            readonly name: "base_uri";
            readonly type: "core::byte_array::ByteArray";
        }, {
            readonly name: "max_supply";
            readonly type: "core::integer::u256";
        }, {
            readonly name: "entry_fee";
            readonly type: "core::integer::u256";
        }, {
            readonly name: "payment_token";
            readonly type: "core::option::Option::<core::starknet::contract_address::ContractAddress>";
        }, {
            readonly name: "royalty_bps";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly state_mutability: "external";
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
        readonly name: "collection_class_hash";
        readonly type: "core::starknet::class_hash::ClassHash";
    }];
}, {
    readonly type: "event";
    readonly name: "openzeppelin_introspection::src5::SRC5Component::Event";
    readonly kind: "enum";
    readonly variants: readonly [];
}, {
    readonly type: "event";
    readonly name: "ip_club::IPClubFactory::IPClubFactory::ClubDeployed";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "collection_address";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "owner";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "name";
        readonly type: "core::byte_array::ByteArray";
        readonly kind: "data";
    }, {
        readonly name: "symbol";
        readonly type: "core::byte_array::ByteArray";
        readonly kind: "data";
    }];
}, {
    readonly type: "event";
    readonly name: "ip_club::IPClubFactory::IPClubFactory::Event";
    readonly kind: "enum";
    readonly variants: readonly [{
        readonly name: "SRC5Event";
        readonly type: "openzeppelin_introspection::src5::SRC5Component::Event";
        readonly kind: "flat";
    }, {
        readonly name: "ClubDeployed";
        readonly type: "ip_club::IPClubFactory::IPClubFactory::ClubDeployed";
        readonly kind: "nested";
    }];
}];

declare const IPClubCollectionABI: readonly [{
    readonly type: "impl";
    readonly name: "ERC721MetadataImpl";
    readonly interface_name: "openzeppelin_token::erc721::interface::IERC721Metadata";
}, {
    readonly type: "struct";
    readonly name: "core::byte_array::ByteArray";
    readonly members: readonly [{
        readonly name: "data";
        readonly type: "core::array::Array::<core::bytes_31::bytes31>";
    }, {
        readonly name: "pending_word";
        readonly type: "core::felt252";
    }, {
        readonly name: "pending_word_len";
        readonly type: "core::internal::bounded_int::BoundedInt::<0, 30>";
    }];
}, {
    readonly type: "struct";
    readonly name: "core::integer::u256";
    readonly members: readonly [{
        readonly name: "low";
        readonly type: "core::integer::u128";
    }, {
        readonly name: "high";
        readonly type: "core::integer::u128";
    }];
}, {
    readonly type: "interface";
    readonly name: "openzeppelin_token::erc721::interface::IERC721Metadata";
    readonly items: readonly [{
        readonly type: "function";
        readonly name: "name";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "core::byte_array::ByteArray";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "symbol";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "core::byte_array::ByteArray";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "token_uri";
        readonly inputs: readonly [{
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "core::byte_array::ByteArray";
        }];
        readonly state_mutability: "view";
    }];
}, {
    readonly type: "impl";
    readonly name: "ERC721MetadataCamelOnlyImpl";
    readonly interface_name: "openzeppelin_token::erc721::interface::IERC721MetadataCamelOnly";
}, {
    readonly type: "interface";
    readonly name: "openzeppelin_token::erc721::interface::IERC721MetadataCamelOnly";
    readonly items: readonly [{
        readonly type: "function";
        readonly name: "tokenURI";
        readonly inputs: readonly [{
            readonly name: "tokenId";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "core::byte_array::ByteArray";
        }];
        readonly state_mutability: "view";
    }];
}, {
    readonly type: "impl";
    readonly name: "IPClubCollectionImpl";
    readonly interface_name: "ip_club::interface::IIPClubCollection";
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
    readonly type: "interface";
    readonly name: "ip_club::interface::IIPClubCollection";
    readonly items: readonly [{
        readonly type: "function";
        readonly name: "mint";
        readonly inputs: readonly [{
            readonly name: "to";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly outputs: readonly [{
            readonly type: "core::integer::u256";
        }];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "set_open";
        readonly inputs: readonly [{
            readonly name: "open";
            readonly type: "core::bool";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "base_uri";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "core::byte_array::ByteArray";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "entry_fee";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "core::integer::u256";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "payment_token";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "core::option::Option::<core::starknet::contract_address::ContractAddress>";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "max_supply";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "core::integer::u256";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "total_minted";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "core::integer::u256";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "is_open";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "core::bool";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "royalty_info";
        readonly inputs: readonly [{
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }, {
            readonly name: "sale_price";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "(core::starknet::contract_address::ContractAddress, core::integer::u256)";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "royaltyInfo";
        readonly inputs: readonly [{
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }, {
            readonly name: "sale_price";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "(core::starknet::contract_address::ContractAddress, core::integer::u256)";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "version";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "core::byte_array::ByteArray";
        }];
        readonly state_mutability: "view";
    }];
}, {
    readonly type: "impl";
    readonly name: "ERC721Impl";
    readonly interface_name: "openzeppelin_token::erc721::interface::IERC721";
}, {
    readonly type: "struct";
    readonly name: "core::array::Span::<core::felt252>";
    readonly members: readonly [{
        readonly name: "snapshot";
        readonly type: "@core::array::Array::<core::felt252>";
    }];
}, {
    readonly type: "interface";
    readonly name: "openzeppelin_token::erc721::interface::IERC721";
    readonly items: readonly [{
        readonly type: "function";
        readonly name: "balance_of";
        readonly inputs: readonly [{
            readonly name: "account";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly outputs: readonly [{
            readonly type: "core::integer::u256";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "owner_of";
        readonly inputs: readonly [{
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "safe_transfer_from";
        readonly inputs: readonly [{
            readonly name: "from";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "to";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }, {
            readonly name: "data";
            readonly type: "core::array::Span::<core::felt252>";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "transfer_from";
        readonly inputs: readonly [{
            readonly name: "from";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "to";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "approve";
        readonly inputs: readonly [{
            readonly name: "to";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "set_approval_for_all";
        readonly inputs: readonly [{
            readonly name: "operator";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "approved";
            readonly type: "core::bool";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "get_approved";
        readonly inputs: readonly [{
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "is_approved_for_all";
        readonly inputs: readonly [{
            readonly name: "owner";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "operator";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly outputs: readonly [{
            readonly type: "core::bool";
        }];
        readonly state_mutability: "view";
    }];
}, {
    readonly type: "impl";
    readonly name: "ERC721CamelOnly";
    readonly interface_name: "openzeppelin_token::erc721::interface::IERC721CamelOnly";
}, {
    readonly type: "interface";
    readonly name: "openzeppelin_token::erc721::interface::IERC721CamelOnly";
    readonly items: readonly [{
        readonly type: "function";
        readonly name: "balanceOf";
        readonly inputs: readonly [{
            readonly name: "account";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly outputs: readonly [{
            readonly type: "core::integer::u256";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "ownerOf";
        readonly inputs: readonly [{
            readonly name: "tokenId";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "safeTransferFrom";
        readonly inputs: readonly [{
            readonly name: "from";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "to";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "tokenId";
            readonly type: "core::integer::u256";
        }, {
            readonly name: "data";
            readonly type: "core::array::Span::<core::felt252>";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "transferFrom";
        readonly inputs: readonly [{
            readonly name: "from";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "to";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "tokenId";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "setApprovalForAll";
        readonly inputs: readonly [{
            readonly name: "operator";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "approved";
            readonly type: "core::bool";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "getApproved";
        readonly inputs: readonly [{
            readonly name: "tokenId";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "isApprovedForAll";
        readonly inputs: readonly [{
            readonly name: "owner";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "operator";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly outputs: readonly [{
            readonly type: "core::bool";
        }];
        readonly state_mutability: "view";
    }];
}, {
    readonly type: "impl";
    readonly name: "SRC5Impl";
    readonly interface_name: "openzeppelin_introspection::interface::ISRC5";
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
    readonly type: "impl";
    readonly name: "OwnableMixinImpl";
    readonly interface_name: "openzeppelin_access::ownable::interface::OwnableABI";
}, {
    readonly type: "interface";
    readonly name: "openzeppelin_access::ownable::interface::OwnableABI";
    readonly items: readonly [{
        readonly type: "function";
        readonly name: "owner";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "transfer_ownership";
        readonly inputs: readonly [{
            readonly name: "new_owner";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "renounce_ownership";
        readonly inputs: readonly [];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "transferOwnership";
        readonly inputs: readonly [{
            readonly name: "newOwner";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "renounceOwnership";
        readonly inputs: readonly [];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }];
}, {
    readonly type: "constructor";
    readonly name: "constructor";
    readonly inputs: readonly [{
        readonly name: "name";
        readonly type: "core::byte_array::ByteArray";
    }, {
        readonly name: "symbol";
        readonly type: "core::byte_array::ByteArray";
    }, {
        readonly name: "base_uri";
        readonly type: "core::byte_array::ByteArray";
    }, {
        readonly name: "max_supply";
        readonly type: "core::integer::u256";
    }, {
        readonly name: "entry_fee";
        readonly type: "core::integer::u256";
    }, {
        readonly name: "payment_token";
        readonly type: "core::option::Option::<core::starknet::contract_address::ContractAddress>";
    }, {
        readonly name: "royalty_bps";
        readonly type: "core::integer::u256";
    }, {
        readonly name: "owner";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }];
}, {
    readonly type: "event";
    readonly name: "openzeppelin_token::erc721::erc721::ERC721Component::Transfer";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "from";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "to";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "token_id";
        readonly type: "core::integer::u256";
        readonly kind: "key";
    }];
}, {
    readonly type: "event";
    readonly name: "openzeppelin_token::erc721::erc721::ERC721Component::Approval";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "owner";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "approved";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "token_id";
        readonly type: "core::integer::u256";
        readonly kind: "key";
    }];
}, {
    readonly type: "event";
    readonly name: "openzeppelin_token::erc721::erc721::ERC721Component::ApprovalForAll";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "owner";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "operator";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "approved";
        readonly type: "core::bool";
        readonly kind: "data";
    }];
}, {
    readonly type: "event";
    readonly name: "openzeppelin_token::erc721::erc721::ERC721Component::Event";
    readonly kind: "enum";
    readonly variants: readonly [{
        readonly name: "Transfer";
        readonly type: "openzeppelin_token::erc721::erc721::ERC721Component::Transfer";
        readonly kind: "nested";
    }, {
        readonly name: "Approval";
        readonly type: "openzeppelin_token::erc721::erc721::ERC721Component::Approval";
        readonly kind: "nested";
    }, {
        readonly name: "ApprovalForAll";
        readonly type: "openzeppelin_token::erc721::erc721::ERC721Component::ApprovalForAll";
        readonly kind: "nested";
    }];
}, {
    readonly type: "event";
    readonly name: "openzeppelin_introspection::src5::SRC5Component::Event";
    readonly kind: "enum";
    readonly variants: readonly [];
}, {
    readonly type: "event";
    readonly name: "openzeppelin_access::ownable::ownable::OwnableComponent::OwnershipTransferred";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "previous_owner";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "new_owner";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }];
}, {
    readonly type: "event";
    readonly name: "openzeppelin_access::ownable::ownable::OwnableComponent::OwnershipTransferStarted";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "previous_owner";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "new_owner";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }];
}, {
    readonly type: "event";
    readonly name: "openzeppelin_access::ownable::ownable::OwnableComponent::Event";
    readonly kind: "enum";
    readonly variants: readonly [{
        readonly name: "OwnershipTransferred";
        readonly type: "openzeppelin_access::ownable::ownable::OwnableComponent::OwnershipTransferred";
        readonly kind: "nested";
    }, {
        readonly name: "OwnershipTransferStarted";
        readonly type: "openzeppelin_access::ownable::ownable::OwnableComponent::OwnershipTransferStarted";
        readonly kind: "nested";
    }];
}, {
    readonly type: "event";
    readonly name: "ip_club::IPClubCollection::IPClubCollection::MemberMinted";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "token_id";
        readonly type: "core::integer::u256";
        readonly kind: "key";
    }, {
        readonly name: "to";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "payer";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "data";
    }];
}, {
    readonly type: "event";
    readonly name: "ip_club::IPClubCollection::IPClubCollection::OpenStatusChanged";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "open";
        readonly type: "core::bool";
        readonly kind: "data";
    }];
}, {
    readonly type: "event";
    readonly name: "ip_club::IPClubCollection::IPClubCollection::Event";
    readonly kind: "enum";
    readonly variants: readonly [{
        readonly name: "ERC721Event";
        readonly type: "openzeppelin_token::erc721::erc721::ERC721Component::Event";
        readonly kind: "flat";
    }, {
        readonly name: "SRC5Event";
        readonly type: "openzeppelin_introspection::src5::SRC5Component::Event";
        readonly kind: "flat";
    }, {
        readonly name: "OwnableEvent";
        readonly type: "openzeppelin_access::ownable::ownable::OwnableComponent::Event";
        readonly kind: "flat";
    }, {
        readonly name: "MemberMinted";
        readonly type: "ip_club::IPClubCollection::IPClubCollection::MemberMinted";
        readonly kind: "nested";
    }, {
        readonly name: "OpenStatusChanged";
        readonly type: "ip_club::IPClubCollection::IPClubCollection::OpenStatusChanged";
        readonly kind: "nested";
    }];
}];

declare const IPSponsorshipABI: readonly [{
    readonly type: "impl";
    readonly name: "IPSponsorshipImpl";
    readonly interface_name: "ip_sponsorship::interface::IIPSponsorship";
}, {
    readonly type: "struct";
    readonly name: "core::integer::u256";
    readonly members: readonly [{
        readonly name: "low";
        readonly type: "core::integer::u128";
    }, {
        readonly name: "high";
        readonly type: "core::integer::u128";
    }];
}, {
    readonly type: "struct";
    readonly name: "core::byte_array::ByteArray";
    readonly members: readonly [{
        readonly name: "data";
        readonly type: "core::array::Array::<core::bytes_31::bytes31>";
    }, {
        readonly name: "pending_word";
        readonly type: "core::felt252";
    }, {
        readonly name: "pending_word_len";
        readonly type: "core::internal::bounded_int::BoundedInt::<0, 30>";
    }];
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
    readonly name: "ip_sponsorship::types::SponsorshipOffer";
    readonly members: readonly [{
        readonly name: "author";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }, {
        readonly name: "nft_contract";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }, {
        readonly name: "token_id";
        readonly type: "core::integer::u256";
    }, {
        readonly name: "min_amount";
        readonly type: "core::integer::u256";
    }, {
        readonly name: "duration";
        readonly type: "core::integer::u64";
    }, {
        readonly name: "payment_token";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }, {
        readonly name: "license_terms_uri";
        readonly type: "core::byte_array::ByteArray";
    }, {
        readonly name: "transferable";
        readonly type: "core::bool";
    }, {
        readonly name: "specific_sponsor";
        readonly type: "core::option::Option::<core::starknet::contract_address::ContractAddress>";
    }, {
        readonly name: "open";
        readonly type: "core::bool";
    }];
}, {
    readonly type: "struct";
    readonly name: "ip_sponsorship::types::License";
    readonly members: readonly [{
        readonly name: "author";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }, {
        readonly name: "sponsor";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }, {
        readonly name: "nft_contract";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }, {
        readonly name: "token_id";
        readonly type: "core::integer::u256";
    }, {
        readonly name: "amount_paid";
        readonly type: "core::integer::u256";
    }, {
        readonly name: "expires_at";
        readonly type: "core::integer::u64";
    }, {
        readonly name: "transferable";
        readonly type: "core::bool";
    }, {
        readonly name: "license_terms_uri";
        readonly type: "core::byte_array::ByteArray";
    }];
}, {
    readonly type: "interface";
    readonly name: "ip_sponsorship::interface::IIPSponsorship";
    readonly items: readonly [{
        readonly type: "function";
        readonly name: "create_offer";
        readonly inputs: readonly [{
            readonly name: "nft_contract";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }, {
            readonly name: "min_amount";
            readonly type: "core::integer::u256";
        }, {
            readonly name: "duration";
            readonly type: "core::integer::u64";
        }, {
            readonly name: "payment_token";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "license_terms_uri";
            readonly type: "core::byte_array::ByteArray";
        }, {
            readonly name: "transferable";
            readonly type: "core::bool";
        }, {
            readonly name: "specific_sponsor";
            readonly type: "core::option::Option::<core::starknet::contract_address::ContractAddress>";
        }];
        readonly outputs: readonly [{
            readonly type: "core::integer::u256";
        }];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "set_offer_open";
        readonly inputs: readonly [{
            readonly name: "offer_id";
            readonly type: "core::integer::u256";
        }, {
            readonly name: "open";
            readonly type: "core::bool";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "place_bid";
        readonly inputs: readonly [{
            readonly name: "offer_id";
            readonly type: "core::integer::u256";
        }, {
            readonly name: "amount";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "retract_bid";
        readonly inputs: readonly [{
            readonly name: "offer_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "accept_bid";
        readonly inputs: readonly [{
            readonly name: "offer_id";
            readonly type: "core::integer::u256";
        }, {
            readonly name: "sponsor";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly outputs: readonly [{
            readonly type: "core::integer::u256";
        }];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "transfer_license";
        readonly inputs: readonly [{
            readonly name: "license_id";
            readonly type: "core::integer::u256";
        }, {
            readonly name: "to";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "get_offer";
        readonly inputs: readonly [{
            readonly name: "offer_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "ip_sponsorship::types::SponsorshipOffer";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "get_bid";
        readonly inputs: readonly [{
            readonly name: "offer_id";
            readonly type: "core::integer::u256";
        }, {
            readonly name: "sponsor";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly outputs: readonly [{
            readonly type: "core::integer::u256";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "get_license";
        readonly inputs: readonly [{
            readonly name: "license_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "ip_sponsorship::types::License";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "is_license_valid";
        readonly inputs: readonly [{
            readonly name: "license_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "core::bool";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "get_last_offer_id";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "core::integer::u256";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "get_last_license_id";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "core::integer::u256";
        }];
        readonly state_mutability: "view";
    }];
}, {
    readonly type: "impl";
    readonly name: "SRC5Impl";
    readonly interface_name: "openzeppelin_introspection::interface::ISRC5";
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
    readonly inputs: readonly [];
}, {
    readonly type: "event";
    readonly name: "openzeppelin_introspection::src5::SRC5Component::Event";
    readonly kind: "enum";
    readonly variants: readonly [];
}, {
    readonly type: "event";
    readonly name: "ip_sponsorship::IPSponsorship::IPSponsorship::OfferCreated";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "offer_id";
        readonly type: "core::integer::u256";
        readonly kind: "key";
    }, {
        readonly name: "author";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "nft_contract";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "token_id";
        readonly type: "core::integer::u256";
        readonly kind: "data";
    }, {
        readonly name: "min_amount";
        readonly type: "core::integer::u256";
        readonly kind: "data";
    }, {
        readonly name: "duration";
        readonly type: "core::integer::u64";
        readonly kind: "data";
    }, {
        readonly name: "payment_token";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "data";
    }, {
        readonly name: "license_terms_uri";
        readonly type: "core::byte_array::ByteArray";
        readonly kind: "data";
    }, {
        readonly name: "transferable";
        readonly type: "core::bool";
        readonly kind: "data";
    }, {
        readonly name: "specific_sponsor";
        readonly type: "core::option::Option::<core::starknet::contract_address::ContractAddress>";
        readonly kind: "data";
    }, {
        readonly name: "created_at";
        readonly type: "core::integer::u64";
        readonly kind: "data";
    }];
}, {
    readonly type: "event";
    readonly name: "ip_sponsorship::IPSponsorship::IPSponsorship::OfferStatusUpdated";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "offer_id";
        readonly type: "core::integer::u256";
        readonly kind: "key";
    }, {
        readonly name: "open";
        readonly type: "core::bool";
        readonly kind: "data";
    }, {
        readonly name: "updated_at";
        readonly type: "core::integer::u64";
        readonly kind: "data";
    }];
}, {
    readonly type: "event";
    readonly name: "ip_sponsorship::IPSponsorship::IPSponsorship::BidPlaced";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "offer_id";
        readonly type: "core::integer::u256";
        readonly kind: "key";
    }, {
        readonly name: "sponsor";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "amount";
        readonly type: "core::integer::u256";
        readonly kind: "data";
    }, {
        readonly name: "bid_at";
        readonly type: "core::integer::u64";
        readonly kind: "data";
    }];
}, {
    readonly type: "event";
    readonly name: "ip_sponsorship::IPSponsorship::IPSponsorship::BidRetracted";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "offer_id";
        readonly type: "core::integer::u256";
        readonly kind: "key";
    }, {
        readonly name: "sponsor";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "retracted_at";
        readonly type: "core::integer::u64";
        readonly kind: "data";
    }];
}, {
    readonly type: "event";
    readonly name: "ip_sponsorship::IPSponsorship::IPSponsorship::SponsorshipAccepted";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "offer_id";
        readonly type: "core::integer::u256";
        readonly kind: "key";
    }, {
        readonly name: "license_id";
        readonly type: "core::integer::u256";
        readonly kind: "key";
    }, {
        readonly name: "sponsor";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "author";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "data";
    }, {
        readonly name: "amount";
        readonly type: "core::integer::u256";
        readonly kind: "data";
    }, {
        readonly name: "expires_at";
        readonly type: "core::integer::u64";
        readonly kind: "data";
    }];
}, {
    readonly type: "event";
    readonly name: "ip_sponsorship::IPSponsorship::IPSponsorship::LicenseTransferred";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "license_id";
        readonly type: "core::integer::u256";
        readonly kind: "key";
    }, {
        readonly name: "from";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "to";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "transferred_at";
        readonly type: "core::integer::u64";
        readonly kind: "data";
    }];
}, {
    readonly type: "event";
    readonly name: "ip_sponsorship::IPSponsorship::IPSponsorship::Event";
    readonly kind: "enum";
    readonly variants: readonly [{
        readonly name: "SRC5Event";
        readonly type: "openzeppelin_introspection::src5::SRC5Component::Event";
        readonly kind: "flat";
    }, {
        readonly name: "OfferCreated";
        readonly type: "ip_sponsorship::IPSponsorship::IPSponsorship::OfferCreated";
        readonly kind: "nested";
    }, {
        readonly name: "OfferStatusUpdated";
        readonly type: "ip_sponsorship::IPSponsorship::IPSponsorship::OfferStatusUpdated";
        readonly kind: "nested";
    }, {
        readonly name: "BidPlaced";
        readonly type: "ip_sponsorship::IPSponsorship::IPSponsorship::BidPlaced";
        readonly kind: "nested";
    }, {
        readonly name: "BidRetracted";
        readonly type: "ip_sponsorship::IPSponsorship::IPSponsorship::BidRetracted";
        readonly kind: "nested";
    }, {
        readonly name: "SponsorshipAccepted";
        readonly type: "ip_sponsorship::IPSponsorship::IPSponsorship::SponsorshipAccepted";
        readonly kind: "nested";
    }, {
        readonly name: "LicenseTransferred";
        readonly type: "ip_sponsorship::IPSponsorship::IPSponsorship::LicenseTransferred";
        readonly kind: "nested";
    }];
}];

declare const IPSponsorshipLicenseABI: readonly [{
    readonly type: "impl";
    readonly name: "ERC721MetadataImpl";
    readonly interface_name: "openzeppelin_token::erc721::interface::IERC721Metadata";
}, {
    readonly type: "struct";
    readonly name: "core::byte_array::ByteArray";
    readonly members: readonly [{
        readonly name: "data";
        readonly type: "core::array::Array::<core::bytes_31::bytes31>";
    }, {
        readonly name: "pending_word";
        readonly type: "core::felt252";
    }, {
        readonly name: "pending_word_len";
        readonly type: "core::internal::bounded_int::BoundedInt::<0, 30>";
    }];
}, {
    readonly type: "struct";
    readonly name: "core::integer::u256";
    readonly members: readonly [{
        readonly name: "low";
        readonly type: "core::integer::u128";
    }, {
        readonly name: "high";
        readonly type: "core::integer::u128";
    }];
}, {
    readonly type: "interface";
    readonly name: "openzeppelin_token::erc721::interface::IERC721Metadata";
    readonly items: readonly [{
        readonly type: "function";
        readonly name: "name";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "core::byte_array::ByteArray";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "symbol";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "core::byte_array::ByteArray";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "token_uri";
        readonly inputs: readonly [{
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "core::byte_array::ByteArray";
        }];
        readonly state_mutability: "view";
    }];
}, {
    readonly type: "impl";
    readonly name: "ERC721MetadataCamelOnlyImpl";
    readonly interface_name: "openzeppelin_token::erc721::interface::IERC721MetadataCamelOnly";
}, {
    readonly type: "interface";
    readonly name: "openzeppelin_token::erc721::interface::IERC721MetadataCamelOnly";
    readonly items: readonly [{
        readonly type: "function";
        readonly name: "tokenURI";
        readonly inputs: readonly [{
            readonly name: "tokenId";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "core::byte_array::ByteArray";
        }];
        readonly state_mutability: "view";
    }];
}, {
    readonly type: "impl";
    readonly name: "IPSponsorshipLicenseImpl";
    readonly interface_name: "ip_sponsorship::interface::IIPSponsorshipLicense";
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
    readonly type: "struct";
    readonly name: "ip_sponsorship::types::LicenseData";
    readonly members: readonly [{
        readonly name: "author";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }, {
        readonly name: "asset_contract";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }, {
        readonly name: "asset_token_id";
        readonly type: "core::integer::u256";
    }, {
        readonly name: "expires_at";
        readonly type: "core::integer::u64";
    }, {
        readonly name: "transferable";
        readonly type: "core::bool";
    }, {
        readonly name: "royalty_bps";
        readonly type: "core::integer::u256";
    }, {
        readonly name: "license_terms_uri";
        readonly type: "core::byte_array::ByteArray";
    }];
}, {
    readonly type: "interface";
    readonly name: "ip_sponsorship::interface::IIPSponsorshipLicense";
    readonly items: readonly [{
        readonly type: "function";
        readonly name: "set_minter";
        readonly inputs: readonly [{
            readonly name: "minter";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "get_minter";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "mint";
        readonly inputs: readonly [{
            readonly name: "recipient";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "data";
            readonly type: "ip_sponsorship::types::LicenseData";
        }];
        readonly outputs: readonly [{
            readonly type: "core::integer::u256";
        }];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "get_license_data";
        readonly inputs: readonly [{
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "ip_sponsorship::types::LicenseData";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "is_license_valid";
        readonly inputs: readonly [{
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "core::bool";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "last_license_id";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "core::integer::u256";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "royalty_info";
        readonly inputs: readonly [{
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }, {
            readonly name: "sale_price";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "(core::starknet::contract_address::ContractAddress, core::integer::u256)";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "royaltyInfo";
        readonly inputs: readonly [{
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }, {
            readonly name: "sale_price";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "(core::starknet::contract_address::ContractAddress, core::integer::u256)";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "version";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "core::byte_array::ByteArray";
        }];
        readonly state_mutability: "view";
    }];
}, {
    readonly type: "impl";
    readonly name: "ERC721Impl";
    readonly interface_name: "openzeppelin_token::erc721::interface::IERC721";
}, {
    readonly type: "struct";
    readonly name: "core::array::Span::<core::felt252>";
    readonly members: readonly [{
        readonly name: "snapshot";
        readonly type: "@core::array::Array::<core::felt252>";
    }];
}, {
    readonly type: "interface";
    readonly name: "openzeppelin_token::erc721::interface::IERC721";
    readonly items: readonly [{
        readonly type: "function";
        readonly name: "balance_of";
        readonly inputs: readonly [{
            readonly name: "account";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly outputs: readonly [{
            readonly type: "core::integer::u256";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "owner_of";
        readonly inputs: readonly [{
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "safe_transfer_from";
        readonly inputs: readonly [{
            readonly name: "from";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "to";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }, {
            readonly name: "data";
            readonly type: "core::array::Span::<core::felt252>";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "transfer_from";
        readonly inputs: readonly [{
            readonly name: "from";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "to";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "approve";
        readonly inputs: readonly [{
            readonly name: "to";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "set_approval_for_all";
        readonly inputs: readonly [{
            readonly name: "operator";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "approved";
            readonly type: "core::bool";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "get_approved";
        readonly inputs: readonly [{
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "is_approved_for_all";
        readonly inputs: readonly [{
            readonly name: "owner";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "operator";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly outputs: readonly [{
            readonly type: "core::bool";
        }];
        readonly state_mutability: "view";
    }];
}, {
    readonly type: "impl";
    readonly name: "ERC721CamelOnly";
    readonly interface_name: "openzeppelin_token::erc721::interface::IERC721CamelOnly";
}, {
    readonly type: "interface";
    readonly name: "openzeppelin_token::erc721::interface::IERC721CamelOnly";
    readonly items: readonly [{
        readonly type: "function";
        readonly name: "balanceOf";
        readonly inputs: readonly [{
            readonly name: "account";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly outputs: readonly [{
            readonly type: "core::integer::u256";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "ownerOf";
        readonly inputs: readonly [{
            readonly name: "tokenId";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "safeTransferFrom";
        readonly inputs: readonly [{
            readonly name: "from";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "to";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "tokenId";
            readonly type: "core::integer::u256";
        }, {
            readonly name: "data";
            readonly type: "core::array::Span::<core::felt252>";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "transferFrom";
        readonly inputs: readonly [{
            readonly name: "from";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "to";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "tokenId";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "setApprovalForAll";
        readonly inputs: readonly [{
            readonly name: "operator";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "approved";
            readonly type: "core::bool";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "getApproved";
        readonly inputs: readonly [{
            readonly name: "tokenId";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "isApprovedForAll";
        readonly inputs: readonly [{
            readonly name: "owner";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "operator";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly outputs: readonly [{
            readonly type: "core::bool";
        }];
        readonly state_mutability: "view";
    }];
}, {
    readonly type: "impl";
    readonly name: "SRC5Impl";
    readonly interface_name: "openzeppelin_introspection::interface::ISRC5";
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
        readonly name: "name";
        readonly type: "core::byte_array::ByteArray";
    }, {
        readonly name: "symbol";
        readonly type: "core::byte_array::ByteArray";
    }];
}, {
    readonly type: "event";
    readonly name: "openzeppelin_token::erc721::erc721::ERC721Component::Transfer";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "from";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "to";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "token_id";
        readonly type: "core::integer::u256";
        readonly kind: "key";
    }];
}, {
    readonly type: "event";
    readonly name: "openzeppelin_token::erc721::erc721::ERC721Component::Approval";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "owner";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "approved";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "token_id";
        readonly type: "core::integer::u256";
        readonly kind: "key";
    }];
}, {
    readonly type: "event";
    readonly name: "openzeppelin_token::erc721::erc721::ERC721Component::ApprovalForAll";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "owner";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "operator";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "approved";
        readonly type: "core::bool";
        readonly kind: "data";
    }];
}, {
    readonly type: "event";
    readonly name: "openzeppelin_token::erc721::erc721::ERC721Component::Event";
    readonly kind: "enum";
    readonly variants: readonly [{
        readonly name: "Transfer";
        readonly type: "openzeppelin_token::erc721::erc721::ERC721Component::Transfer";
        readonly kind: "nested";
    }, {
        readonly name: "Approval";
        readonly type: "openzeppelin_token::erc721::erc721::ERC721Component::Approval";
        readonly kind: "nested";
    }, {
        readonly name: "ApprovalForAll";
        readonly type: "openzeppelin_token::erc721::erc721::ERC721Component::ApprovalForAll";
        readonly kind: "nested";
    }];
}, {
    readonly type: "event";
    readonly name: "openzeppelin_introspection::src5::SRC5Component::Event";
    readonly kind: "enum";
    readonly variants: readonly [];
}, {
    readonly type: "event";
    readonly name: "ip_sponsorship::IPSponsorshipLicense::IPSponsorshipLicense::LicenseMinted";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "token_id";
        readonly type: "core::integer::u256";
        readonly kind: "key";
    }, {
        readonly name: "recipient";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "author";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "asset_contract";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "data";
    }, {
        readonly name: "asset_token_id";
        readonly type: "core::integer::u256";
        readonly kind: "data";
    }, {
        readonly name: "expires_at";
        readonly type: "core::integer::u64";
        readonly kind: "data";
    }, {
        readonly name: "transferable";
        readonly type: "core::bool";
        readonly kind: "data";
    }, {
        readonly name: "royalty_bps";
        readonly type: "core::integer::u256";
        readonly kind: "data";
    }, {
        readonly name: "license_terms_uri";
        readonly type: "core::byte_array::ByteArray";
        readonly kind: "data";
    }, {
        readonly name: "minted_at";
        readonly type: "core::integer::u64";
        readonly kind: "data";
    }];
}, {
    readonly type: "event";
    readonly name: "ip_sponsorship::IPSponsorshipLicense::IPSponsorshipLicense::Event";
    readonly kind: "enum";
    readonly variants: readonly [{
        readonly name: "ERC721Event";
        readonly type: "openzeppelin_token::erc721::erc721::ERC721Component::Event";
        readonly kind: "flat";
    }, {
        readonly name: "SRC5Event";
        readonly type: "openzeppelin_introspection::src5::SRC5Component::Event";
        readonly kind: "flat";
    }, {
        readonly name: "LicenseMinted";
        readonly type: "ip_sponsorship::IPSponsorshipLicense::IPSponsorshipLicense::LicenseMinted";
        readonly kind: "nested";
    }];
}];

declare const IPGenesisABI: readonly [{
    readonly type: "impl";
    readonly name: "MIPImpl";
    readonly interface_name: "mip::interfaces::IMIP";
}, {
    readonly type: "struct";
    readonly name: "core::byte_array::ByteArray";
    readonly members: readonly [{
        readonly name: "data";
        readonly type: "core::array::Array::<core::bytes_31::bytes31>";
    }, {
        readonly name: "pending_word";
        readonly type: "core::felt252";
    }, {
        readonly name: "pending_word_len";
        readonly type: "core::internal::bounded_int::BoundedInt::<0, 30>";
    }];
}, {
    readonly type: "struct";
    readonly name: "core::integer::u256";
    readonly members: readonly [{
        readonly name: "low";
        readonly type: "core::integer::u128";
    }, {
        readonly name: "high";
        readonly type: "core::integer::u128";
    }];
}, {
    readonly type: "interface";
    readonly name: "mip::interfaces::IMIP";
    readonly items: readonly [{
        readonly type: "function";
        readonly name: "mint_item";
        readonly inputs: readonly [{
            readonly name: "recipient";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "uri";
            readonly type: "core::byte_array::ByteArray";
        }];
        readonly outputs: readonly [{
            readonly type: "core::integer::u256";
        }];
        readonly state_mutability: "external";
    }];
}, {
    readonly type: "impl";
    readonly name: "CounterImpl";
    readonly interface_name: "mip::interfaces::ICounter";
}, {
    readonly type: "interface";
    readonly name: "mip::interfaces::ICounter";
    readonly items: readonly [{
        readonly type: "function";
        readonly name: "current";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "core::integer::u256";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "increment";
        readonly inputs: readonly [];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "decrement";
        readonly inputs: readonly [];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }];
}, {
    readonly type: "impl";
    readonly name: "ERC721MixinImpl";
    readonly interface_name: "openzeppelin_token::erc721::interface::ERC721ABI";
}, {
    readonly type: "struct";
    readonly name: "core::array::Span::<core::felt252>";
    readonly members: readonly [{
        readonly name: "snapshot";
        readonly type: "@core::array::Array::<core::felt252>";
    }];
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
    readonly name: "openzeppelin_token::erc721::interface::ERC721ABI";
    readonly items: readonly [{
        readonly type: "function";
        readonly name: "balance_of";
        readonly inputs: readonly [{
            readonly name: "account";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly outputs: readonly [{
            readonly type: "core::integer::u256";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "owner_of";
        readonly inputs: readonly [{
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "safe_transfer_from";
        readonly inputs: readonly [{
            readonly name: "from";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "to";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }, {
            readonly name: "data";
            readonly type: "core::array::Span::<core::felt252>";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "transfer_from";
        readonly inputs: readonly [{
            readonly name: "from";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "to";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "approve";
        readonly inputs: readonly [{
            readonly name: "to";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "set_approval_for_all";
        readonly inputs: readonly [{
            readonly name: "operator";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "approved";
            readonly type: "core::bool";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "get_approved";
        readonly inputs: readonly [{
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "is_approved_for_all";
        readonly inputs: readonly [{
            readonly name: "owner";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "operator";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly outputs: readonly [{
            readonly type: "core::bool";
        }];
        readonly state_mutability: "view";
    }, {
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
    }, {
        readonly type: "function";
        readonly name: "name";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "core::byte_array::ByteArray";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "symbol";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "core::byte_array::ByteArray";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "token_uri";
        readonly inputs: readonly [{
            readonly name: "token_id";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "core::byte_array::ByteArray";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "balanceOf";
        readonly inputs: readonly [{
            readonly name: "account";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly outputs: readonly [{
            readonly type: "core::integer::u256";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "ownerOf";
        readonly inputs: readonly [{
            readonly name: "tokenId";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "safeTransferFrom";
        readonly inputs: readonly [{
            readonly name: "from";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "to";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "tokenId";
            readonly type: "core::integer::u256";
        }, {
            readonly name: "data";
            readonly type: "core::array::Span::<core::felt252>";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "transferFrom";
        readonly inputs: readonly [{
            readonly name: "from";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "to";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "tokenId";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "setApprovalForAll";
        readonly inputs: readonly [{
            readonly name: "operator";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "approved";
            readonly type: "core::bool";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "getApproved";
        readonly inputs: readonly [{
            readonly name: "tokenId";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "isApprovedForAll";
        readonly inputs: readonly [{
            readonly name: "owner";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "operator";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly outputs: readonly [{
            readonly type: "core::bool";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "tokenURI";
        readonly inputs: readonly [{
            readonly name: "tokenId";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "core::byte_array::ByteArray";
        }];
        readonly state_mutability: "view";
    }];
}, {
    readonly type: "impl";
    readonly name: "OwnableMixinImpl";
    readonly interface_name: "openzeppelin_access::ownable::interface::OwnableABI";
}, {
    readonly type: "interface";
    readonly name: "openzeppelin_access::ownable::interface::OwnableABI";
    readonly items: readonly [{
        readonly type: "function";
        readonly name: "owner";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "transfer_ownership";
        readonly inputs: readonly [{
            readonly name: "new_owner";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "renounce_ownership";
        readonly inputs: readonly [];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "transferOwnership";
        readonly inputs: readonly [{
            readonly name: "newOwner";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }, {
        readonly type: "function";
        readonly name: "renounceOwnership";
        readonly inputs: readonly [];
        readonly outputs: readonly [];
        readonly state_mutability: "external";
    }];
}, {
    readonly type: "impl";
    readonly name: "ERC721EnumerableImpl";
    readonly interface_name: "openzeppelin_token::erc721::extensions::erc721_enumerable::interface::IERC721Enumerable";
}, {
    readonly type: "interface";
    readonly name: "openzeppelin_token::erc721::extensions::erc721_enumerable::interface::IERC721Enumerable";
    readonly items: readonly [{
        readonly type: "function";
        readonly name: "total_supply";
        readonly inputs: readonly [];
        readonly outputs: readonly [{
            readonly type: "core::integer::u256";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "token_by_index";
        readonly inputs: readonly [{
            readonly name: "index";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "core::integer::u256";
        }];
        readonly state_mutability: "view";
    }, {
        readonly type: "function";
        readonly name: "token_of_owner_by_index";
        readonly inputs: readonly [{
            readonly name: "owner";
            readonly type: "core::starknet::contract_address::ContractAddress";
        }, {
            readonly name: "index";
            readonly type: "core::integer::u256";
        }];
        readonly outputs: readonly [{
            readonly type: "core::integer::u256";
        }];
        readonly state_mutability: "view";
    }];
}, {
    readonly type: "constructor";
    readonly name: "constructor";
    readonly inputs: readonly [{
        readonly name: "owner";
        readonly type: "core::starknet::contract_address::ContractAddress";
    }];
}, {
    readonly type: "event";
    readonly name: "openzeppelin_token::erc721::erc721::ERC721Component::Transfer";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "from";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "to";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "token_id";
        readonly type: "core::integer::u256";
        readonly kind: "key";
    }];
}, {
    readonly type: "event";
    readonly name: "openzeppelin_token::erc721::erc721::ERC721Component::Approval";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "owner";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "approved";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "token_id";
        readonly type: "core::integer::u256";
        readonly kind: "key";
    }];
}, {
    readonly type: "event";
    readonly name: "openzeppelin_token::erc721::erc721::ERC721Component::ApprovalForAll";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "owner";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "operator";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "approved";
        readonly type: "core::bool";
        readonly kind: "data";
    }];
}, {
    readonly type: "event";
    readonly name: "openzeppelin_token::erc721::erc721::ERC721Component::Event";
    readonly kind: "enum";
    readonly variants: readonly [{
        readonly name: "Transfer";
        readonly type: "openzeppelin_token::erc721::erc721::ERC721Component::Transfer";
        readonly kind: "nested";
    }, {
        readonly name: "Approval";
        readonly type: "openzeppelin_token::erc721::erc721::ERC721Component::Approval";
        readonly kind: "nested";
    }, {
        readonly name: "ApprovalForAll";
        readonly type: "openzeppelin_token::erc721::erc721::ERC721Component::ApprovalForAll";
        readonly kind: "nested";
    }];
}, {
    readonly type: "event";
    readonly name: "openzeppelin_access::ownable::ownable::OwnableComponent::OwnershipTransferred";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "previous_owner";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "new_owner";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }];
}, {
    readonly type: "event";
    readonly name: "openzeppelin_access::ownable::ownable::OwnableComponent::OwnershipTransferStarted";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "previous_owner";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }, {
        readonly name: "new_owner";
        readonly type: "core::starknet::contract_address::ContractAddress";
        readonly kind: "key";
    }];
}, {
    readonly type: "event";
    readonly name: "openzeppelin_access::ownable::ownable::OwnableComponent::Event";
    readonly kind: "enum";
    readonly variants: readonly [{
        readonly name: "OwnershipTransferred";
        readonly type: "openzeppelin_access::ownable::ownable::OwnableComponent::OwnershipTransferred";
        readonly kind: "nested";
    }, {
        readonly name: "OwnershipTransferStarted";
        readonly type: "openzeppelin_access::ownable::ownable::OwnableComponent::OwnershipTransferStarted";
        readonly kind: "nested";
    }];
}, {
    readonly type: "event";
    readonly name: "openzeppelin_introspection::src5::SRC5Component::Event";
    readonly kind: "enum";
    readonly variants: readonly [];
}, {
    readonly type: "event";
    readonly name: "openzeppelin_token::erc721::extensions::erc721_enumerable::erc721_enumerable::ERC721EnumerableComponent::Event";
    readonly kind: "enum";
    readonly variants: readonly [];
}, {
    readonly type: "event";
    readonly name: "mip::mip::MIP::CounterComponent::CounterIncremented";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "value";
        readonly type: "core::integer::u256";
        readonly kind: "data";
    }];
}, {
    readonly type: "event";
    readonly name: "mip::mip::MIP::CounterComponent::CounterDecremented";
    readonly kind: "struct";
    readonly members: readonly [{
        readonly name: "value";
        readonly type: "core::integer::u256";
        readonly kind: "data";
    }];
}, {
    readonly type: "event";
    readonly name: "mip::mip::MIP::CounterComponent::Event";
    readonly kind: "enum";
    readonly variants: readonly [{
        readonly name: "CounterIncremented";
        readonly type: "mip::mip::MIP::CounterComponent::CounterIncremented";
        readonly kind: "nested";
    }, {
        readonly name: "CounterDecremented";
        readonly type: "mip::mip::MIP::CounterComponent::CounterDecremented";
        readonly kind: "nested";
    }];
}, {
    readonly type: "event";
    readonly name: "mip::mip::MIP::Event";
    readonly kind: "enum";
    readonly variants: readonly [{
        readonly name: "ERC721Event";
        readonly type: "openzeppelin_token::erc721::erc721::ERC721Component::Event";
        readonly kind: "flat";
    }, {
        readonly name: "OwnableEvent";
        readonly type: "openzeppelin_access::ownable::ownable::OwnableComponent::Event";
        readonly kind: "flat";
    }, {
        readonly name: "SRC5Event";
        readonly type: "openzeppelin_introspection::src5::SRC5Component::Event";
        readonly kind: "flat";
    }, {
        readonly name: "ERC721EnumerableEvent";
        readonly type: "openzeppelin_token::erc721::extensions::erc721_enumerable::erc721_enumerable::ERC721EnumerableComponent::Event";
        readonly kind: "flat";
    }, {
        readonly name: "CounterEvent";
        readonly type: "mip::mip::MIP::CounterComponent::Event";
        readonly kind: "flat";
    }];
}];

declare const LAUNCH_PRICE_QUOTE_PER_COIN = 0.01;
declare const MIN_SUPPLY = 1000n;
declare const MAX_SUPPLY = 1000000000000n;
declare function validateName(s: string): string | null;
declare function validateSymbol(s: string): string | null;
declare function validateSupply(human: string): string | null;
/** Human integer → raw base units (default 18-dec coin). */
declare function toRaw(human: bigint, decimals?: number): bigint;
/** Team allocation in raw coin units. `pct` is whole-percent 0–10. */
declare function teamCoinsRaw(supplyRaw: bigint, pct: number): bigint;
/** Quote (raw) needed to buy the team allocation back out of the pool:
 *  teamCoins(human) × 0.01, in the quote token's raw units.
 *  = teamCoinsRaw × 10^quoteDecimals / (100 × 10^18). For 18-dec quote → /100. */
declare function buybackQuoteRaw(teamCoinsRawValue: bigint, quoteDecimals: number): bigint;
/** Fully-diluted value (human, in quote) for the live preview. */
declare function fdvHuman(supplyHuman: number): number;

/**
 * Serialize a string as Cairo ByteArray calldata felts using UTF-8 encoding.
 *
 * starknet.js byteArray.byteArrayFromString calls encodeShortString internally
 * which rejects non-ASCII characters (accented letters, CJK, Arabic, etc.).
 * This implementation packs raw UTF-8 bytes into 31-byte chunks as big-endian
 * felts, matching the Cairo ByteArray struct layout.
 *
 * Return layout: [chunks_len, ...chunk_felts, pending_word, pending_word_len]
 */
declare function encodeByteArray(str: string): string[];

/**
 * Build SNIP-12 typed data for signing an OrderParameters struct.
 * The shape is identical across ERC-721 and ERC-1155 (nested OfferItem +
 * ConsiderationItem) — only the domain version differs.
 */
declare function buildOrderTypedData(message: Record<string, unknown>, chainId: constants.StarknetChainId | string): TypedData;
declare function build1155OrderTypedData(message: Record<string, unknown>, chainId: constants.StarknetChainId | string): TypedData;
/** OrderCancellation typed data — identical shape across both standards. */
declare function buildCancellationTypedData(message: Record<string, unknown>, chainId: constants.StarknetChainId | string): TypedData;
declare function build1155CancellationTypedData(message: Record<string, unknown>, chainId: constants.StarknetChainId | string): TypedData;

export { type ApiRewardsConfig as $, ADMIN_HEADERS as A, type ApiCreatorProfile as B, type ApiIntent as C, type ApiIntentCreated as D, type ApiKeyStatus as E, type ApiMeta as F, type ApiMetadataSignedUrl as G, type ApiMetadataUpload as H, type ApiOrder as I, type ApiOrderConsideration as J, type ApiOrderOffer as K, type ApiOrderPrice as L, type ApiOrderTokenMeta as M, type ApiOrderTxHash as N, type ApiOrdersQuery as O, type ApiPointEvent as P, type ApiPortalKey as Q, type ApiPortalKeyCreated as R, type ServiceDefinition as S, type ApiPortalMe as T, type ApiPublicRemix as U, type ApiRemixOffer as V, type ApiRemixOfferPrice as W, type ApiRemixOffersQuery as X, type ApiResponse as Y, type ApiRewardsBadge as Z, type ApiRewardsBatchEntry as _, type ServiceCapability as a, FeeConfigSchema as a$, type ApiRewardsLeaderboardEntry as a0, type ApiRewardsLevel as a1, type ApiSearchCollectionResult as a2, type ApiSearchCreatorResult as a3, type ApiSearchResult as a4, type ApiSearchTokenResult as a5, type ApiToken as a6, type ApiTokenBalance as a7, type ApiTokenMetadata as a8, type ApiUsageDay as a9, type CreateCreatorCoinParams as aA, type CreateDropParams as aB, type CreateGrantOpts as aC, type CreateListing1155Params as aD, type CreateListingIntentParams as aE, type CreateListingParams as aF, type CreateMintIntentParams as aG, type CreatePopCollectionParams as aH, type CreateRemixOfferParams as aI, type CreateSponsorshipOfferParams as aJ, type CreateTicketCollectionParams as aK, type CreateWebhookParams as aL, CreatorCoinFactoryABI as aM, type CreatorCoinPrice as aN, type CreatorCoinReceiptLike as aO, CreatorCoinService as aP, type DeployClubParams as aQ, type DeployCollectionParams as aR, DropCollectionABI as aS, DropFactoryABI as aT, type DropMintStatus as aU, DropService as aV, ERC1155CollectionService as aW, type EkuboLaunchParams as aX, type EkuboPoolParams as aY, type EnforcementDeclaration as aZ, type FeeConfig as a_, type ApiUserRewards as aa, type ApiUserWallet as ab, type ApiWebhookCreated as ac, type ApiWebhookEndpoint as ad, type AutoRemixOfferParams as ae, type BatchMintEditionParams as af, type BuildFeeCallParams as ag, MAX_SUPPLY as ah, MIN_SUPPLY as ai, type CancelOrder1155Params as aj, type CancelOrderIntentParams as ak, type CancelOrderParams as al, type Cancelation as am, type CartItem as an, type ChainFilter as ao, type ClaimConditions as ap, ClubService as aq, type CollectionSort as ar, type CollectionTokensSort as as, type ConfirmRemixOfferParams as at, type ConfirmSelfRemixParams as au, type ConsiderationItem as av, type CreateClubParams as aw, type CreateCollectionIntentParams as ax, type CreateCollectionParams as ay, type CreateCounterOfferIntentParams as az, ADMIN_SCOPE as b, type StarknetVenueDeps as b$, type FeeSurface as b0, type FulfillOrder1155Params as b1, type FulfillOrderIntentParams as b2, type FulfillOrderParams as b3, IPClubABI as b4, IPClubCollectionABI as b5, IPClubFactoryABI as b6, IPClubNFTABI as b7, IPCollection1155ABI as b8, IPCollection1155FactoryABI as b9, type MintEditionParams as bA, type MintParams as bB, OPEN_LICENSES as bC, type OfferItem as bD, type OpenLicense as bE, type Order as bF, type OrderDetails as bG, type OrderParameters as bH, type OrderStatus as bI, POPCollectionABI as bJ, POPFactoryABI as bK, type ParsedAdminHeaders as bL, type PopBatchEligibilityItem as bM, type PopClaimStatus as bN, type PopEventType as bO, PopService as bP, type RemixOfferStatus as bQ, type RequestSiwsTokenArgs as bR, type ResolvedConfig as bS, type ResolvedFeeConfig as bT, type ResolvedOrder as bU, type RetryOptions as bV, type ServiceEventDeclaration as bW, type SiwsSigner as bX, type SortOrder as bY, SponsorshipService as bZ, StarknetVenue as b_, IPCollectionABI as ba, IPGenesisABI as bb, IPMarketplaceABI as bc, IPNftABI as bd, IPSponsorshipABI as be, IPSponsorshipLicenseABI as bf, IPTicketCollectionABI as bg, IPTicketCollectionFactoryABI as bh, type IPType as bi, type IntentCall as bj, type IntentStatus as bk, type IntentType as bl, type IpAttribute as bm, type IpNftMetadata as bn, LAUNCH_PRICE_QUOTE_PER_COIN as bo, type MakeOffer1155Params as bp, type MakeOfferIntentParams as bq, type MakeOfferParams as br, MarketplaceModule as bs, Medialane1155ABI as bt, Medialane1155Module as bu, MedialaneApiError as bv, MedialaneClient as bw, type MedialaneConfig as bx, MedialaneError as by, type MedialaneErrorCode as bz, type ActivityType as c, type TenantPlan as c0, TicketService as c1, type TxResult as c2, VALIDATED_EKUBO_PARAMS as c3, type WebhookEventType as c4, type WebhookStatus as c5, adminRequestDigest as c6, build1155CancellationTypedData as c7, build1155OrderTypedData as c8, buildAdminSessionTypedData as c9, validateName as cA, validateSupply as cB, validateSymbol as cC, verifyAdminRequestSig as cD, buildCancellationTypedData as ca, buildCreateCreatorCoinCall as cb, buildFeeCall as cc, buildLaunchOnEkuboCalls as cd, buildOrderTypedData as ce, buybackQuoteRaw as cf, toRaw as cg, createAdminSessionGrant as ch, encodeAdminHeaders as ci, encodeByteArray as cj, fdvHuman as ck, getCreatorCoinPrice as cl, getSiwsStorageKey as cm, getStoredSiwsToken as cn, isSiwsTokenValid as co, normalizeSiwsSignature as cp, parseAdminHeaders as cq, parseCreatorCoinCreated as cr, randomNonce as cs, requestSiwsToken as ct, resolveConfig as cu, resolveFeeConfig as cv, sessionKeyHashOf as cw, signAdminRequest as cx, storeSiwsToken as cy, teamCoinsRaw as cz, type AddSupplyParams as d, type AdminGrant as e, type AdminRequest as f, type AdminRequestSig as g, type AdminSession as h, type AdminSessionTypedDataInput as i, type ApiActivitiesQuery as j, type ApiActivity as k, type ApiActivityPrice as l, type ApiAdminCollectionClaim as m, type ApiAppSource as n, type ApiChain as o, ApiClient as p, type ApiCoin as q, type ApiCoinsQuery as r, type ApiCollection as s, type ApiCollectionClaim as t, type ApiCollectionProfile as u, type ApiCollectionSlugClaim as v, type ApiCollectionsQuery as w, type ApiComment as x, type ApiCounterOffersQuery as y, type ApiCreatorListResult as z };
