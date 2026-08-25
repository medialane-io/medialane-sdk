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

export type CollectionTokensSort = "recent" | "oldest" | "name" | "price";

export type ServiceCapability =
  | "list" | "buy" | "make_offer" | "cancel"
  | "transfer" | "burn"
  | "mint" | "claim" | "airdrop"
  | "remix" | "license"
  | "subscribe" | "redeem"
  | "launch" | "swap"
  | "sponsor";

export interface EnforcementDeclaration {
  royalty?: "erc2981" | "service-split" | "none";
  escrow?: boolean;
  timeLock?: boolean;
  revocable?: boolean;
}

export interface ServiceEventDeclaration {

  name: string;

  emittedBy: "factory" | "instance";

  poll?: "fast" | "slow";
}

export interface ServiceDefinition {

  id: string;
  displayName: string;
  description: string;
  standard: "ERC721" | "ERC1155" | "ERC20" | "UNKNOWN";
  provenance: "MEDIALANE" | "EXTERNAL";
  onchain?: Partial<Record<import("../chains.js").Chain, {
    factoryAddress?: string;
    classHash?: string;
    startBlock?: number;
  }>>;

  uiVariant: string;
  capabilities: ServiceCapability[];

  events?: ServiceEventDeclaration[];
  metadataSchema?: {
    requiredTraits?: string[];

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

  service?: string;
}

export type OrderStatus = "ACTIVE" | "FULFILLED" | "CANCELLED" | "EXPIRED";
export type SortOrder = "price_asc" | "price_desc" | "recent";
export type ActivityType = "mint" | "transfer" | "sale" | "listing" | "offer" | "cancelled";
export type IntentType = "CREATE_LISTING" | "MAKE_OFFER" | "FULFILL_ORDER" | "CANCEL_ORDER" | "MINT" | "CREATE_COLLECTION" | "COUNTER_OFFER";
export type IntentStatus = "PENDING" | "SIGNED" | "SUBMITTED" | "CONFIRMED" | "FAILED" | "EXPIRED";
export type WebhookEventType = "ORDER_CREATED" | "ORDER_FULFILLED" | "ORDER_CANCELLED" | "TRANSFER";
export type WebhookStatus = "ACTIVE" | "DISABLED";
export type ApiKeyStatus = "ACTIVE" | "REVOKED";
export type TenantPlan = "FREE" | "PREMIUM";

export interface ApiMeta {
  page: number;
  limit: number;
  total?: number;

  counts?: Record<string, number>;
}

export interface ApiResponse<T> {
  data: T;
  meta?: ApiMeta;
}

export type ChainFilter = import("../chains.js").Chain | "all";

export interface ApiOrdersQuery {
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
  animationUrl: string | null;
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

  remainingAmount: string | null;
  createdAt: string;
  updatedAt: string;

  token: ApiOrderTokenMeta | null;

  parentOrderHash?: string | null;

  counterOfferMessage?: string | null;

  hasActiveCounterOffer?: boolean;
}

export interface IpAttribute {
  trait_type: string;
  value: string;
}

export interface IpNftMetadata {
  name: string;
  description?: string;
  image?: string | null;
  external_url?: string;
  attributes?: IpAttribute[];

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

export interface ApiTokenMetadata {
  name: string | null;
  description: string | null;
  image: string | null;

  animationUrl: string | null;

  attributes: IpAttribute[] | null;

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

export interface ApiTokenBalance {
  owner: string;

  amount: string;
}

export interface ApiToken {
  id: string;
  chain: string;
  contractAddress: string;
  tokenId: string;

  owner: string | null;
  tokenUri: string | null;
  metadataStatus: "PENDING" | "FETCHING" | "FETCHED" | "FAILED";

  standard: "ERC721" | "ERC1155" | "UNKNOWN";
  metadata: ApiTokenMetadata;

  balances: ApiTokenBalance[] | null;
  activeOrders: ApiOrder[];
  createdAt: string;
  updatedAt: string;
}

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

  standard: "ERC721" | "ERC1155";
  isKnown: boolean;

  isHidden: boolean;

  isFeatured: boolean;

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

export interface ApiCoin {
  id: string;
  chain: string;
  contractAddress: string;
  standard: "ERC20";

  service: string;
  name: string | null;
  symbol: string | null;
  decimals: number;

  totalSupply: string | null;
  description: string | null;
  image: string | null;
  creator: string | null;

  isLaunched?: boolean | null;
  startBlock: string;
  isHidden: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiCoinPrice {

  usdc: number;
}

export type ApiCoinPrices = Record<string, ApiCoinPrice | null>;

export type ApiCoinClaimResult =
  | { verified: true; coin: ApiCoin | null }
  | { verified: false; reason: "owner_mismatch" | "owner_check_failed" | "not_erc20" | "no_total_supply" };

export interface ApiCoinsQuery {
  chain?: ChainFilter;
  page?: number;
  limit?: number;

