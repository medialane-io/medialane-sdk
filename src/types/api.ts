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

export type CollectionSource = "MEDIALANE_REGISTRY" | "EXTERNAL" | "PARTNERSHIP" | "IP_TICKET" | "IP_CLUB" | "GAME" | "POP_PROTOCOL";

export interface ApiCollectionsQuery {
  page?: number;
  limit?: number;
  isKnown?: boolean;
  sort?: CollectionSort;
  owner?: string;
  source?: CollectionSource;
}

export type OrderStatus = "ACTIVE" | "FULFILLED" | "CANCELLED" | "EXPIRED" | "COUNTER_OFFERED";
export type SortOrder = "price_asc" | "price_desc" | "recent";
export type ActivityType = "transfer" | "sale" | "listing" | "offer" | "cancelled";
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
  createdAt: string;
  updatedAt: string;
  /** Embedded token metadata (name/image/description). Null when not yet indexed. */
  token: ApiOrderTokenMeta | null;
  /** Set when this is a counter-offer listing — points to the original buyer bid. */
  parentOrderHash?: string | null;
  /** Optional seller message accompanying a counter-offer. */
  counterOfferMessage?: string | null;
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

export interface ApiToken {
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
  isKnown: boolean;
  source: "MEDIALANE_REGISTRY" | "EXTERNAL" | "PARTNERSHIP" | "IP_TICKET" | "IP_CLUB" | "GAME" | "POP_PROTOCOL";
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
  // Order fields
  orderHash?: string;
  nftContract?: string;
  nftTokenId?: string;
  offerer?: string;
  fulfiller?: string | null;
  price?: ApiActivityPrice;
  txHash: string | null;
  timestamp: string;
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
}

export interface MakeOfferIntentParams {
  offerer: string;
  nftContract: string;
  tokenId: string;
  currency: string;
  price: string;
  endTime: number;
  salt?: string;
}

export interface FulfillOrderIntentParams {
  fulfiller: string;
  orderHash: string;
}

export interface CancelOrderIntentParams {
  offerer: string;
  orderHash: string;
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
  counterPrice: string;
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
  updatedBy: string | null;
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
