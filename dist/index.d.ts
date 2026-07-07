import { S as ServiceDefinition, a as ServiceCapability, C as Chain } from './index-CwYbGuEp.js';
export { A as ADMIN_HEADERS, b as ADMIN_SCOPE, c as ActivityType, d as AddSupplyParams, e as AdminGrant, f as AdminRequest, g as AdminRequestSig, h as AdminSession, i as AdminSessionTypedDataInput, j as ApiActivitiesQuery, k as ApiActivity, l as ApiActivityPrice, m as ApiAdminCollectionClaim, n as ApiAppSource, o as ApiChain, p as ApiClient, q as ApiCoin, r as ApiCoinsQuery, s as ApiCollection, t as ApiCollectionClaim, u as ApiCollectionProfile, v as ApiCollectionSlugClaim, w as ApiCollectionsQuery, x as ApiComment, y as ApiCounterOffersQuery, z as ApiCreatorListResult, B as ApiCreatorProfile, D as ApiIntent, E as ApiIntentCreated, F as ApiKeyStatus, G as ApiMeta, H as ApiMetadataSignedUrl, I as ApiMetadataUpload, J as ApiOrder, K as ApiOrderConsideration, L as ApiOrderOffer, M as ApiOrderPrice, N as ApiOrderTokenMeta, O as ApiOrderTxHash, P as ApiOrdersQuery, Q as ApiPointEvent, R as ApiPortalKey, T as ApiPortalKeyCreated, U as ApiPortalMe, V as ApiPublicRemix, W as ApiRemixOffer, X as ApiRemixOfferPrice, Y as ApiRemixOffersQuery, Z as ApiResponse, _ as ApiRewardsBadge, $ as ApiRewardsBatchEntry, a0 as ApiRewardsConfig, a1 as ApiRewardsLeaderboardEntry, a2 as ApiRewardsLevel, a3 as ApiSearchCollectionResult, a4 as ApiSearchCreatorResult, a5 as ApiSearchResult, a6 as ApiSearchTokenResult, a7 as ApiToken, a8 as ApiTokenBalance, a9 as ApiTokenMetadata, aa as ApiUsageDay, ab as ApiUserRewards, ac as ApiUserWallet, ad as ApiWebhookCreated, ae as ApiWebhookEndpoint, af as AutoRemixOfferParams, ag as BatchMintEditionParams, ah as BuildFeeCallParams, ai as CHAINS, aj as COIN_MAX_SUPPLY, ak as COIN_MIN_SUPPLY, al as CancelOrder1155Params, am as CancelOrderIntentParams, an as CancelOrderParams, ao as Cancelation, ap as CartItem, aq as ChainCoordinates, ar as ChainFilter, as as ClaimConditions, at as ClubService, au as CollectionSort, av as CollectionTokensSort, aw as ConfirmRemixOfferParams, ax as ConfirmSelfRemixParams, ay as ConsiderationItem, az as CoordinatesByChain, aA as CreateClubParams, aB as CreateCollectionIntentParams, aC as CreateCollectionParams, aD as CreateCounterOfferIntentParams, aE as CreateCreatorCoinParams, aF as CreateDropParams, aG as CreateGrantOpts, aH as CreateListing1155Params, aI as CreateListingIntentParams, aJ as CreateListingParams, aK as CreateMintIntentParams, aL as CreatePopCollectionParams, aM as CreateRemixOfferParams, aN as CreateSponsorshipOfferParams, aO as CreateTicketCollectionParams, aP as CreateWebhookParams, aQ as CreatorCoinFactoryABI, aR as CreatorCoinPrice, aS as CreatorCoinReceiptLike, aT as CreatorCoinService, aU as DEFAULT_CHAIN, aV as DeployCollectionParams, aW as DropCollectionABI, aX as DropFactoryABI, aY as DropMintStatus, aZ as DropService, a_ as ERC1155CollectionService, a$ as EkuboLaunchParams, b0 as EkuboPoolParams, b1 as EnforcementDeclaration, b2 as EvmCoordinates, b3 as FeeConfig, b4 as FeeConfigSchema, b5 as FeeSurface, b6 as FulfillOrder1155Params, b7 as FulfillOrderIntentParams, b8 as FulfillOrderParams, b9 as IPClubABI, ba as IPClubNFTABI, bb as IPCollection1155ABI, bc as IPCollection1155FactoryABI, bd as IPCollectionABI, be as IPGenesisABI, bf as IPMarketplaceABI, bg as IPNftABI, bh as IPSponsorshipABI, bi as IPTicketCollectionABI, bj as IPTicketCollectionFactoryABI, bk as IPType, bl as IntentCall, bm as IntentStatus, bn as IntentType, bo as IpAttribute, bp as IpNftMetadata, bq as LAUNCH_PRICE_QUOTE_PER_COIN, br as MakeOffer1155Params, bs as MakeOfferIntentParams, bt as MakeOfferParams, bu as MarketplaceModule, bv as Medialane1155ABI, bw as Medialane1155Module, bx as MedialaneApiError, by as MedialaneClient, bz as MedialaneConfig, bA as MedialaneError, bB as MedialaneErrorCode, bC as MintEditionParams, bD as MintParams, bE as OPEN_LICENSES, bF as OfferItem, bG as OpenLicense, bH as Order, bI as OrderDetails, bJ as OrderParameters, bK as OrderStatus, bL as POPCollectionABI, bM as POPFactoryABI, bN as ParsedAdminHeaders, bO as PopBatchEligibilityItem, bP as PopClaimStatus, bQ as PopEventType, bR as PopService, bS as RemixOfferStatus, bT as RequestSiwsTokenArgs, bU as ResolvedConfig, bV as ResolvedFeeConfig, bW as RetryOptions, bX as ServiceEventDeclaration, bY as SiwsSigner, bZ as SolanaCoordinates, b_ as SortOrder, b$ as SponsorshipService, c0 as StarknetCoordinates, c1 as StellarCoordinates, c2 as TenantPlan, c3 as TicketService, c4 as TxResult, c5 as VALIDATED_EKUBO_PARAMS, c6 as WebhookEventType, c7 as WebhookStatus, c8 as adminRequestDigest, c9 as build1155CancellationTypedData, ca as build1155OrderTypedData, cb as buildAdminSessionTypedData, cc as buildCancellationTypedData, cd as buildCreateCreatorCoinCall, ce as buildFeeCall, cf as buildLaunchOnEkuboCalls, cg as buildOrderTypedData, ch as buybackQuoteRaw, ci as coinToRaw, cj as createAdminSessionGrant, ck as encodeAdminHeaders, cl as encodeByteArray, cm as fdvHuman, cn as getCoordinates, co as getCreatorCoinPrice, cp as getSiwsStorageKey, cq as getStarknetCoordinates, cr as getStoredSiwsToken, cs as isSiwsTokenValid, ct as normalizeSiwsSignature, cu as parseAdminHeaders, cv as parseCreatorCoinCreated, cw as randomNonce, cx as requestSiwsToken, cy as resolveConfig, cz as resolveFeeConfig, cA as sessionKeyHashOf, cB as signAdminRequest, cC as storeSiwsToken, cD as teamCoinsRaw, cE as validateCoinName, cF as validateCoinSupply, cG as validateCoinSymbol, cH as verifyAdminRequestSig } from './index-CwYbGuEp.js';
import 'zod';
import 'starknet';