  service?: string;
}

export interface ApiActivityPrice {
  raw: string | null;
  formatted: string | null;
  currency: string | null;
}

export interface ApiActivity {
  type: ActivityType;
  chain: import("../chains.js").Chain;

  contractAddress?: string;
  tokenId?: string;
  from?: string;
  to?: string;
  blockNumber?: string;

  amount?: string;

  orderHash?: string;
  nftContract?: string;
  nftTokenId?: string;
  offerer?: string;
  fulfiller?: string | null;
  price?: ApiActivityPrice;

  tokenStandard?: "ERC721" | "ERC1155";
  txHash: string | null;
  timestamp: string;

  token?: { name: string | null; image: string | null; animationUrl: string | null } | null;
}

export interface ApiActivitiesQuery {
  chain?: ChainFilter;
  type?: ActivityType;

  contract?: string;
  page?: number;
  limit?: number;
}

export interface ApiComment {
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

  parentOrderHash?: string | null;

  counterOfferMessage?: string | null;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface IntentCall {
  contractAddress: string;
  entrypoint: string;
  calldata: string[];
}

export type ApiIntentCreated =
  | { id: string; expiresAt: string; requiresSignature: true; typedData: unknown }
  | { id: string; expiresAt: string; requiresSignature: false; calls: IntentCall[] };

export interface CreateListingIntentParams {
  offerer: string;
  nftContract: string;
  tokenId: string;
  currency: string;
  price: string;
  endTime: number;
  salt?: string;

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

  tokenStandard?: string;

  quantity?: string;
}

export interface FulfillOrderIntentParams {
  fulfiller: string;
  orderHash: string;

  tokenStandard?: string;

  quantity?: string;
}

export interface CancelOrderIntentParams {
  offerer: string;
  orderHash: string;

  tokenStandard?: string;
}

export type FactoryFamilyServiceId = "mip-erc1155" | "ip-tickets" | "ip-club";

export type TierServiceId = "ip-tickets" | "ip-club";

export type CollectionServiceId = FactoryFamilyServiceId | "pop-protocol" | "drop-collection";

export interface CreateMintIntentParams {

  owner: string;
  recipient: string;

  collectionId?: string;

  tokenUri?: string;

  royaltyBps?: number;

  tokenId?: string;

  amount?: string;

  value?: string;

  collectionContract?: string;
}

export interface CreateCollectionIntentParams {
  owner: string;
  name: string;
  symbol: string;

  description?: string;

  image?: string;

  baseUri?: string;

  collectionContract?: string;

  service?: CollectionServiceId;

  claimEndTimestamp?: number;

  eventType?: PopEventType;

  maxSupply?: string;

  conditions?: {
    startTime: number;
    endTime: number;
    price: string;
    paymentToken: string;
    maxQuantityPerWallet: string;
  };
}

export interface CheckoutIntentItem {
  orderHash: string;

  quantity?: string;
}

export interface CreateCheckoutIntentParams {
  fulfiller: string;

  items?: CheckoutIntentItem[];

  orderHashes?: string[];
}

export interface ApiCheckoutIntentResult {
  id?: string;
  orderHash: string;
  requiresSignature?: false;
  calls?: unknown;
  expiresAt?: string;

  error?: string;
}

export interface CreateTierIntentParams {
  owner: string;

  collection: string;
  service: TierServiceId;
  maxSupply: string;
  startTime?: number;
  endTime?: number;
  royaltyBps: number;
  metadataUri: string;
}

export interface CreateCoinIntentParams {

  owner: string;
  name: string;
  symbol: string;

  initialSupply: string;

  salt?: string;
}

export interface LaunchCoinIntentParams {

  owner: string;

  creatorCoin: string;

  quoteToken: string;

  price: number;

  initialHolders: string[];
  initialHoldersAmounts: string[];

  transferRestrictionDelay?: number;

  maxPercentageBuyLaunch?: number;

  quoteFundAmount?: string;
}

export interface CreateSponsorshipOfferIntentParams {

  author: string;
  nftContract: string;
  tokenId: string;
  minAmount: string;

  duration: number;
  paymentToken: string;
  licenseTermsUri: string;
  transferable: boolean;

  royaltyBps: number;

  specificSponsor?: string;
}

export interface SetSponsorshipOfferOpenIntentParams {

  author: string;
  offerId: string;
  open: boolean;
}

export interface PlaceSponsorshipBidIntentParams {

