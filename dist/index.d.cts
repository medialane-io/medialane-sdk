import { S as ServiceDefinition, a as ServiceCapability } from './index-Dgw8Wl8U.cjs';
export { A as ADMIN_HEADERS, b as ADMIN_SCOPE, c as ActivityType, d as AddSupplyParams, e as AdminGrant, f as AdminRequest, g as AdminRequestSig, h as AdminSession, i as AdminSessionTypedDataInput, j as ApiActivitiesQuery, k as ApiActivity, l as ApiActivityPrice, m as ApiAdminCollectionClaim, n as ApiAppSource, o as ApiChain, p as ApiClient, q as ApiCoin, r as ApiCoinsQuery, s as ApiCollection, t as ApiCollectionClaim, u as ApiCollectionProfile, v as ApiCollectionSlugClaim, w as ApiCollectionsQuery, x as ApiComment, y as ApiCounterOffersQuery, z as ApiCreatorListResult, B as ApiCreatorProfile, C as ApiIntent, D as ApiIntentCreated, E as ApiKeyStatus, F as ApiMeta, G as ApiMetadataSignedUrl, H as ApiMetadataUpload, I as ApiOrder, J as ApiOrderConsideration, K as ApiOrderOffer, L as ApiOrderPrice, M as ApiOrderTokenMeta, N as ApiOrderTxHash, O as ApiOrdersQuery, P as ApiPointEvent, Q as ApiPortalKey, R as ApiPortalKeyCreated, T as ApiPortalMe, U as ApiPublicRemix, V as ApiRemixOffer, W as ApiRemixOfferPrice, X as ApiRemixOffersQuery, Y as ApiResponse, Z as ApiRewardsBadge, _ as ApiRewardsBatchEntry, $ as ApiRewardsConfig, a0 as ApiRewardsLeaderboardEntry, a1 as ApiRewardsLevel, a2 as ApiSearchCollectionResult, a3 as ApiSearchCreatorResult, a4 as ApiSearchResult, a5 as ApiSearchTokenResult, a6 as ApiToken, a7 as ApiTokenBalance, a8 as ApiTokenMetadata, a9 as ApiUsageDay, aa as ApiUserRewards, ab as ApiUserWallet, ac as ApiWebhookCreated, ad as ApiWebhookEndpoint, ae as AutoRemixOfferParams, af as BatchMintEditionParams, ag as BuildFeeCallParams, ah as COIN_MAX_SUPPLY, ai as COIN_MIN_SUPPLY, aj as CancelOrder1155Params, ak as CancelOrderIntentParams, al as CancelOrderParams, am as Cancelation, an as CartItem, ao as ChainFilter, ap as ClaimConditions, aq as ClubService, ar as CollectionSort, as as CollectionTokensSort, at as ConfirmRemixOfferParams, au as ConfirmSelfRemixParams, av as ConsiderationItem, aw as CreateClubParams, ax as CreateCollectionIntentParams, ay as CreateCollectionParams, az as CreateCounterOfferIntentParams, aA as CreateCreatorCoinParams, aB as CreateDropParams, aC as CreateGrantOpts, aD as CreateListing1155Params, aE as CreateListingIntentParams, aF as CreateListingParams, aG as CreateMintIntentParams, aH as CreatePopCollectionParams, aI as CreateRemixOfferParams, aJ as CreateSponsorshipOfferParams, aK as CreateTicketCollectionParams, aL as CreateWebhookParams, aM as CreatorCoinFactoryABI, aN as CreatorCoinPrice, aO as CreatorCoinReceiptLike, aP as CreatorCoinService, aQ as DeployClubParams, aR as DeployCollectionParams, aS as DropCollectionABI, aT as DropFactoryABI, aU as DropMintStatus, aV as DropService, aW as ERC1155CollectionService, aX as EkuboLaunchParams, aY as EkuboPoolParams, aZ as EnforcementDeclaration, a_ as FeeConfig, a$ as FeeConfigSchema, b0 as FeeSurface, b1 as FulfillOrder1155Params, b2 as FulfillOrderIntentParams, b3 as FulfillOrderParams, b4 as IPClubABI, b5 as IPClubCollectionABI, b6 as IPClubFactoryABI, b7 as IPClubNFTABI, b8 as IPCollection1155ABI, b9 as IPCollection1155FactoryABI, ba as IPCollectionABI, bb as IPGenesisABI, bc as IPMarketplaceABI, bd as IPNftABI, be as IPSponsorshipABI, bf as IPSponsorshipLicenseABI, bg as IPTicketCollectionABI, bh as IPTicketCollectionFactoryABI, bi as IPType, bj as IntentCall, bk as IntentStatus, bl as IntentType, bm as IpAttribute, bn as IpNftMetadata, bo as LAUNCH_PRICE_QUOTE_PER_COIN, bp as MakeOffer1155Params, bq as MakeOfferIntentParams, br as MakeOfferParams, bs as MarketplaceModule, bt as Medialane1155ABI, bu as Medialane1155Module, bv as MedialaneApiError, bw as MedialaneClient, bx as MedialaneConfig, by as MedialaneError, bz as MedialaneErrorCode, bA as MintEditionParams, bB as MintParams, bC as OPEN_LICENSES, bD as OfferItem, bE as OpenLicense, bF as Order, bG as OrderDetails, bH as OrderParameters, bI as OrderStatus, bJ as POPCollectionABI, bK as POPFactoryABI, bL as ParsedAdminHeaders, bM as PopBatchEligibilityItem, bN as PopClaimStatus, bO as PopEventType, bP as PopService, bQ as RemixOfferStatus, bR as RequestSiwsTokenArgs, bS as ResolvedConfig, bT as ResolvedFeeConfig, bU as ResolvedOrder, bV as RetryOptions, bW as ServiceEventDeclaration, bX as SiwsSigner, bY as SortOrder, bZ as SponsorshipService, b_ as StarknetVenue, b$ as StarknetVenueDeps, c0 as StarknetVenueSigner, c1 as TenantPlan, c2 as TicketService, c3 as TxResult, c4 as VALIDATED_EKUBO_PARAMS, c5 as WebhookEventType, c6 as WebhookStatus, c7 as adminRequestDigest, c8 as build1155CancellationTypedData, c9 as build1155OrderTypedData, ca as buildAdminSessionTypedData, cb as buildCancellationTypedData, cc as buildCreateCreatorCoinCall, cd as buildFeeCall, ce as buildLaunchOnEkuboCalls, cf as buildOrderTypedData, cg as buybackQuoteRaw, ch as coinToRaw, ci as createAdminSessionGrant, cj as encodeAdminHeaders, ck as encodeByteArray, cl as fdvHuman, cm as getCreatorCoinPrice, cn as getSiwsStorageKey, co as getStoredSiwsToken, cp as isSiwsTokenValid, cq as normalizeSiwsSignature, cr as parseAdminHeaders, cs as parseCreatorCoinCreated, ct as randomNonce, cu as requestSiwsToken, cv as resolveConfig, cw as resolveFeeConfig, cx as sessionKeyHashOf, cy as signAdminRequest, cz as storeSiwsToken, cA as teamCoinsRaw, cB as validateCoinName, cC as validateCoinSupply, cD as validateCoinSymbol, cE as verifyAdminRequestSig } from './index-Dgw8Wl8U.cjs';
import { C as Chain } from './types-Bx3ax9lW.cjs';
export { A as AdapterTxResult, a as AssetRef, b as CHAINS, c as ChainCoordinates, d as CoordinatesByChain, e as CreateCollectionInput, D as DEFAULT_CHAIN, E as EvmCoordinates, I as IssuanceAdapter, M as MintInput, O as OrderRef, R as RegisterOrderParams, S as SolanaCoordinates, f as StarknetCoordinates, g as StellarCoordinates, V as VenueAdapter, h as VenueSigner, i as getCoordinates, j as getStarknetCoordinates } from './types-Bx3ax9lW.cjs';
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
declare const STARKNET_IP_CLUB_FACTORY_CONTRACT: `0x${string}`;
declare const STARKNET_IP_CLUB_COLLECTION_CLASS_HASH: `0x${string}`;
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