declare const STARKNET_MARKETPLACE_721_CONTRACT: `0x${string}`;
declare const STARKNET_MARKETPLACE_721_CLASS_HASH: `0x${string}`;
declare const STARKNET_MARKETPLACE_721_START_BLOCK: number;
declare const STARKNET_MARKETPLACE_1155_CONTRACT: `0x${string}`;
declare const STARKNET_MARKETPLACE_1155_CLASS_HASH: `0x${string}`;
declare const STARKNET_MARKETPLACE_1155_START_BLOCK: number;
declare const STARKNET_COLLECTION_721_CONTRACT: `0x${string}`;
declare const STARKNET_COLLECTION_721_START_BLOCK: number;
declare const STARKNET_IPNFT_CLASS_HASH: `0x${string}`;
declare const STARKNET_IPCOLLECTION_CLASS_HASH: `0x${string}`;
declare const STARKNET_COLLECTION_1155_CONTRACT: `0x${string}`;
declare const STARKNET_COLLECTION_1155_FACTORY_CLASS_HASH: `0x${string}`;
declare const STARKNET_COLLECTION_1155_CLASS_HASH: `0x${string}`;
declare const STARKNET_COLLECTION_1155_START_BLOCK: number;
declare const STARKNET_POP_FACTORY_CONTRACT: `0x${string}`;
declare const STARKNET_POP_COLLECTION_CLASS_HASH: `0x${string}`;
declare const STARKNET_DROP_FACTORY_CONTRACT: `0x${string}`;
declare const STARKNET_DROP_COLLECTION_CLASS_HASH: `0x${string}`;
declare const STARKNET_NFTCOMMENTS_CONTRACT: `0x${string}`;
declare const STARKNET_IP_TICKETS_FACTORY_CONTRACT: `0x${string}`;
declare const STARKNET_IP_TICKET_COLLECTION_CLASS_HASH: `0x${string}`;
declare const STARKNET_IP_CLUB_REGISTRY_CONTRACT: `0x${string}`;
declare const STARKNET_IP_CLUB_NFT_CLASS_HASH: `0x${string}`;
declare const STARKNET_IP_SPONSORSHIP_CONTRACT: `0x${string}`;
declare const STARKNET_IP_SPONSORSHIP_LICENSE_CONTRACT: `0x${string}`;
declare const STARKNET_CREATOR_COIN_FACTORY_CONTRACT: `0x${string}`;
declare const STARKNET_CREATOR_COIN_EKUBO_LAUNCHER: `0x${string}`;
declare const STARKNET_CREATOR_COIN_CLASS_HASH: `0x${string}`;
declare const STARKNET_CREATOR_COIN_FACTORY_CLASS_HASH: `0x${string}`;
declare const STARKNET_CREATOR_COIN_START_BLOCK: number;
declare const STARKNET_EKUBO_CORE: `0x${string}`;
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
/** Default currency for listings and offers — Circle-native USDC on Starknet. */
declare const DEFAULT_CURRENCY: SupportedTokenSymbol;