  sponsor: string;
  offerId: string;
  amount: string;
  paymentToken: string;
}

export interface RetractSponsorshipBidIntentParams {
  sponsor: string;
  offerId: string;
}

export interface AcceptSponsorshipBidIntentParams {

  author: string;
  offerId: string;

  sponsor: string;
}

export interface CreateSponsorshipProposalIntentParams {

  proposer: string;
  nftContract: string;
  tokenId: string;

  amount: string;
  duration: number;

  validUntil?: number;
  paymentToken: string;
  licenseTermsUri: string;
  transferable: boolean;
  royaltyBps: number;
}

export interface WithdrawSponsorshipProposalIntentParams {
  proposer: string;
  proposalId: string;
}

export interface AcceptSponsorshipProposalIntentParams {

  owner: string;
  proposalId: string;
}

export interface RejectSponsorshipProposalIntentParams {
  owner: string;
  proposalId: string;
}

export interface CreateCounterOfferIntentParams {

  sellerAddress: string;

  originalOrderHash: string;

  priceRaw: string;

  durationSeconds: number;

  message?: string;
}

export interface ApiCounterOffersQuery {

  originalOrderHash?: string;

  sellerAddress?: string;
  page?: number;
  limit?: number;
}

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

  role: "creator" | "requester";
  page?: number;
  limit?: number;
}

export interface ApiMetadataSignedUrl {
  url: string;
}

export interface ApiMetadataUpload {
  cid: string;
  url: string;
}

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

  secret: string;
}

export interface CreateWebhookParams {
  url: string;
  events: WebhookEventType[];
  label?: string;
}

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

export type ApiAppSource =
  | "MEDIALANE_STARKNET"
  | "MEDIALANE_IO"
  | "MEDIALANE_PORTAL"
  | "MEDIALANE_SDK"

  | "MEDIALANE_DAPP";

export type ApiChain = "STARKNET" | "ETHEREUM" | "SOLANA" | "BASE" | "BITCOIN";

export interface ApiUserWallet {
  walletAddress: string;
  email?: string | null;
  emailVerified?: boolean;
  requiresEmailVerification?: boolean;
}

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

export interface ApiBusinessProvisioning {
  id: string;
  accountId: string;
  chain: string;
  walletAddress: string;

  recipientScheme: string;
  recipientValue: string;
  interimOwnerPubkey: string;
  newOwnerPubkey: string | null;
  status: "DEPLOYED" | "HANDOFF" | "TRANSFERRED";
}

export interface ApiWalletActivity {
  id: string;
  chain: string;
  accountAddress: string;
  type: "SEND" | "RECEIVE" | "SWAP" | "DEPLOY" | "GUARDIAN_SET" | "GUARDIAN_TRIGGER_ESCAPE" | "GUARDIAN_COMPLETE_ESCAPE" | "GUARDIAN_CANCEL_ESCAPE";
  txHash: string;
  blockNumber: string;
  timestamp: string;
  tokenAddress: string | null;
  amount: string | null;
  counterparty: string | null;
  tokenInAddress: string | null;
  amountIn: string | null;
  tokenOutAddress: string | null;
  amountOut: string | null;
}

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

export interface DropMintStatus {
  mintedByWallet: number;
  totalMinted: number;
}

export interface ApiRewardsBadge {
  key: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: string;
}

export interface ApiRewardsLevel {
  level: number;
  name: string;
  xpRequired: number;
  badgeColor: string;
  description: string | null;
}

export interface ApiUserRewards {
  address: string;
  accountId: string | null;
  publicId: string | null;
  totalXp: number;
  currentLevel: number;
  currentLevelName: string;
  badgeColor: string;
  nextLevel: { level: number; name: string; xpRequired: number } | null;
  progressPct: number;
  breakdown: Record<string, number>;
  badges: ApiRewardsBadge[];
  computedAt: string | null;
}

export interface ApiRewardsLeaderboardEntry {
  rank: number;
  address: string;
  accountId: string | null;
  publicId: string | null;
  totalXp: number;
  currentLevel: number;
  currentLevelName: string;
  badgeColor: string;
}

export interface ApiRewardsConfig {
  levels: ApiRewardsLevel[];
  actions: { type: string; label: string; xp: number; dailyCap: number | null }[];
  badges: ApiRewardsBadge[];
}

export interface ApiRewardsBatchEntry {
  address: string;
  totalXp: number;
  currentLevel: number;
  currentLevelName: string;
  badgeColor: string;
}

export interface ApiPointEvent {
  id: string;
  actionType: string;
  xp: number;
  multiplier: number;
  finalXp: number;
  txHash: string | null;
  createdAt: string;
}