export { Chain, DEFAULT_CURRENCY, type FailoverFetchOptions, PUBLIC_RPC_FALLBACKS, STARKNET_COLLECTION_1155_CLASS_HASH, STARKNET_COLLECTION_1155_CONTRACT, STARKNET_COLLECTION_1155_FACTORY_CLASS_HASH, STARKNET_COLLECTION_1155_START_BLOCK, STARKNET_COLLECTION_721_CONTRACT, STARKNET_COLLECTION_721_START_BLOCK, STARKNET_CREATOR_COIN_CLASS_HASH, STARKNET_CREATOR_COIN_EKUBO_LAUNCHER, STARKNET_CREATOR_COIN_FACTORY_CLASS_HASH, STARKNET_CREATOR_COIN_FACTORY_CONTRACT, STARKNET_CREATOR_COIN_START_BLOCK, STARKNET_DROP_COLLECTION_CLASS_HASH, STARKNET_DROP_FACTORY_CONTRACT, STARKNET_EKUBO_CORE, STARKNET_IPCOLLECTION_CLASS_HASH, STARKNET_IPNFT_CLASS_HASH, STARKNET_IP_CLUB_COLLECTION_CLASS_HASH, STARKNET_IP_CLUB_FACTORY_CONTRACT, STARKNET_IP_CLUB_NFT_CLASS_HASH, STARKNET_IP_CLUB_REGISTRY_CONTRACT, STARKNET_IP_SPONSORSHIP_CONTRACT, STARKNET_IP_SPONSORSHIP_LICENSE_CONTRACT, STARKNET_IP_TICKETS_FACTORY_CONTRACT, STARKNET_IP_TICKET_COLLECTION_CLASS_HASH, STARKNET_MARKETPLACE_1155_CLASS_HASH, STARKNET_MARKETPLACE_1155_CONTRACT, STARKNET_MARKETPLACE_1155_START_BLOCK, STARKNET_MARKETPLACE_721_CLASS_HASH, STARKNET_MARKETPLACE_721_CONTRACT, STARKNET_MARKETPLACE_721_START_BLOCK, STARKNET_NFTCOMMENTS_CONTRACT, STARKNET_POP_COLLECTION_CLASS_HASH, STARKNET_POP_FACTORY_CONTRACT, SUPPORTED_TOKENS, ServiceCapability, ServiceDefinition, type ServiceId, type SupportedToken, type SupportedTokenSymbol, createFailoverFetch, formatAmount, getListableTokens, getService, getServicesByCapability, getTokenByAddress, getTokenBySymbol, hasCapability, isServiceId, isTransientRpcError, listServices, normalizeAddress, normalizeHash, parseAmount, shortenAddress, stringifyBigInts, u256ToBigInt };
