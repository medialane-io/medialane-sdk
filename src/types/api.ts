export type IPType =
  | "Audio"
  | "Art"
  | "Documents"
  | "NFT"
  | "Video"
  | "Photography"
  | "Patents"
  | "Posts"
  | "Publications"
  | "RWA"
  | "Software"
  | "Custom";

export type CollectionSort = "recent" | "supply" | "floor" | "volume" | "name";

/** Bounded capability set (05-service-model §III). Expand the union when a
 *  service needs behavior outside it — never make it free-form. */
export type ServiceCapability =
  | "list" | "buy" | "make_offer" | "cancel"
  | "transfer" | "burn"
  | "mint" | "claim" | "airdrop"
  | "remix" | "license"
  | "subscribe" | "redeem";

/** A service that bakes enforcement into its own contract declares it here
 *  (04-licensing-model §V, 05-service-model §IV). Absence/all-falsey =
 *  soft enforcement (the 00-principles §9 default). */
export interface EnforcementDeclaration {
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
export interface ServiceEventDeclaration {
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
export interface ServiceDefinition {
  /** Stable kebab-case id. NO version number (05 §II). */
  id: string;
  displayName: string;
  description: string;
  standard: "ERC721" | "ERC1155" | "UNKNOWN";
  provenance: "MEDIALANE" | "EXTERNAL";
  onchain?: {
    factoryAddress?: string;
    classHash?: string;
    startBlock?: number;
  };
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

export interface ApiCollectionsQuery {
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
export type OrderStatus = "ACTIVE" | "FULFILLED" | "CANCELLED" | "EXPIRED";
export type SortOrder = "price_asc" | "price_desc" | "recent";
export type ActivityType = "mint" | "transfer" | "sale" | "listing" | "offer" | "cancelled";
export type IntentType = "CREATE_LISTING" | "MAKE_OFFER" | "FULFILL_ORDER" | "CANCEL_ORDER" | "MINT" | "CREATE_COLLECTION" | "COUNTER_OFFER";
export type IntentStatus = "PENDING" | "SIGNED" | "SUBMITTED" | "CONFIRMED" | "FAILED" | "EXPIRED";
export type WebhookEventType = "ORDER_CREATED" | "ORDER_FULFILLED" | "ORDER_CANCELLED" | "TRANSFER";
export type WebhookStatus = "ACTIVE" | "DISABLED";
export type ApiKeyStatus = "ACTIVE" | "REVOKED";
export type TenantPlan = "FREE" | "PREMIUM";

// ─── Shared ───────────────────────────────────────────────────────────────────

export interface ApiMeta {
  page: number;
  limit: number;
  total?: number;
}

export interface ApiResponse<T> {
  data: T;
  meta?: ApiMeta;
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export interface ApiOrdersQuery {
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

export interface ApiOrderOffer {
  itemType: string;
  token: string;
  identifier: string;
  startAmount: string;
  endAmount: string;
}

export interface ApiOrderConsideration extends ApiOrderOffer {
  recipient: string;
}

export interface ApiOrderPrice {
  raw: string | null;
  formatted: string | null;
  currency: string | null;
  decimals: number;
}

export interface ApiOrderTxHash {
  created: string | null;
  fulfilled: string | null;
  cancelled: string | null;
}

export interface ApiOrderTokenMeta {
  name: string | null;
  image: string | null;
  description: string | null;
}

export interface ApiOrder {
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

// ─── IP / IPFS Metadata types ──────────────────────────────────────────────────

/**
 * A single OpenSea-compatible ERC-721 attribute.
 * Medialane embeds licensing, provenance, and IP metadata as attributes.
 */
export interface IpAttribute {
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
export interface IpNftMetadata {
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

// ─── Tokens ───────────────────────────────────────────────────────────────────

/** Indexed token metadata as returned by the Medialane API. */
export interface ApiTokenMetadata {
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
export interface ApiTokenBalance {
  owner: string;
  /** Quantity held. Always "1" for ERC-721. */
  amount: string;
}

export interface ApiToken {
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

// ─── Collections ──────────────────────────────────────────────────────────────

export interface ApiCollection {
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
  /** Token standard detected via ERC-165. */
  standard: "ERC721" | "ERC1155" | "UNKNOWN";
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

// ─── Activities ───────────────────────────────────────────────────────────────

export interface ApiActivityPrice {
  raw: string | null;
  formatted: string | null;
  currency: string | null;
}

export interface ApiActivity {
  type: ActivityType;
  // Transfer fields
  contractAddress?: string;
  tokenId?: string;
  from?: string;
  to?: string;
  blockNumber?: string;
  /** ERC-1155 quantity (transfer/mint rows). "1" for ERC-721. */
  amount?: string;
  // Order fields
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
  token?: { name: string | null; image: string | null } | null;
}

export interface ApiActivitiesQuery {
  type?: ActivityType;
  page?: number;
  limit?: number;
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export interface ApiComment {
  id: string;
  chain: string;           // "starknet"
  contractAddress: string; // normalized 0x-padded Starknet address
  tokenId: string;
  author: string;          // normalized 0x-padded Starknet address
  content: string;         // sanitized plain text
  txHash: string | null;
  blockNumber: string;     // BigInt serialized as string
  postedAt: string;        // ISO 8601 derived from blockTimestamp — use for display
}

// ─── Search ───────────────────────────────────────────────────────────────────

export interface ApiSearchTokenResult {
  contractAddress: string;
  tokenId: string;
  name: string | null;
  image: string | null;
  owner: string;
  metadataStatus: string;
}

export interface ApiSearchCollectionResult {
  contractAddress: string;
  name: string | null;
  image: string | null;
  totalSupply: number | null;
  floorPrice: string | null;
  holderCount: number | null;
}

export interface ApiSearchCreatorResult {
  walletAddress: string;
  username: string | null;
  displayName: string | null;
  bio: string | null;
  avatarImage: string | null;
}

export interface ApiSearchResult {
  tokens: ApiSearchTokenResult[];
  collections: ApiSearchCollectionResult[];
  creators: ApiSearchCreatorResult[];
}

// ─── Intents ──────────────────────────────────────────────────────────────────

export interface ApiIntent {
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

export interface ApiIntentCreated {
  id: string;
  typedData: unknown;
  calls: unknown;
  expiresAt: string;
}

export interface CreateListingIntentParams {
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

export interface MakeOfferIntentParams {
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

export interface FulfillOrderIntentParams {
  fulfiller: string;
  orderHash: string;
  /** Caller hint — "ERC1155" forces 1155 routing even if the order isn't in the DB yet */
  tokenStandard?: string;
  /** ERC-1155 only: units to purchase (1 ≤ quantity ≤ remaining_amount). Defaults to 1. */
  quantity?: string;
}

export interface CancelOrderIntentParams {
  offerer: string;
  orderHash: string;
  /** Caller hint — "ERC1155" forces 1155 routing even if the order isn't in the DB yet */
  tokenStandard?: string;
}

export interface CreateMintIntentParams {
  /** Collection owner wallet address — must be the collection owner on-chain */
  owner: string;
  collectionId: string;
  recipient: string;
  tokenUri: string;
  /** Optional: override the default collection contract address */
  collectionContract?: string;
}

export interface CreateCollectionIntentParams {
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

export interface CreateCounterOfferIntentParams {
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

export interface ApiCounterOffersQuery {
  /** Original bid order hash — returns the counter-offer for this specific bid. */
  originalOrderHash?: string;
  /** Seller address — returns all counter-offers sent by this seller. */
  sellerAddress?: string;
  page?: number;
  limit?: number;
}

// ─── Remix Licensing ──────────────────────────────────────────────────────────

export const OPEN_LICENSES = ["CC0", "CC BY", "CC BY-SA", "CC BY-NC"] as const;
export type OpenLicense = (typeof OPEN_LICENSES)[number];

export type RemixOfferStatus =
  | "PENDING"
  | "AUTO_PENDING"
  | "APPROVED"
  | "COMPLETED"
  | "REJECTED"
  | "EXPIRED"
  | "SELF_MINTED";

export interface ApiRemixOfferPrice {
  raw: string;
  formatted: string;
  currency: string;
  decimals: number;
}

export interface ApiRemixOffer {
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
export interface ApiPublicRemix {
  id: string;
  remixContract: string | null;
  remixTokenId: string | null;
  licenseType: string;
  commercial: boolean;
  derivatives: boolean;
  createdAt: string;
}

export interface CreateRemixOfferParams {
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

export interface AutoRemixOfferParams {
  originalContract: string;
  originalTokenId: string;
  licenseType: string;
}

export interface ConfirmSelfRemixParams {
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

export interface ConfirmRemixOfferParams {
  approvedCollection: string;
  remixContract: string;
  remixTokenId: string;
  orderHash?: string;
}

export interface ApiRemixOffersQuery {
  /** "creator" = offers where you are the original creator; "requester" = offers you made */
  role: "creator" | "requester";
  page?: number;
  limit?: number;
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export interface ApiMetadataSignedUrl {
  url: string;
}

export interface ApiMetadataUpload {
  cid: string;
  url: string;
}

// ─── Portal (tenant self-service) ─────────────────────────────────────────────

export interface ApiPortalMe {
  id: string;
  name: string;
  email: string;
  plan: TenantPlan;
  status: string;
}

export interface ApiPortalKey {
  id: string;
  prefix: string;
  label: string;
  status: ApiKeyStatus;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface ApiPortalKeyCreated {
  id: string;
  prefix: string;
  label: string | null;
  /** Plaintext key — shown ONCE at creation */
  plaintext: string;
}

export interface ApiUsageDay {
  day: string;
  requests: number;
}

export interface ApiWebhookEndpoint {
  id: string;
  url: string;
  events: WebhookEventType[];
  status: WebhookStatus;
  createdAt: string;
}

export interface ApiWebhookCreated extends ApiWebhookEndpoint {
  /** Signing secret — shown ONCE at creation, not stored in plaintext */
  secret: string;
}

export interface CreateWebhookParams {
  url: string;
  events: WebhookEventType[];
  label?: string;
}

// ─── Collection & Creator Profiles ────────────────────────────────────────────

export interface ApiCollectionProfile {
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

export interface ApiCollectionSlugClaim {
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

export interface ApiCreatorProfile {
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

export interface ApiCreatorListResult {
  creators: ApiCreatorProfile[];
  total: number;
  page: number;
  limit: number;
}

// ─── User Wallet ───────────────────────────────────────────────────────────────

export type ApiWalletType =
  | "ARGENT"
  | "BRAAVOS"
  | "CARTRIDGE"
  | "PRIVY"
  | "CHIPIPAY"
  | "INJECTED"
  | "UNKNOWN";

export type ApiAppSource =
  | "MEDIALANE_DAPP"
  | "MEDIALANE_IO"
  | "MEDIALANE_PORTAL"
  | "MEDIALANE_SDK";

// 07-identity §I: the Wallet identifier is (chain, address). Mirrors
// the backend Chain enum. v1 callers only ever pass STARKNET; the rest
// are present so the type doesn't need a breaking change when SIWE/SIWB
// authentication lands and other chains become callable.
export type ApiChain = "STARKNET" | "ETHEREUM" | "SOLANA" | "BITCOIN";

export interface ApiUserWallet {
  walletAddress: string;
}

// ─── Collection Claims ─────────────────────────────────────────────────────────

export interface ApiCollectionClaim {
  id: string;
  contractAddress: string;
  chain: string;
  claimantAddress: string | null;
  status: "PENDING" | "AUTO_APPROVED" | "APPROVED" | "REJECTED";
  verificationMethod: "ONCHAIN" | "SIGNATURE" | "MANUAL";
  createdAt: string;
}

export interface ApiAdminCollectionClaim extends ApiCollectionClaim {
  claimantEmail: string | null;
  notes: string | null;
  adminNotes: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  updatedAt: string;
}

// ─── POP Protocol ──────────────────────────────────────────────────────────────

export interface PopClaimStatus {
  isEligible: boolean;
  hasClaimed: boolean;
  tokenId: string | null;
}

export interface PopBatchEligibilityItem extends PopClaimStatus {
  wallet: string;
}

export type PopEventType =
  | "Conference"
  | "Bootcamp"
  | "Workshop"
  | "Hackathon"
  | "Meetup"
  | "Course"
  | "Other";

// ─── Collection Drop ───────────────────────────────────────────────────────────

export interface DropMintStatus {
  mintedByWallet: number;
  totalMinted: number;
}