/**
 * The Medialane service registry (05-service-model §II, §VI).
 * Canonical long-form IDs (01-core-model §III). SDK-resident in v1;
 * on-chain registry later (08-dao-governance §IV).
 *
 * `onchain` is keyed per chain (spec 2026-06-13 §3.1, Decision A): the SDK
 * registry is the single source of a service's coordinates on each chain.
 * Only STARKNET is populated today; adding a chain adds a key here.
 *
 * Phase 2B.2 of the service-model refactor. `ip-erc721` has no dedicated
 * on-chain constant in src/constants.ts, so its `onchain` is omitted rather
 * than invented (the genesis contract address ships with that service).
 */
declare const SERVICES: {
    readonly "mip-erc721": {
        readonly id: "mip-erc721";
        readonly displayName: "IP Collection";
        readonly description: "Tokenize intellectual property as a per-creator ERC-721 collection.";
        readonly standard: "ERC721";
        readonly provenance: "MEDIALANE";
        readonly onchain: {
            readonly STARKNET: {
                readonly factoryAddress: `0x${string}`;
                readonly startBlock: number;
            };
        };
        readonly uiVariant: "standard";
        readonly capabilities: ["list", "buy", "make_offer", "cancel", "transfer", "mint", "remix", "license"];
        readonly events: [{
            readonly name: "CollectionCreated";
            readonly emittedBy: "factory";
        }];
        readonly metadataSchema: {
            readonly licenseDefault: "CC BY-SA";
        };
    };
    readonly "ip-erc721": {
        readonly id: "ip-erc721";
        readonly displayName: "Programmable IP (genesis)";
        readonly description: "One shared ERC-721 contract; many wallets mint genesis pieces.";
        readonly standard: "ERC721";
        readonly provenance: "MEDIALANE";
        readonly uiVariant: "standard";
        readonly capabilities: ["list", "buy", "make_offer", "cancel", "transfer", "mint", "remix", "license"];
        readonly metadataSchema: {
            readonly licenseDefault: "CC BY-SA";
        };
    };
    readonly "mip-erc1155": {
        readonly id: "mip-erc1155";
        readonly displayName: "NFT Editions";
        readonly description: "Per-creator ERC-1155 collection; creator mints editions.";
        readonly standard: "ERC1155";
        readonly provenance: "MEDIALANE";
        readonly onchain: {
            readonly STARKNET: {
                readonly factoryAddress: `0x${string}`;
                readonly classHash: `0x${string}`;
                readonly startBlock: number;
            };
        };
        readonly uiVariant: "edition";
        readonly capabilities: ["list", "buy", "make_offer", "cancel", "transfer", "mint", "remix", "license"];
        readonly events: [{
            readonly name: "CollectionDeployed";
            readonly emittedBy: "factory";
        }];
        readonly metadataSchema: {
            readonly licenseDefault: "CC BY-SA";
        };
    };
    readonly "pop-protocol": {
        readonly id: "pop-protocol";
        readonly displayName: "POP Protocol";
        readonly description: "Soulbound proof-of-presence collectibles per event.";
        readonly standard: "ERC721";
        readonly provenance: "MEDIALANE";
        readonly onchain: {
            readonly STARKNET: {
                readonly factoryAddress: `0x${string}`;
                readonly classHash: `0x${string}`;
            };
        };
        readonly uiVariant: "pop";
        readonly capabilities: ["claim", "mint"];
        readonly events: [{
            readonly name: "CollectionCreated";
            readonly emittedBy: "factory";
        }, {
            readonly name: "AllowlistUpdated";
            readonly emittedBy: "instance";
            readonly poll: "slow";
        }];
        readonly metadataSchema: {
            readonly licenseDefault: "CC BY-SA";
        };
    };
    readonly "drop-collection": {
        readonly id: "drop-collection";
        readonly displayName: "Collection Drop";
        readonly description: "Sequential mint with claim windows + allowlist.";
        readonly standard: "ERC721";
        readonly provenance: "MEDIALANE";
        readonly onchain: {
            readonly STARKNET: {
                readonly factoryAddress: `0x${string}`;
                readonly classHash: `0x${string}`;
            };
        };
        readonly uiVariant: "drop";
        readonly capabilities: ["claim", "list", "buy", "make_offer", "cancel", "transfer"];
        readonly events: [{
            readonly name: "DropCreated";
            readonly emittedBy: "factory";
        }, {
            readonly name: "AllowlistUpdated";
            readonly emittedBy: "instance";
            readonly poll: "slow";
        }];
        readonly metadataSchema: {
            readonly licenseDefault: "CC BY-SA";
        };
    };
    readonly "ip-tickets": {
        readonly id: "ip-tickets";
        readonly displayName: "IP Tickets";
        readonly description: "Sell verifiable, redeemable tickets for events and experiences.";
        readonly standard: "ERC721";
        readonly provenance: "MEDIALANE";
        readonly uiVariant: "ticket";
        readonly capabilities: ["mint", "redeem", "transfer"];
        readonly events: [{
            readonly name: "CollectionDeployed";
            readonly emittedBy: "factory";
        }];
        readonly metadataSchema: {
            readonly licenseDefault: "CC BY-SA";
        };
    };
    readonly "ip-club": {
        readonly id: "ip-club";
        readonly displayName: "IP Club";
        readonly description: "Membership clubs with an on-chain NFT membership card.";
        readonly standard: "ERC721";
        readonly provenance: "MEDIALANE";
        readonly uiVariant: "club";
        readonly capabilities: ["subscribe"];
        readonly events: [{
            readonly name: "NewClubCreated";
            readonly emittedBy: "factory";
        }];
        readonly metadataSchema: {
            readonly licenseDefault: "CC BY-SA";
        };
    };
    readonly "ip-sponsorship": {
        readonly id: "ip-sponsorship";
        readonly displayName: "IP Sponsorship";
        readonly description: "Sponsorship offers and licenses anchored to an existing Medialane asset.";
        readonly standard: "ERC721";
        readonly provenance: "MEDIALANE";
        readonly uiVariant: "standard";
        readonly capabilities: ["sponsor"];
        readonly metadataSchema: {
            readonly licenseDefault: "CC BY-SA";
        };
    };
    readonly "ip-sponsorship-license": {
        readonly id: "ip-sponsorship-license";
        readonly displayName: "Sponsorship License Receipt";
        readonly description: "Non-authoritative receipt NFT minted to a sponsor when a sponsorship bid is accepted.";
        readonly standard: "ERC721";
        readonly provenance: "MEDIALANE";
        readonly uiVariant: "standard";
        readonly capabilities: ["transfer"];
        readonly metadataSchema: {
            readonly licenseDefault: "CC BY-SA";
        };
    };
    readonly "creator-coin": {
        readonly id: "creator-coin";
        readonly displayName: "Creator Coin";
        readonly description: "Launch a fixed-supply social token with permanently-locked Ekubo liquidity.";
        readonly standard: "ERC20";
        readonly provenance: "MEDIALANE";
        readonly onchain: {
            readonly STARKNET: {
                readonly factoryAddress: `0x${string}`;
                readonly classHash: `0x${string}`;
                readonly startBlock: number;
            };
        };
        readonly uiVariant: "coin";
        readonly capabilities: ["launch", "swap", "transfer"];
        readonly events: [{
            readonly name: "CreatorCoinCreated";
            readonly emittedBy: "factory";
        }, {
            readonly name: "CreatorCoinLaunched";
            readonly emittedBy: "factory";
        }];
    };
    readonly "medialane-marketplace-erc721": {
        readonly id: "medialane-marketplace-erc721";
        readonly displayName: "Medialane Marketplace (ERC-721)";
        readonly description: "ERC-721 order matching venue.";
        readonly standard: "ERC721";
        readonly provenance: "MEDIALANE";
        readonly onchain: {
            readonly STARKNET: {
                readonly factoryAddress: `0x${string}`;
                readonly classHash: `0x${string}`;
                readonly startBlock: number;
            };
        };
        readonly uiVariant: "standard";
        readonly capabilities: ["list", "buy", "make_offer", "cancel"];
        readonly events: [{
            readonly name: "OrderCreated";
            readonly emittedBy: "factory";
        }, {
            readonly name: "OrderFulfilled";
            readonly emittedBy: "factory";
        }, {
            readonly name: "OrderCancelled";
            readonly emittedBy: "factory";
        }];
    };
    readonly "medialane-marketplace-erc1155": {
        readonly id: "medialane-marketplace-erc1155";
        readonly displayName: "Medialane Marketplace (ERC-1155)";
        readonly description: "ERC-1155 order matching venue.";
        readonly standard: "ERC1155";
        readonly provenance: "MEDIALANE";
        readonly onchain: {
            readonly STARKNET: {
                readonly factoryAddress: `0x${string}`;
                readonly classHash: `0x${string}`;
                readonly startBlock: number;
            };
        };
        readonly uiVariant: "edition";
        readonly capabilities: ["list", "buy", "make_offer", "cancel"];
        readonly events: [{
            readonly name: "OrderCreated";
            readonly emittedBy: "factory";
        }, {
            readonly name: "OrderFulfilled";
            readonly emittedBy: "factory";
        }, {
            readonly name: "OrderCancelled";
            readonly emittedBy: "factory";
        }];
    };
    readonly "external-erc20": {
        readonly id: "external-erc20";
        readonly displayName: "External ERC-20";
        readonly description: "An ERC-20 token (e.g. an unrug memecoin or a partner coin) not deployed via a Medialane service. Brought in by owner claim or admin/partnership — never bulk-indexed. Generalizes to future chains.";
        readonly standard: "ERC20";
        readonly provenance: "EXTERNAL";
        readonly uiVariant: "coin";
        readonly capabilities: ["swap", "transfer"];
    };
    readonly "external-erc721": {
        readonly id: "external-erc721";
        readonly displayName: "External ERC-721";
        readonly description: "ERC-721 contract not deployed via a Medialane service.";
        readonly standard: "ERC721";
        readonly provenance: "EXTERNAL";
        readonly uiVariant: "standard";
        readonly capabilities: ["list", "buy", "make_offer", "cancel", "transfer"];
    };
    readonly "external-erc1155": {
        readonly id: "external-erc1155";
        readonly displayName: "External ERC-1155";
        readonly description: "ERC-1155 contract not deployed via a Medialane service.";
        readonly standard: "ERC1155";
        readonly provenance: "EXTERNAL";
        readonly uiVariant: "edition";
        readonly capabilities: ["list", "buy", "make_offer", "cancel", "transfer"];
    };
};
/**
 * Literal-union of every registered service ID. Use this as the type for
 * `Collection.service` write sites in consumers — typos like "pop_protocol"
 * (underscore instead of hyphen) become compile errors.
 *
 * `getService()` still accepts loose `string` for read-side lookups where the
 * value came from the DB and is trusted to already be valid.
 */
