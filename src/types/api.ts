import type { z } from "zod";
import type * as intents from "../contract/intents.js";
import type * as issuance from "../contract/issuance.js";
import type * as orders from "../contract/orders.js";
import type * as profiles from "../contract/profiles.js";
import type * as responses from "../contract/responses.js";

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

export type ApiOrdersQuery = z.input<typeof orders.ordersListQuery> & { chain?: ChainFilter };

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

export type ApiOrder = z.output<typeof responses.orderSchema>;

export type IpAttribute = z.output<typeof responses.tokenAttributeSchema>;

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

export type ApiTokenMetadata = ApiToken["metadata"];

export interface ApiTokenBalance {
  owner: string;

  amount: string;
}

export type ApiToken = z.output<typeof responses.tokenSchema>;

export type ApiCollection = z.output<typeof responses.collectionSchema>;

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
  sort?: string;
  creator?: string;
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
  name: string | null;
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

export interface ApiTxSyncResult {
  applied: number;
  contracts?: string[];
  pending: boolean;
}

export type CreateListingIntentParams = z.input<typeof intents.listingSchema>;

export type MakeOfferIntentParams = z.input<typeof intents.offerSchema>;

export type FulfillOrderIntentParams = z.input<typeof intents.fulfillSchema>;

export type CancelOrderIntentParams = z.input<typeof intents.cancelSchema>;

export type FactoryFamilyServiceId = (typeof intents.FACTORY_FAMILY_SERVICE_IDS)[number];

export type TierServiceId = (typeof intents.TIER_SERVICE_IDS)[number];

export type CollectionServiceId = (typeof intents.COLLECTION_SERVICE_IDS)[number];

export type CreateMintIntentParams = z.input<typeof intents.mintSchema>;

/** Drop sale terms on the wire: amounts as decimal strings in the token's smallest unit. */
export interface DropTermsBody {
  /** Unix seconds; 0 = open from creation. */
  startTime: number;
  /** Unix seconds; 0 = never closes. */
  endTime: number;
  /** Per token; "0" = free. */
  price: string;
  paymentToken: string;
  /** "0" = unlimited. */
  maxPerWallet: string;
}

export type ApiDropListStatus = "live" | "upcoming" | "ended";

export interface ApiDrop {
  contractAddress: string;
  dropId: string;
  organizer: string;
  name: string | null;
  symbol: string | null;
  description: string | null;
  image: string | null;
  /** Token URI = baseUri + token id. */
  baseUri: string | null;
  /** "0" = no cap. */
  maxSupply: string;
  minted: string;
  /** Total paid to the organizer, in the payment token's smallest unit. */
  revenue: string;
  collectors: number;
  terms: DropTermsBody;
  /** "0x0" = open to everyone. */
  allowlistRoot: string;
  createdBlock: string;
}

export interface ApiDropFee {
  /** Platform fee added to a mint, in basis points; 0 when none applies. */
  launchpadBps: number;
}

export interface ApiDropMint {
  kind: "claim" | "issue";
  wallet: string;
  quantity: string;
  firstTokenId: string;
  totalPaid: string;
  txHash: string;
  blockNumber: string;
  createdAt: string;
}

export type CreateCollectionIntentParams = z.input<typeof intents.createCollectionSchema>;

export interface CheckoutIntentItem {
  orderHash: string;

  quantity?: string;
}

export type CreateCheckoutIntentParams = z.input<typeof intents.checkoutBodySchema>;

export interface ApiCheckoutIntentResult {
  id?: string;
  orderHash: string;
  requiresSignature?: false;
  calls?: unknown;
  expiresAt?: string;

  error?: string;
}

export type CreateTierIntentParams = z.output<typeof intents.createTierSchema>;

export type EmissionParams = z.input<typeof issuance.emissionSchema>;

export interface ApiEmissionCall {
  contractAddress: string;
  entrypoint: string;
  calldata: string[];
}

export interface ApiEmissionResult {
  service: string;
  recipientCount: number;
  callCount: number;
  batches: ApiEmissionCall[][];
}

export type CreateCoinIntentParams = z.input<typeof intents.createCoinSchema>;

export type LaunchCoinIntentParams = z.output<typeof intents.launchCoinSchema>;

export type CreateSponsorshipOfferIntentParams = z.output<typeof intents.sponsorshipOfferSchema>;

export type SetSponsorshipOfferOpenIntentParams = z.input<typeof intents.sponsorshipOfferOpenSchema>;

export type PlaceSponsorshipBidIntentParams = z.input<typeof intents.sponsorshipBidSchema>;

export type RetractSponsorshipBidIntentParams = z.input<typeof intents.sponsorshipBidRetractSchema>;

export type AcceptSponsorshipBidIntentParams = z.input<typeof intents.sponsorshipBidAcceptSchema>;

export type CreateSponsorshipProposalIntentParams = z.output<typeof intents.sponsorshipProposalSchema>;