type ServiceId = keyof typeof SERVICES;
/** Type guard: narrows a string to ServiceId if it's registered. */
declare function isServiceId(id: string | null | undefined): id is ServiceId;
/** Lookup. Returns undefined for unregistered service IDs — callers should
 *  treat that as a data error, since every Collection.service value is
 *  expected to map to a registered ServiceDefinition. */
declare function getService(id: string | null | undefined): ServiceDefinition | undefined;
/** All registered services (e.g. the launchpad grid). */
declare function listServices(): ServiceDefinition[];
/** Services that declare a capability (e.g. "where can users mint"). */
declare function getServicesByCapability(cap: ServiceCapability): ServiceDefinition[];
/** Whether a service declares a given capability — e.g. whether an asset
 *  type is transferable. Returns false for an unregistered/missing id rather
 *  than throwing, since callers use this for UI copy, not authority checks. */
declare function hasCapability(id: string | null | undefined, cap: ServiceCapability): boolean;

/**
 * Normalize an address to its chain's canonical form. The single source of
 * address normalization across Medialane (07-identity §I; spec 2026-06-13 §3.2).
 * `medialane-backend` re-exports this; do not maintain a parallel copy.
 *
 * - STARKNET: 0x-prefixed 64-char lowercase hex (felt, zero-padded).
 * - ETHEREUM / BASE: EIP-55 mixed-case checksum.
 * - SOLANA: base58, validated as a 32-byte public key, returned verbatim.
 * - STELLAR: strkey (G… account / C… contract), CRC16-XModem-verified,
 *   canonical uppercase.
 * - BITCOIN: not implemented — a non-foreclosed seam, gated on a future
 *   Bitcoin fork (chain-sovereignty §2); never a built path today.
 */