export type WithdrawSponsorshipProposalIntentParams = z.input<typeof intents.sponsorshipProposalWithdrawSchema>;

export type AcceptSponsorshipProposalIntentParams = z.input<typeof intents.sponsorshipProposalAcceptSchema>;

export type RejectSponsorshipProposalIntentParams = z.input<typeof intents.sponsorshipProposalRejectSchema>;

export type CreateCounterOfferIntentParams = z.input<typeof intents.counterOfferSchema>;

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
  status?: string;
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
  accountId: string;
  status: string;
  creditBalance: number;
}

export interface ApiPortalKey {
  id: string;
  prefix: string;
  label: string | null;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface ApiPortalKeyCreated {
  id: string;
  prefix: string;
  label: string | null;

  plaintext: string;
}

export interface ApiCreditPayment {
  id: string;
  asset: string;
  amountAtomic: string;
  creditedAmount: number;
  mdlnMultiplier: number;
  txHash: string;
  status: string;
  createdAt: string;
}

export interface ApiFundingMethod {
  id: string;
  [detail: string]: unknown;
}

export type ApiFundingStatus = "PENDING" | "SETTLED" | "FAILED" | "EXPIRED";

export interface ApiFundingIntent {
  id: string;
  method: string;
  status: ApiFundingStatus;
  expiresAt: string;
  payer?: string | null;
}

export interface ApiFundingInstructions {
  chain: string;
  payTo: string;
  asset: string;
  amountAtomic: string;
}

export type ApiFundingSubmit =
  | { status: "SETTLED"; credited?: number }
  | { status: "PENDING"; reason: string };

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

export type UpdateCollectionProfileInput = z.output<typeof profiles.collectionProfileSchema>;

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
  name: string | null;
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

export type ApiChain = "STARKNET" | "ETHEREUM" | "SOLANA" | "BASE" | "BITCOIN";

export interface ApiSession {
  accountId: string;
  publicId: string;
  walletAddress: string | null;
  email: string | null;
  emailDeadline: string | null;
}

export interface ApiUserWallet {
  walletAddress: string;
  email?: string | null;
  emailDeadline?: string | null;
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
  chain: string;
  walletAddress: string;
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

export interface ApiPlatformStats {
  collections: number;
  tokens: number;
  sales: number;
}

export interface ApiTierOnchain {
  maxSupply: string;
  minted: string;
  startTime: number | null;
  endTime: number | null;
  royaltyBps: number;
}

export interface ApiSwapQuoteRequest {
  sellSymbol?: string;
  buySymbol?: string;
  sellTokenAddress?: string;
  buyTokenAddress?: string;
  sellAmountRaw?: string;
  buyAmountRaw?: string;
  takerAddress?: string;
}

export interface ApiSwapQuote {
  quoteId: string;
  sellTokenAddress: string;
  sellAmount: string;
  buyTokenAddress: string;
  buyAmount: string;
}

export interface ApiIpNftTokenData {
  owner: string;
  metadataUri: string;
  originalCreator: string;
  registeredAt: number;
}

export interface ApiTokensQuery {
  page?: number;
  limit?: number;
  sort?: string;
  ipType?: string;
  derivatives?: "allowed";
}

export interface ApiUsernameClaim {
  id: string;
  username: string;
  walletAddress: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminNotes: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export type ApiReportTargetType = "COLLECTION" | "TOKEN" | "CREATOR" | "COMMENT";

export interface ApiSubmitReport {
  targetType: ApiReportTargetType;
  targetContract?: string;
  targetTokenId?: string;
  targetAddress?: string;
  targetId?: string;
  categories: string[];
  description?: string;
}

export interface ApiSponsorshipOffer {
  id: string;
  chain: string;
  contractAddress: string;
  offerId: string;
  author: string;
  nftContract: string;
  tokenId: string;
  minAmount: string;
  duration: number;
  paymentToken: string;
  licenseTermsUri: string;
  transferable: boolean;
  royaltyBps: number;
  specificSponsor: string | null;
  open: boolean;
  createdAtChain: string;
  updatedAt: string;
}

export interface ApiSponsorshipBid {
  id: string;
  chain: string;
  contractAddress: string;
  offerId: string;
  sponsor: string;
  amount: string;
  placedAtChain: string;
  updatedAt: string;
}

export interface ApiSponsorshipProposal {
  id: string;
  chain: string;
  contractAddress: string;
  proposalId: string;
  proposer: string;
  nftContract: string;
  tokenId: string;
  amount: string;
  duration: number;
  validUntil: string | null;
  paymentToken: string;
  licenseTermsUri: string;
  transferable: boolean;
  royaltyBps: number;
  open: boolean;
  accepted: boolean | null;
  createdAtChain: string;
  closedAtChain: string | null;
  updatedAt: string;
}

export interface ApiSponsorshipLicense {
  id: string;
  chain: string;
  contractAddress: string;
  tokenId: string;
  author: string;
  recipient: string;
  assetContract: string;
  assetTokenId: string;
  expiresAt: string;
  transferable: boolean;
  royaltyBps: number;
  licenseTermsUri: string;
  offerId: string | null;
  proposalId: string | null;
  mintedAtChain: string;
  currentHolder?: string | null;
}

export interface ApiSponsorshipOffersQuery {
  limit?: number;
  nftContract?: string;
  author?: string;
  owner?: string;
  open?: boolean;
}

export interface ApiSponsorshipProposalsQuery {
  limit?: number;
  nftContract?: string;
  proposer?: string;
  owner?: string;
  open?: boolean;
}

export interface ApiSponsorshipLicensesQuery {
  limit?: number;
  holder?: string;
  author?: string;
}

export interface ApiCollectionsListQuery {
  page?: number;
  limit?: number;
  owner?: string;
  service?: string;
  sort?: CollectionSort;
  isFeatured?: boolean;
  hideEmpty?: boolean;
  standard?: string;
  chain?: ChainFilter;
}

export interface ApiPricingRule {
  actionKey: string;
  chain: string;
  service: string;
  credits: number;
}

export interface ApiPricing {
  creditsPerUsdc: number;
  mdln?: { contract: string | null; tiers: { minWholeTokens: number; multiplier: number }[] };
  pricing: { default: number; rules: ApiPricingRule[] };
}

export type CreateTransferTokenIntentParams = z.input<typeof intents.transferTokenSchema>;

export type CreateTransferNftIntentParams = z.input<typeof intents.transferNftSchema>;

export type CreateTransferCollectionOwnershipIntentParams = z.input<typeof intents.transferCollectionOwnershipSchema>;

export type CreateCommentIntentParams = z.input<typeof intents.commentSchema>;

export type CreateGenesisMintIntentParams = z.input<typeof intents.genesisMintSchema>;

export type CreatePopClaimIntentParams = z.input<typeof intents.popClaimSchema>;

export type CreatePopBurnIntentParams = z.input<typeof intents.popBurnSchema>;

export type CreateDropClaimIntentParams = z.input<typeof intents.dropClaimSchema>;

export type WalletManageAction = "add_owner" | "remove_owner" | "cancel_escape" | "set_first_guardian" | "trigger_escape" | "complete_escape";

export type CreateWalletManageIntentParams = z.input<typeof intents.walletManageSchema>;

export type CreateSwapIntentParams = z.input<typeof intents.swapIntentSchema>;

export type CreateFundingTransferIntentParams = z.input<typeof intents.fundingTransferSchema>;

export type DropManageAction = "issue" | "set_allowlist_root";

export type CreateDropManageIntentParams = z.input<typeof intents.dropManageSchema>;

export type PopManageAction = "issue" | "set_allowlist_root";

export type CreatePopManageIntentParams = z.input<typeof intents.popManageSchema>;

export interface IntentParamsByKind {
  listing: CreateListingIntentParams;
  offer: MakeOfferIntentParams;
  fulfill: FulfillOrderIntentParams;
  cancel: CancelOrderIntentParams;
  mint: CreateMintIntentParams;
  "transfer-token": CreateTransferTokenIntentParams;
  "transfer-nft": CreateTransferNftIntentParams;
  "transfer-collection-ownership": CreateTransferCollectionOwnershipIntentParams;
  comment: CreateCommentIntentParams;
  "genesis-mint": CreateGenesisMintIntentParams;
  "pop-claim": CreatePopClaimIntentParams;
  "pop-burn": CreatePopBurnIntentParams;
  "drop-claim": CreateDropClaimIntentParams;
  "wallet-manage": CreateWalletManageIntentParams;
  swap: CreateSwapIntentParams;
  "funding-transfer": CreateFundingTransferIntentParams;
  "drop-manage": CreateDropManageIntentParams;
  "pop-manage": CreatePopManageIntentParams;
  "create-collection": CreateCollectionIntentParams;
  "create-tier": CreateTierIntentParams;
  "create-coin": CreateCoinIntentParams;
  "launch-coin": LaunchCoinIntentParams;
  "sponsorship-offer": CreateSponsorshipOfferIntentParams;
  "sponsorship-offer-open": SetSponsorshipOfferOpenIntentParams;
  "sponsorship-bid": PlaceSponsorshipBidIntentParams;
  "sponsorship-bid-retract": RetractSponsorshipBidIntentParams;
  "sponsorship-bid-accept": AcceptSponsorshipBidIntentParams;
  "sponsorship-proposal": CreateSponsorshipProposalIntentParams;
  "sponsorship-proposal-withdraw": WithdrawSponsorshipProposalIntentParams;
  "sponsorship-proposal-accept": AcceptSponsorshipProposalIntentParams;
  "sponsorship-proposal-reject": RejectSponsorshipProposalIntentParams;
  "counter-offer": CreateCounterOfferIntentParams;
}