declare function normalizeAddress(chain: Chain, address: string): string;
/**
 * Normalize a felt/hash (tx hash, order hash) to 0x-prefixed 64-char lowercase
 * hex. Starknet-shaped; chain-scoped at call sites that handle other chains'
 * hashes.
 */
declare function normalizeHash(hash: string): string;
/** Shorten an address to "0x1234...abcd" form, normalized for its chain. */
declare function shortenAddress(chain: Chain, address: string, chars?: number): string;

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
 * Resilient Starknet RPC helpers — the single source of truth for "what counts
 * as a transient RPC failure" and the public fallback endpoint list, shared by
 * every Medialane app:
 *   - dapp / io `starknetProvider` singletons (RpcProvider.baseFetch)
 *   - io `/api/rpc` server-side proxy (upstream rotation)
 *   - backend circuit breaker + receipt-rotation paths
 *
 * Motivation (2026-06-03): Alchemy's Starknet mainnet endpoint intermittently
 * returns HTTP 503 with the JSON-RPC envelope `-32001 "Unable to complete
 * request at this time."` (~1 in 6 calls, while its status page reads green).
 * A single blip inside a `waitForTransaction` poll loop stalls mints/listings.
 * Failing over to a public endpoint recovers silently.
 */
/**
 * Ordered public Starknet **mainnet** RPC endpoints (no API key required),
 * used as fallback after an app's configured primary (e.g. Alchemy) returns a
 * transient error. lava.build — RPC spec 0.8.1, permissive CORS — so it is
 * safe for browser `baseFetch` use as well as server-side rotation.
 *
 * blastapi.io and free-rpc.nethermind.io were removed (2026-07-04) — long
 * confirmed dead/unreliable in production; do not re-add them.
 */
declare const PUBLIC_RPC_FALLBACKS: readonly string[];
/**
 * Is this RPC response worth retrying against another endpoint?
 *
 * Accepts either an HTTP status + raw text body (client `baseFetch` path) or a
 * parsed JSON-RPC envelope (server proxy path). For parsed envelopes the
 * server-defined error-code range (`-32099..-32000`) is treated as transient;
 * for raw text only the explicit `-32001`/`-32603` codes + message hints match,
 * so a `-32000` "Unauthorized" text body is never mistaken for transient.
 */
declare function isTransientRpcError(input: {
    status?: number;
    body?: unknown;
}): boolean;
interface FailoverFetchOptions {
    /** Underlying fetch to wrap (e.g. one that adds a timeout). Defaults to the global `fetch`. */
    baseFetch?: typeof fetch;
    /** Invoked each time an endpoint is abandoned for the next one. */
    onFailover?: (info: {
        url: string;
        status?: number;
        error?: unknown;
    }) => void;
}
/**
 * Build a `fetch` suitable for `RpcProvider.baseFetch` that tries each URL in
 * `urls` in order, advancing to the next only on a transient failure (network
 * error, 5xx/429, or a transient JSON-RPC envelope). The provider's own
 * `nodeUrl` argument is ignored — routing is controlled entirely by `urls` —
 * so callers should set `nodeUrl: urls[0]` (used only for spec negotiation).
 *
 * @example
 *   const urls = [primaryAlchemyUrl, ...PUBLIC_RPC_FALLBACKS];
 *   new RpcProvider({ nodeUrl: urls[0], baseFetch: createFailoverFetch(urls) });
 */
declare function createFailoverFetch(urls: string[], options?: FailoverFetchOptions): typeof fetch;

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

export { type AdapterTxResult, type AssetRef, Chain, type CreateCollectionInput, DEFAULT_CURRENCY, type FailoverFetchOptions, type IssuanceAdapter, type MintInput, type OrderRef, PUBLIC_RPC_FALLBACKS, type RegisterOrderParams, STARKNET_COLLECTION_1155_CLASS_HASH, STARKNET_COLLECTION_1155_CONTRACT, STARKNET_COLLECTION_1155_FACTORY_CLASS_HASH, STARKNET_COLLECTION_1155_START_BLOCK, STARKNET_COLLECTION_721_CONTRACT, STARKNET_COLLECTION_721_START_BLOCK, STARKNET_CREATOR_COIN_CLASS_HASH, STARKNET_CREATOR_COIN_EKUBO_LAUNCHER, STARKNET_CREATOR_COIN_FACTORY_CLASS_HASH, STARKNET_CREATOR_COIN_FACTORY_CONTRACT, STARKNET_CREATOR_COIN_START_BLOCK, STARKNET_DROP_COLLECTION_CLASS_HASH, STARKNET_DROP_FACTORY_CONTRACT, STARKNET_EKUBO_CORE, STARKNET_IPCOLLECTION_CLASS_HASH, STARKNET_IPNFT_CLASS_HASH, STARKNET_IP_CLUB_NFT_CLASS_HASH, STARKNET_IP_CLUB_REGISTRY_CONTRACT, STARKNET_IP_SPONSORSHIP_CONTRACT, STARKNET_IP_SPONSORSHIP_LICENSE_CONTRACT, STARKNET_IP_TICKETS_FACTORY_CONTRACT, STARKNET_IP_TICKET_COLLECTION_CLASS_HASH, STARKNET_MARKETPLACE_1155_CLASS_HASH, STARKNET_MARKETPLACE_1155_CONTRACT, STARKNET_MARKETPLACE_1155_START_BLOCK, STARKNET_MARKETPLACE_721_CLASS_HASH, STARKNET_MARKETPLACE_721_CONTRACT, STARKNET_MARKETPLACE_721_START_BLOCK, STARKNET_NFTCOMMENTS_CONTRACT, STARKNET_POP_COLLECTION_CLASS_HASH, STARKNET_POP_FACTORY_CONTRACT, SUPPORTED_TOKENS, ServiceCapability, ServiceDefinition, type ServiceId, type SupportedToken, type SupportedTokenSymbol, type VenueAdapter, createFailoverFetch, formatAmount, getListableTokens, getService, getServicesByCapability, getTokenByAddress, getTokenBySymbol, hasCapability, isServiceId, isTransientRpcError, listServices, normalizeAddress, normalizeHash, parseAmount, shortenAddress, stringifyBigInts, u256ToBigInt };
