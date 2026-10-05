import { normalizeAddress } from "../utils/address.js";
import type { Chain } from "../chains.js";
import type { ChainFilter } from "../types/api.js";
import type { MedialaneErrorCode } from "../types/errors.js";
import { withRetry, type RetryOptions } from "../utils/retry.js";
import type {
  ApiOrder,
  ApiOrdersQuery,
  ApiCounterOffersQuery,
  ApiToken,
  ApiCollection,
  ApiCoin,
  ApiCoinPrices,
  ApiCoinClaimResult,
  ApiUserRewards,
  ApiRewardsLeaderboardEntry,
  ApiRewardsConfig,
  ApiRewardsBatchEntry,
  ApiPointEvent,
  ApiCoinsQuery,
  ApiCollectionProfile,
  UpdateCollectionProfileInput,
  ApiCreatorProfile,
  ApiCreatorListResult,
  ApiCollectionClaim,
  ApiCollectionSlugClaim,
  ApiBusinessProvisioning,
  ApiWalletActivity,
  ApiUserWallet,
  ApiChain,
  ApiActivity,
  ApiActivitiesQuery,
  ApiComment,
  ApiRemixOffer,
  ApiRemixOffersQuery,
  ApiPublicRemix,
  ApiSearchResult,
  ApiIntent,
  ApiIntentCreated,
  ApiTxSyncResult,
  ApiMetadataSignedUrl,
  ApiMetadataUpload,
  ApiPortalMe,
  ApiPortalKey,
  ApiPortalKeyCreated,
  ApiCreditPayment,
  ApiFundingInstructions,
  ApiFundingIntent,
  ApiFundingMethod,
  ApiFundingSubmit,
  ApiPortalSpend,
  CreateListingIntentParams,
  MakeOfferIntentParams,
  FulfillOrderIntentParams,
  CancelOrderIntentParams,
  CreateMintIntentParams,
  CreateCollectionIntentParams,
  CreateTierIntentParams,
  EmissionParams,
  ApiEmissionResult,
  CreateCoinIntentParams,
  LaunchCoinIntentParams,
  CreateSponsorshipOfferIntentParams,
  SetSponsorshipOfferOpenIntentParams,
  PlaceSponsorshipBidIntentParams,
  RetractSponsorshipBidIntentParams,
  AcceptSponsorshipBidIntentParams,
  CreateSponsorshipProposalIntentParams,
  WithdrawSponsorshipProposalIntentParams,
  AcceptSponsorshipProposalIntentParams,
  RejectSponsorshipProposalIntentParams,
  CreateCheckoutIntentParams,
  ApiCheckoutIntentResult,
  CreateCounterOfferIntentParams,
  CreateRemixOfferParams,
  AutoRemixOfferParams,
  ConfirmSelfRemixParams,
  ConfirmRemixOfferParams,
  ApiResponse,
  CollectionTokensSort,
  PopClaimStatus,
  PopBatchEligibilityItem,
  DropMintStatus,
  ApiPlatformStats,
  ApiDropInfo,
  ApiDropState,
  ApiTierOnchain,
  ApiIpNftTokenData,
  ApiTokensQuery,
  ApiUsernameClaim,
  ApiSubmitReport,
  ApiSponsorshipOffer,
  ApiSponsorshipBid,
  ApiSponsorshipProposal,
  ApiSponsorshipLicense,
  ApiSponsorshipOffersQuery,
  ApiSponsorshipProposalsQuery,
  ApiSponsorshipLicensesQuery,
  ApiCollectionsListQuery,
  ApiPricing,
} from "../types/api.js";

function deriveErrorCode(status: number): MedialaneErrorCode {
  if (status === 404) return "TOKEN_NOT_FOUND";
  if (status === 429) return "RATE_LIMITED";
  if (status === 410) return "INTENT_EXPIRED";
  if (status === 401 || status === 403) return "UNAUTHORIZED";
  if (status === 400) return "INVALID_PARAMS";
  return "UNKNOWN";
}

export class MedialaneApiError extends Error {
  readonly code: MedialaneErrorCode;
  constructor(
    public readonly status: number,
    message: string,

    public readonly retryAfterMs?: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "MedialaneApiError";
    this.code = deriveErrorCode(status);
  }
}

export function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const date = Date.parse(value);
  if (!Number.isNaN(date)) return Math.max(0, date - Date.now());
  return undefined;
}

export class ApiClient {
  private readonly baseHeaders: Record<string, string>;
  private readonly retryOptions: RetryOptions | undefined;

  constructor(
    private readonly baseUrl: string,
    apiKey?: string,
    retryOptions?: RetryOptions,
    private readonly chain: Chain = "STARKNET"
  ) {
    this.baseHeaders = apiKey ? { "x-api-key": apiKey } : {};
    this.retryOptions = retryOptions;
  }

  private addr(a: string): string {
    return normalizeAddress(this.chain, a);
  }

  private async request<T>(
    path: string,
    init?: RequestInit,
    opts?: { allow404?: boolean; allow403?: boolean },
  ): Promise<T> {
    const url = `${this.baseUrl.replace(/\/$/, "")}${path}`;
    const headers: Record<string, string> = { ...this.baseHeaders };
    if (!(init?.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }
    const allowed = (status: number): boolean =>
      (opts?.allow404 === true && status === 404) || (opts?.allow403 === true && status === 403);

    const res = await withRetry(async () => {
      const response = await fetch(url, {
        ...init,
        headers: { ...headers, ...(init?.headers as Record<string, string> | undefined) },
      });
      if (!response.ok && !allowed(response.status)) {
        const text = await response.text().catch(() => response.statusText);
        let message = `Request failed with status ${response.status}`;
        let details: unknown = text;
        try {
          const body = JSON.parse(text) as { error?: string };
          if (typeof body.error === "string" && body.error.trim() !== "") {
            message = body.error;
          }
          details = body;
        } catch {

        }
        throw new MedialaneApiError(
          response.status,
          message,
          parseRetryAfter(response.headers.get("retry-after")),
          details,
        );
      }
      return response;
    }, this.retryOptions, (init?.method ?? "GET").toUpperCase());

    if (allowed(res.status)) return null as T;
    return res.json() as Promise<T>;
  }

  private get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: "GET" });
  }

  private post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, { method: "POST", body: JSON.stringify(body) });
  }

  private patch<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, { method: "PATCH", body: JSON.stringify(body) });
  }

  private bearer(siwsToken: string): Record<string, string> {
    return { Authorization: `Bearer ${siwsToken}` };
  }

  private asSubject(siwsToken?: string): Record<string, string> | undefined {
    return siwsToken ? this.bearer(siwsToken) : undefined;
  }

  getOrders(query: ApiOrdersQuery = {}): Promise<ApiResponse<ApiOrder[]>> {
    const params = new URLSearchParams();
    if (query.status) params.set("status", query.status);
    if (query.collection) params.set("collection", query.collection);
    if (query.currency) params.set("currency", query.currency);
    if (query.sort) params.set("sort", query.sort);
    if (query.page !== undefined) params.set("page", String(query.page));
    if (query.limit !== undefined) params.set("limit", String(query.limit));
    if (query.offerer) params.set("offerer", this.addr(query.offerer));
    if (query.minPrice) params.set("minPrice", query.minPrice);
    if (query.maxPrice) params.set("maxPrice", query.maxPrice);
    if (query.chain) params.set("chain", query.chain);
    const qs = params.toString();
    return this.get<ApiResponse<ApiOrder[]>>(`/v1/orders${qs ? `?${qs}` : ""}`);
  }

  getOrder(orderHash: string): Promise<ApiResponse<ApiOrder>> {
    return this.get<ApiResponse<ApiOrder>>(`/v1/orders/${orderHash}`);
  }

  getActiveOrdersForToken(contract: string, tokenId: string): Promise<ApiResponse<ApiOrder[]>> {
    return this.get<ApiResponse<ApiOrder[]>>(`/v1/orders/token/${this.addr(contract)}/${tokenId}`);
  }

  getReceivedOffers(address: string, opts: { page?: number; limit?: number } = {}): Promise<ApiResponse<ApiOrder[]>> {
    const params = new URLSearchParams({ page: String(opts.page ?? 1), limit: String(opts.limit ?? 50) });
    return this.get<ApiResponse<ApiOrder[]>>(`/v1/orders/received/${this.addr(address)}?${params}`);
  }

  getOrdersByUser(address: string, page = 1, limit = 20): Promise<ApiResponse<ApiOrder[]>> {
    return this.get<ApiResponse<ApiOrder[]>>(
      `/v1/orders/user/${this.addr(address)}?page=${page}&limit=${limit}`
    );
  }

  getToken(contract: string, tokenId: string, wait = false): Promise<ApiResponse<ApiToken>> {
    return this.get<ApiResponse<ApiToken>>(
      `/v1/tokens/${contract}/${tokenId}${wait ? "?wait=true" : ""}`
    );
  }

  getTokensByOwner(address: string, page = 1, limit = 20): Promise<ApiResponse<ApiToken[]>> {
    return this.get<ApiResponse<ApiToken[]>>(
      `/v1/tokens/owned/${this.addr(address)}?page=${page}&limit=${limit}`
    );
  }

  getTokenHistory(
    contract: string,
    tokenId: string,
    page = 1,
    limit = 20
  ): Promise<ApiResponse<ApiActivity[]>> {
    return this.get<ApiResponse<ApiActivity[]>>(
      `/v1/tokens/${contract}/${tokenId}/history?page=${page}&limit=${limit}`
    );
  }

  getCollection(contract: string): Promise<ApiResponse<ApiCollection>> {
    return this.get<ApiResponse<ApiCollection>>(`/v1/collections/${this.addr(contract)}`);
  }

  getCollectionTokens(
    contract: string,
    page = 1,
    limit = 20,
    sort: CollectionTokensSort = "recent"
  ): Promise<ApiResponse<ApiToken[]>> {
    return this.get<ApiResponse<ApiToken[]>>(
      `/v1/collections/${this.addr(contract)}/tokens?page=${page}&limit=${limit}&sort=${sort}`
    );
  }

  getActivities(query: ApiActivitiesQuery = {}): Promise<ApiResponse<ApiActivity[]>> {
    const params = new URLSearchParams();
    if (query.type) params.set("type", query.type);
    if (query.contract) params.set("contract", query.contract);
    if (query.page !== undefined) params.set("page", String(query.page));
    if (query.limit !== undefined) params.set("limit", String(query.limit));
    if (query.chain) params.set("chain", query.chain);
    const qs = params.toString();
    return this.get<ApiResponse<ApiActivity[]>>(`/v1/activities${qs ? `?${qs}` : ""}`);
  }

  getActivitiesByAddress(
    address: string,
    page = 1,
    limit = 20
  ): Promise<ApiResponse<ApiActivity[]>> {
    return this.get<ApiResponse<ApiActivity[]>>(
      `/v1/activities/${this.addr(address)}?page=${page}&limit=${limit}`
    );
  }

  getTokenComments(
    contract: string,
    tokenId: string,
    opts: { page?: number; limit?: number } = {}
  ): Promise<ApiResponse<ApiComment[]>> {
    const params = new URLSearchParams();
    if (opts.page !== undefined) params.set("page", String(opts.page));
    if (opts.limit !== undefined) params.set("limit", String(opts.limit));
    const qs = params.toString();
    return this.get<ApiResponse<ApiComment[]>>(
      `/v1/tokens/${this.addr(contract)}/${tokenId}/comments${qs ? `?${qs}` : ""}`
    );
  }

  search(q: string, limit = 10, chain?: ChainFilter): Promise<ApiResponse<ApiSearchResult> & { query: string }> {
    const params = new URLSearchParams({ q, limit: String(limit) });
    if (chain) params.set("chain", chain);
    return this.get<ApiResponse<ApiSearchResult> & { query: string }>(
      `/v1/search?${params.toString()}`
    );
  }

  createListingIntent(
    params: CreateListingIntentParams
  ): Promise<ApiResponse<ApiIntentCreated>> {
    return this.post<ApiResponse<ApiIntentCreated>>("/v1/intents/listing", params);
  }

  createOfferIntent(
    params: MakeOfferIntentParams
  ): Promise<ApiResponse<ApiIntentCreated>> {
    return this.post<ApiResponse<ApiIntentCreated>>("/v1/intents/offer", params);
  }

  createFulfillIntent(
    params: FulfillOrderIntentParams
  ): Promise<ApiResponse<ApiIntentCreated>> {
    return this.post<ApiResponse<ApiIntentCreated>>("/v1/intents/fulfill", params);
  }

  createCancelIntent(
    params: CancelOrderIntentParams
  ): Promise<ApiResponse<ApiIntentCreated>> {
    return this.post<ApiResponse<ApiIntentCreated>>("/v1/intents/cancel", params);
  }

  createCheckoutIntent(
    params: CreateCheckoutIntentParams
  ): Promise<{ data: ApiCheckoutIntentResult[] }> {
    return this.post<{ data: ApiCheckoutIntentResult[] }>("/v1/intents/checkout", params);
  }

  getIntent(id: string): Promise<ApiResponse<ApiIntent>> {
    return this.get<ApiResponse<ApiIntent>>(`/v1/intents/${id}`);
  }

  submitIntentSignature(id: string, signature: string[]): Promise<ApiResponse<ApiIntent>> {
    return this.patch<ApiResponse<ApiIntent>>(`/v1/intents/${id}/signature`, { signature });
  }

  confirmIntent(id: string, txHash: string): Promise<ApiResponse<ApiIntent>> {
    return this.patch<ApiResponse<ApiIntent>>(`/v1/intents/${id}/confirm`, { txHash });
  }

  syncTransaction(txHash: string): Promise<ApiResponse<ApiTxSyncResult>> {
    return this.post<ApiResponse<ApiTxSyncResult>>("/v1/tx/sync", { txHash });
  }

  createMintIntent(params: CreateMintIntentParams): Promise<ApiResponse<ApiIntentCreated>> {
    return this.post<ApiResponse<ApiIntentCreated>>("/v1/intents/mint", params);
  }

  createCollectionIntent(params: CreateCollectionIntentParams): Promise<ApiResponse<ApiIntentCreated>> {
    return this.post<ApiResponse<ApiIntentCreated>>("/v1/intents/create-collection", params);
  }

  createTierIntent(params: CreateTierIntentParams): Promise<ApiResponse<ApiIntentCreated>> {
    return this.post<ApiResponse<ApiIntentCreated>>("/v1/intents/create-tier", params);
  }

  emitToRecipients(params: EmissionParams): Promise<ApiResponse<ApiEmissionResult>> {
    return this.post<ApiResponse<ApiEmissionResult>>("/v1/business/issuance/emission", params);
  }

  createCoinIntent(params: CreateCoinIntentParams): Promise<ApiResponse<ApiIntentCreated>> {
    return this.post<ApiResponse<ApiIntentCreated>>("/v1/intents/create-coin", params);
  }

  launchCoinIntent(params: LaunchCoinIntentParams): Promise<ApiResponse<ApiIntentCreated>> {
    return this.post<ApiResponse<ApiIntentCreated>>("/v1/intents/launch-coin", params);
  }

  createSponsorshipOfferIntent(params: CreateSponsorshipOfferIntentParams): Promise<ApiResponse<ApiIntentCreated>> {
    return this.post<ApiResponse<ApiIntentCreated>>("/v1/intents/sponsorship-offer", params);
  }

  setSponsorshipOfferOpenIntent(params: SetSponsorshipOfferOpenIntentParams): Promise<ApiResponse<ApiIntentCreated>> {
    return this.post<ApiResponse<ApiIntentCreated>>("/v1/intents/sponsorship-offer-open", params);
  }

  placeSponsorshipBidIntent(params: PlaceSponsorshipBidIntentParams): Promise<ApiResponse<ApiIntentCreated>> {
    return this.post<ApiResponse<ApiIntentCreated>>("/v1/intents/sponsorship-bid", params);
  }

  retractSponsorshipBidIntent(params: RetractSponsorshipBidIntentParams): Promise<ApiResponse<ApiIntentCreated>> {
    return this.post<ApiResponse<ApiIntentCreated>>("/v1/intents/sponsorship-bid-retract", params);
  }

  acceptSponsorshipBidIntent(params: AcceptSponsorshipBidIntentParams): Promise<ApiResponse<ApiIntentCreated>> {
    return this.post<ApiResponse<ApiIntentCreated>>("/v1/intents/sponsorship-bid-accept", params);
  }

  createSponsorshipProposalIntent(params: CreateSponsorshipProposalIntentParams): Promise<ApiResponse<ApiIntentCreated>> {
    return this.post<ApiResponse<ApiIntentCreated>>("/v1/intents/sponsorship-proposal", params);
  }

  withdrawSponsorshipProposalIntent(params: WithdrawSponsorshipProposalIntentParams): Promise<ApiResponse<ApiIntentCreated>> {
    return this.post<ApiResponse<ApiIntentCreated>>("/v1/intents/sponsorship-proposal-withdraw", params);
  }

  acceptSponsorshipProposalIntent(params: AcceptSponsorshipProposalIntentParams): Promise<ApiResponse<ApiIntentCreated>> {
    return this.post<ApiResponse<ApiIntentCreated>>("/v1/intents/sponsorship-proposal-accept", params);
  }

  rejectSponsorshipProposalIntent(params: RejectSponsorshipProposalIntentParams): Promise<ApiResponse<ApiIntentCreated>> {
    return this.post<ApiResponse<ApiIntentCreated>>("/v1/intents/sponsorship-proposal-reject", params);
  }

  createCounterOfferIntent(
    params: CreateCounterOfferIntentParams,
    siwsToken?: string
  ): Promise<ApiResponse<ApiIntentCreated>> {
    const extraHeaders: Record<string, string> = siwsToken ? { "Authorization": `Bearer ${siwsToken}` } : {};
    return this.request<ApiResponse<ApiIntentCreated>>("/v1/intents/counter-offer", {
      method: "POST",
      body: JSON.stringify(params),
      headers: extraHeaders,
    });
  }

  getCounterOffers(query: ApiCounterOffersQuery): Promise<ApiResponse<ApiOrder[]>> {
    const params = new URLSearchParams();
    if (query.originalOrderHash) params.set("originalOrderHash", query.originalOrderHash);
    if (query.sellerAddress) params.set("sellerAddress", query.sellerAddress);
    if (query.page !== undefined) params.set("page", String(query.page));
    if (query.limit !== undefined) params.set("limit", String(query.limit));
    return this.get<ApiResponse<ApiOrder[]>>(`/v1/orders/counter-offers?${params}`);
  }

  getMetadataSignedUrl(kind?: "image" | "document" | "media"): Promise<ApiResponse<ApiMetadataSignedUrl>> {
    const params = kind ? `?kind=${kind}` : "";
    return this.get<ApiResponse<ApiMetadataSignedUrl>>(`/v1/metadata/signed-url${params}`);
  }

  uploadMetadata(metadata: Record<string, unknown>): Promise<ApiResponse<ApiMetadataUpload>> {
    return this.post<ApiResponse<ApiMetadataUpload>>("/v1/metadata/upload", metadata);
  }

  async uploadMetadataDirectory(files: { name: string; content: unknown }[]): Promise<{ cid: string; baseUri: string }> {
    const res = await this.post<{ data: { cid: string; baseUri: string } }>("/v1/metadata/upload-directory", { files });
    return res.data;
  }

  resolveMetadata(uri: string): Promise<ApiResponse<unknown>> {
    const params = new URLSearchParams({ uri });
    return this.get<ApiResponse<unknown>>(`/v1/metadata/resolve?${params.toString()}`);
  }

  uploadFile(file: File): Promise<ApiResponse<ApiMetadataUpload>> {
    const formData = new FormData();
    formData.append("file", file);

    return this.request<ApiResponse<ApiMetadataUpload>>("/v1/metadata/upload-file", {
      method: "POST",
      body: formData,
    });
  }

  getMe(siwsToken?: string): Promise<ApiResponse<ApiPortalMe>> {
    return this.request<ApiResponse<ApiPortalMe>>("/v1/portal/me", {
      method: "GET",
      headers: this.asSubject(siwsToken),
    });
  }

  getApiKeys(siwsToken?: string): Promise<ApiResponse<ApiPortalKey[]>> {
    return this.request<ApiResponse<ApiPortalKey[]>>("/v1/portal/keys", {
      method: "GET",
      headers: this.asSubject(siwsToken),
    });
  }

  createApiKey(
    input?: { label?: string },
    siwsToken?: string,
  ): Promise<ApiResponse<ApiPortalKeyCreated>> {
    return this.request<ApiResponse<ApiPortalKeyCreated>>("/v1/portal/keys", {
      method: "POST",
      body: JSON.stringify(input ?? {}),
      headers: this.asSubject(siwsToken),
    });
  }

  deleteApiKey(id: string, siwsToken?: string): Promise<ApiResponse<{ id: string }>> {
    return this.request<ApiResponse<{ id: string }>>(`/v1/portal/keys/${id}`, {
      method: "DELETE",
      headers: this.asSubject(siwsToken),
    });
  }

  getCreditHistory(siwsToken?: string): Promise<ApiResponse<ApiCreditPayment[]>> {
    return this.request<ApiResponse<ApiCreditPayment[]>>("/v1/portal/credits/history", {
      method: "GET",
      headers: this.asSubject(siwsToken),
    });
  }

  getSpend(siwsToken?: string): Promise<ApiResponse<ApiPortalSpend>> {
    return this.request<ApiResponse<ApiPortalSpend>>("/v1/portal/credits/spend", {
      method: "GET",
      headers: this.asSubject(siwsToken),
    });
  }

  checkDeposit(txHash: string, siwsToken?: string): Promise<ApiResponse<{ deposits: number }>> {
    return this.request<ApiResponse<{ deposits: number }>>("/v1/portal/credits/check", {
      method: "POST",
      body: JSON.stringify({ txHash }),
      headers: this.asSubject(siwsToken),
    });
  }

  getFundingMethods(siwsToken?: string): Promise<ApiResponse<ApiFundingMethod[]>> {
    return this.request<ApiResponse<ApiFundingMethod[]>>("/v1/portal/funding/methods", {
      method: "GET",
      headers: this.asSubject(siwsToken),
    });
  }

  createFunding(
    input: { method: string; params: Record<string, unknown> },
    siwsToken?: string,
  ): Promise<ApiResponse<ApiFundingIntent>> {
    return this.request<ApiResponse<ApiFundingIntent>>("/v1/portal/funding", {
      method: "POST",
      body: JSON.stringify({ method: input.method, params: input.params }),
      headers: this.asSubject(siwsToken),
    });
  }

  getFunding(id: string, siwsToken?: string): Promise<ApiResponse<ApiFundingIntent>> {
    return this.request<ApiResponse<ApiFundingIntent>>(`/v1/portal/funding/${encodeURIComponent(id)}`, {
      method: "GET",
      headers: this.asSubject(siwsToken),
    });
  }

  getFundingChallenge(id: string, payer: string, siwsToken?: string): Promise<ApiResponse<{ typedData: unknown }>> {
    return this.request<ApiResponse<{ typedData: unknown }>>(`/v1/portal/funding/${encodeURIComponent(id)}/challenge`, {
      method: "POST",
      body: JSON.stringify({ payer }),
      headers: this.asSubject(siwsToken),
    });
  }

  authorizeFunding(
    id: string,
    input: { payer: string; signature: string[] },
    siwsToken?: string,
  ): Promise<ApiResponse<{ instructions: ApiFundingInstructions }>> {
    return this.request<ApiResponse<{ instructions: ApiFundingInstructions }>>(
      `/v1/portal/funding/${encodeURIComponent(id)}/authorize`,
      { method: "POST", body: JSON.stringify({ payer: input.payer, signature: input.signature }), headers: this.asSubject(siwsToken) },
    );
  }

  submitFunding(id: string, txHash: string, siwsToken?: string): Promise<ApiResponse<ApiFundingSubmit>> {
    return this.request<ApiResponse<ApiFundingSubmit>>(`/v1/portal/funding/${encodeURIComponent(id)}/submit`, {
      method: "POST",
      body: JSON.stringify({ txHash }),
      headers: this.asSubject(siwsToken),
    });
  }

  cancelFunding(id: string, siwsToken?: string): Promise<ApiResponse<{ status: string }>> {
    return this.request<ApiResponse<{ status: string }>>(`/v1/portal/funding/${encodeURIComponent(id)}/cancel`, {
      method: "POST",
      body: JSON.stringify({}),
      headers: this.asSubject(siwsToken),
    });
  }

  async claimCollection(
    contractAddress: string,
    walletAddress: string,
    siwsToken: string
  ): Promise<{ verified: boolean; collection?: ApiCollection; reason?: string }> {
    return this.request("/v1/collections/claim", {
      method: "POST",
      body: JSON.stringify({ contractAddress, walletAddress }),
      headers: this.bearer(siwsToken),
    });
  }

  requestCollectionClaim(params: {
    contractAddress: string;
    walletAddress?: string;
    email: string;
    notes?: string;
  }): Promise<{ claim: ApiCollectionClaim }> {
    return this.request("/v1/collections/claim/request", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  registerBusinessProvisioning(params: {
    chain?: "STARKNET";
    email: string;
  }): Promise<ApiResponse<ApiBusinessProvisioning> & { reusedExistingWallet?: boolean }> {
    return this.post<ApiResponse<ApiBusinessProvisioning> & { reusedExistingWallet?: boolean }>(
      "/v1/business/provisioning",
      { chain: params.chain ?? "STARKNET", email: params.email },
    );
  }

  getCollectionProfile(contractAddress: string): Promise<ApiCollectionProfile | null> {
    return this.request<ApiCollectionProfile | null>(
      `/v1/collections/${this.addr(contractAddress)}/profile`,
      { method: "GET" },
      { allow404: true },
    );
  }

  updateCollectionProfile(
    contractAddress: string,
    data: UpdateCollectionProfileInput,
    siwsToken: string
  ): Promise<ApiCollectionProfile> {
    return this.request<ApiCollectionProfile>(
      `/v1/collections/${this.addr(contractAddress)}/profile`,
      { method: "PATCH", body: JSON.stringify(data), headers: this.bearer(siwsToken) },
    );
  }

  getWalletActivity(
    address: string,
    chain: "STARKNET" = "STARKNET",
  ): Promise<ApiResponse<ApiWalletActivity[]>> {
    return this.get<ApiResponse<ApiWalletActivity[]>>(
      `/v1/wallet-activity?address=${this.addr(address)}&chain=${chain}`,
    );
  }

  getGatedContent(
    contractAddress: string,
    siwsToken: string
  ): Promise<{ title: string; url: string; type: string } | null> {
    return this.request<{ title: string; url: string; type: string } | null>(
      `/v1/collections/${this.addr(contractAddress)}/gated-content`,
      { method: "GET", headers: this.bearer(siwsToken) },
      { allow404: true, allow403: true },
    );
  }

  getCreators(opts: { search?: string; page?: number; limit?: number } = {}): Promise<ApiCreatorListResult> {
    const params = new URLSearchParams();
    if (opts.search) params.set("search", opts.search);
    if (opts.page)  params.set("page",  String(opts.page));
    if (opts.limit) params.set("limit", String(opts.limit));
    const qs = params.toString();
    return this.get<ApiCreatorListResult>(`/v1/creators${qs ? `?${qs}` : ""}`);
  }

  getCreatorProfile(walletAddress: string): Promise<ApiCreatorProfile | null> {
    return this.request<ApiCreatorProfile | null>(
      `/v1/creators/${this.addr(walletAddress)}/profile`,
      { method: "GET" },
      { allow404: true },
    );
  }

  getCreatorByUsername(username: string): Promise<ApiCreatorProfile | null> {
    return this.request<ApiCreatorProfile | null>(
      `/v1/creators/by-username/${encodeURIComponent(username.toLowerCase().trim())}`,
      { method: "GET" },
      { allow404: true },
    );
  }

  updateCreatorProfile(
    walletAddress: string,
    data: Partial<Omit<ApiCreatorProfile, "walletAddress" | "chain" | "updatedAt">>,
    siwsToken: string
  ): Promise<ApiCreatorProfile> {
    return this.request<ApiCreatorProfile>(
      `/v1/creators/${this.addr(walletAddress)}/profile`,
      { method: "PATCH", body: JSON.stringify(data), headers: this.bearer(siwsToken) },
    );
  }

  checkCollectionSlugAvailability(slug: string): Promise<{ available: boolean; reason?: string }> {
    return this.get<{ available: boolean; reason?: string }>(
      `/v1/collection-slug-claims/check/${encodeURIComponent(slug.toLowerCase().trim())}`,
    );
  }

  submitCollectionSlugClaim(
    contractAddress: string,
    slug: string,
    siwsToken: string,
    notifyEmail?: string
  ): Promise<{ claim: ApiCollectionSlugClaim }> {
    return this.request<{ claim: ApiCollectionSlugClaim }>("/v1/collection-slug-claims", {
      method: "POST",
      body: JSON.stringify({ contractAddress, slug, notifyEmail }),
      headers: this.bearer(siwsToken),
    });
  }

  getMyCollectionSlugClaims(siwsToken: string): Promise<{ claims: ApiCollectionSlugClaim[] }> {
    return this.request<{ claims: ApiCollectionSlugClaim[] }>("/v1/collection-slug-claims/me", {
      method: "GET",
      headers: this.bearer(siwsToken),
    });
  }

  async getCollectionBySlug(slug: string): Promise<ApiCollection | null> {
    const res = await this.request<{ data: ApiCollection } | null>(
      `/v1/collections/by-slug/${encodeURIComponent(slug.toLowerCase().trim())}`,
      { method: "GET" },
      { allow404: true },
    );
    return res?.data ?? null;
  }

  async registerUser(params: {
    walletAddress: string;

    walletType?: string;
    chain?: ApiChain;
  }): Promise<{
    accountId: string;
    publicId: string;
    walletAddress: string;
    chain: string;

    provider: string;
    createdAt: string;
  }> {
    return this.post("/v1/users/register", params);
  }

  async upsertMyWallet(
    siwsToken: string,
    options: {

      walletType?: string;

      chain?: ApiChain;


      email?: string;

      accountToken?: string;
    } = {},
  ): Promise<ApiUserWallet> {
    const body: Record<string, string> = {
      walletType: options.walletType ?? "UNKNOWN",
    };
    if (options.chain) body.chain = options.chain;
    if (options.email) body.email = options.email;
    if (options.accountToken) body.accountToken = options.accountToken;
    return this.request<ApiUserWallet>("/v1/users/me", {
      method: "POST",
      body: JSON.stringify(body),
      headers: this.bearer(siwsToken),
    });
  }

  async checkEmail(email: string): Promise<{ exists: boolean }> {
    const body = await this.get<{ exists: boolean }>(`/v1/auth/email/exists?email=${encodeURIComponent(email)}`);
    return { exists: body.exists };
  }

  async requestEmailCode(email: string): Promise<void> {
    await this.post<unknown>("/v1/auth/email/request-code", { email });
  }

  async registerEmailAccount(email: string): Promise<void> {
    await this.post<unknown>("/v1/auth/email/register-account", { email });
  }

  async verifyEmailCode(email: string, code: string): Promise<void> {
    await this.post<unknown>("/v1/auth/email/verify-code", { email, code });
  }

  async confirmEmail(token: string): Promise<{ email: string }> {
    const body = await this.post<{ ok: boolean; email: string }>("/v1/auth/email/confirm", { token });
    return { email: body.email };
  }

  setupWalletKey(params: { newOwnerPubkey: string }): Promise<{ walletAddress: string; removeOwnerGuid: string | null }> {
    return this.post<{ walletAddress: string; removeOwnerGuid: string | null }>("/v1/users/me/wallet/key", params);
  }

  async getSessionWallet(): Promise<{ walletAddress: string; needsKeySetup: boolean } | null> {
    const body = await this.post<{ walletAddress?: string | null; needsKeySetup?: boolean }>("/v1/users/me/wallet", {});
    return body.walletAddress ? { walletAddress: body.walletAddress, needsKeySetup: body.needsKeySetup === true } : null;
  }

  getMyWallet(siwsToken: string): Promise<ApiUserWallet | null> {
    return this.request<ApiUserWallet | null>(
      "/v1/users/me",
      { method: "GET", headers: this.bearer(siwsToken) },
      { allow404: true },
    );
  }

  changeMyEmail(email: string, siwsToken: string): Promise<{ email: string; emailVerified: boolean }> {
    return this.request<{ email: string; emailVerified: boolean }>("/v1/users/me/email", {
      method: "POST",
      headers: this.bearer(siwsToken),
      body: JSON.stringify({ email }),
    });
  }

  getTokenRemixes(
    contract: string,
    tokenId: string,
    opts: { page?: number; limit?: number } = {}
  ): Promise<ApiResponse<ApiPublicRemix[]>> {
    const params = new URLSearchParams();
    if (opts.page !== undefined) params.set("page", String(opts.page));
    if (opts.limit !== undefined) params.set("limit", String(opts.limit));
    const qs = params.toString();
    return this.get<ApiResponse<ApiPublicRemix[]>>(
      `/v1/tokens/${this.addr(contract)}/${tokenId}/remixes${qs ? `?${qs}` : ""}`
    );
  }

  submitRemixOffer(
    params: CreateRemixOfferParams,
    siwsToken: string
  ): Promise<ApiResponse<ApiRemixOffer>> {
    return this.request<ApiResponse<ApiRemixOffer>>("/v1/remix-offers", {
      method: "POST",
      body: JSON.stringify(params),
      headers: { "Authorization": `Bearer ${siwsToken}` },
    });
  }

  submitAutoRemixOffer(
    params: AutoRemixOfferParams,
    siwsToken: string
  ): Promise<ApiResponse<ApiRemixOffer>> {
    return this.request<ApiResponse<ApiRemixOffer>>("/v1/remix-offers/auto", {
      method: "POST",
      body: JSON.stringify(params),
      headers: { "Authorization": `Bearer ${siwsToken}` },
    });
  }

  confirmSelfRemix(
    params: ConfirmSelfRemixParams,
    siwsToken: string
  ): Promise<ApiResponse<ApiRemixOffer>> {
    return this.request<ApiResponse<ApiRemixOffer>>("/v1/remix-offers/self/confirm", {
      method: "POST",
      body: JSON.stringify(params),
      headers: { "Authorization": `Bearer ${siwsToken}` },
    });
  }

  getRemixOffers(
    query: ApiRemixOffersQuery,
    siwsToken: string
  ): Promise<ApiResponse<ApiRemixOffer[]>> {
    const params = new URLSearchParams({ role: query.role });
    if (query.status) params.set("status", query.status);
    if (query.page !== undefined) params.set("page", String(query.page));
    if (query.limit !== undefined) params.set("limit", String(query.limit));
    return this.request<ApiResponse<ApiRemixOffer[]>>(`/v1/remix-offers?${params}`, {
      method: "GET",
      headers: this.bearer(siwsToken),
    });
  }

  getRemixOffer(id: string, siwsToken?: string): Promise<ApiResponse<ApiRemixOffer>> {
    return this.request<ApiResponse<ApiRemixOffer>>(`/v1/remix-offers/${id}`, {
      method: "GET",
      headers: siwsToken ? this.bearer(siwsToken) : undefined,
    });
  }

  confirmRemixOffer(
    id: string,
    params: ConfirmRemixOfferParams,
    siwsToken: string
  ): Promise<ApiResponse<ApiRemixOffer>> {
    return this.request<ApiResponse<ApiRemixOffer>>(`/v1/remix-offers/${id}/confirm`, {
      method: "POST",
      body: JSON.stringify(params),
      headers: { "Authorization": `Bearer ${siwsToken}` },
    });
  }

  rejectRemixOffer(id: string, siwsToken: string): Promise<ApiResponse<ApiRemixOffer>> {
    return this.request<ApiResponse<ApiRemixOffer>>(`/v1/remix-offers/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Authorization": `Bearer ${siwsToken}` },
    });
  }

  extendRemixOffer(id: string, days: number, siwsToken: string): Promise<ApiResponse<ApiRemixOffer>> {
    return this.request<ApiResponse<ApiRemixOffer>>(`/v1/remix-offers/${id}/extend`, {
      method: "POST",
      body: JSON.stringify({ days }),
      headers: { "Authorization": `Bearer ${siwsToken}` },
    });
  }

  async getPopEligibility(collection: string, wallet: string): Promise<PopClaimStatus> {
    const res = await this.get<{ data: PopClaimStatus }>(
      `/v1/pop/eligibility/${this.addr(collection)}/${this.addr(wallet)}`
    );
    return res.data;
  }

  async getPopEligibilityBatch(collection: string, wallets: string[]): Promise<PopBatchEligibilityItem[]> {
    const params = new URLSearchParams({ wallets: wallets.map((w) => this.addr(w)).join(",") });
    const res = await this.get<{ data: PopBatchEligibilityItem[] }>(
      `/v1/pop/eligibility/${this.addr(collection)}?${params}`
    );
    return res.data;
  }

  getCoins(opts: ApiCoinsQuery = {}): Promise<ApiResponse<ApiCoin[]>> {
    const params = new URLSearchParams();
    if (opts.page) params.set("page", String(opts.page));
    if (opts.limit) params.set("limit", String(opts.limit));
    if (opts.service) params.set("service", opts.service);
    if (opts.sort) params.set("sort", opts.sort);
    if (opts.creator) params.set("creator", this.addr(opts.creator));
    if (opts.chain) params.set("chain", opts.chain);
    const qs = params.toString();
    return this.get<ApiResponse<ApiCoin[]>>(`/v1/coins${qs ? `?${qs}` : ""}`);
  }

  getCoin(contract: string): Promise<{ data: ApiCoin }> {
    return this.get<{ data: ApiCoin }>(`/v1/coins/${this.addr(contract)}`);
  }

  getCoinPrices(): Promise<ApiResponse<ApiCoinPrices>> {
    return this.get<ApiResponse<ApiCoinPrices>>("/v1/coins/prices");
  }

  claimCoin(coinAddress: string, siwsToken: string): Promise<ApiCoinClaimResult> {
    return this.request<ApiCoinClaimResult>("/v1/coins/claim", {
      method: "POST",
      headers: { Authorization: `Bearer ${siwsToken}` },
      body: JSON.stringify({ coinAddress }),
    });
  }

  getCoinClaims(status = "PENDING"): Promise<ApiResponse<ApiCollectionClaim[]>> {
    return this.get<ApiResponse<ApiCollectionClaim[]>>(
      `/v1/coins/claims?status=${encodeURIComponent(status)}`,
    );
  }

  updateCoinProfile(
    contract: string,
    data: { image?: string | null; description?: string | null },
    siwsToken: string
  ): Promise<ApiResponse<ApiCoin>> {
    return this.request<ApiResponse<ApiCoin>>(`/v1/coins/${this.addr(contract)}`, {
      method: "PATCH",
      body: JSON.stringify(data),
      headers: this.bearer(siwsToken),
    });
  }

  async getDropMintStatus(collection: string, wallet: string): Promise<DropMintStatus> {
    const res = await this.get<{ data: DropMintStatus }>(
      `/v1/drop/mint-status/${this.addr(collection)}/${this.addr(wallet)}`
    );
    return res.data;
  }

  async getDropInfo(contract: string): Promise<ApiDropInfo | null> {
    const res = await this.request<{ data: ApiDropInfo } | null>(
      `/v1/drop/${this.addr(contract)}/info`,
      { method: "GET" },
      { allow404: true },
    );
    return res?.data ?? null;
  }

  async getDropState(contract: string): Promise<ApiDropState> {
    const res = await this.get<{ data: ApiDropState }>(`/v1/drop/${this.addr(contract)}/state`);
    return res.data;
  }

  async getTicket(contract: string, tokenId: string): Promise<ApiTierOnchain> {
    const res = await this.get<{ data: ApiTierOnchain }>(`/v1/tickets/${this.addr(contract)}/${tokenId}`);
    return res.data;
  }

  async getTicketCount(contract: string): Promise<number> {
    const res = await this.get<{ data: { count: number } }>(`/v1/tickets/${this.addr(contract)}/count`);
    return res.data.count;
  }

  async getClubMembershipCount(contract: string): Promise<number> {
    const res = await this.get<{ data: { count: number } }>(`/v1/club/${this.addr(contract)}/count`);
    return res.data.count;
  }

  async getClubMembership(contract: string, tokenId: string): Promise<ApiTierOnchain> {
    const res = await this.get<{ data: ApiTierOnchain }>(`/v1/club/${this.addr(contract)}/${tokenId}`);
    return res.data;
  }

  async isClubMember(contract: string, tokenId: string, wallet: string): Promise<boolean> {
    const res = await this.get<{ data: { isMember: boolean } }>(
      `/v1/club/${this.addr(contract)}/${tokenId}/member/${this.addr(wallet)}`
    );
    return res.data.isMember;
  }

  async getIpNftTokenData(contract: string, tokenId: string): Promise<ApiIpNftTokenData | null> {
    const res = await this.get<{ data: ApiIpNftTokenData | null }>(`/v1/ipnft/${this.addr(contract)}/${tokenId}`);
    return res.data;
  }

  async getPlatformStats(): Promise<ApiPlatformStats> {
    const res = await this.get<{ data: ApiPlatformStats }>("/v1/stats");
    return res.data;
  }

  getTokens(query: ApiTokensQuery = {}): Promise<ApiResponse<ApiToken[]>> {
    const params = new URLSearchParams();
    if (query.page !== undefined) params.set("page", String(query.page));
    if (query.limit !== undefined) params.set("limit", String(query.limit));
    if (query.sort) params.set("sort", query.sort);
    if (query.ipType) params.set("ipType", query.ipType);
    if (query.derivatives) params.set("derivatives", query.derivatives);
    const qs = params.toString();
    return this.get<ApiResponse<ApiToken[]>>(`/v1/tokens${qs ? `?${qs}` : ""}`);
  }

  async isCreatorHidden(wallet: string): Promise<boolean> {
    const res = await this.get<{ isHidden: boolean }>(`/v1/creators/${this.addr(wallet)}/hidden`);
    return res.isHidden;
  }

  getMyUsernameClaim(siwsToken: string): Promise<{ username: string | null; claim: ApiUsernameClaim | null }> {
    return this.request<{ username: string | null; claim: ApiUsernameClaim | null }>("/v1/username-claims/me", {
      method: "GET",
      headers: this.bearer(siwsToken),
    });
  }

  checkUsernameAvailability(username: string): Promise<{ available: boolean; reason?: string }> {
    return this.get<{ available: boolean; reason?: string }>(
      `/v1/username-claims/check/${encodeURIComponent(username)}`
    );
  }

  async submitUsernameClaim(username: string, siwsToken: string, notifyEmail?: string): Promise<ApiUsernameClaim> {
    const res = await this.request<{ claim: ApiUsernameClaim }>("/v1/username-claims", {
      method: "POST",
      headers: this.bearer(siwsToken),
      body: JSON.stringify({ username, ...(notifyEmail ? { notifyEmail } : {}) }),
    });
    return res.claim;
  }

  async submitReport(report: ApiSubmitReport, siwsToken: string): Promise<void> {
    const targetContract = report.targetContract ? this.addr(report.targetContract) : undefined;
    const targetAddress = report.targetAddress ? this.addr(report.targetAddress) : undefined;
    let targetKey: string | null = null;
    if (report.targetType === "TOKEN" && targetContract && report.targetTokenId) {
      targetKey = `TOKEN:${targetContract}:${report.targetTokenId}`;
    } else if (report.targetType === "COLLECTION" && targetContract) {
      targetKey = `COLLECTION:${targetContract}`;
    } else if (report.targetType === "CREATOR" && targetAddress) {
      targetKey = `CREATOR:${targetAddress}`;
    } else if (report.targetType === "COMMENT" && report.targetId) {
      targetKey = `COMMENT::${report.targetId}`;
    }
    if (!targetKey) throw new Error(`A ${report.targetType} report needs its target`);

    await this.request<unknown>("/v1/reports", {
      method: "POST",
      headers: this.bearer(siwsToken),
      body: JSON.stringify({ ...report, targetKey, targetContract, targetAddress }),
    });
  }

  getPricing(): Promise<ApiPricing> {
    return this.get<ApiPricing>("/v1/pricing");
  }

  listCollections(query: ApiCollectionsListQuery = {}): Promise<ApiResponse<ApiCollection[]>> {
    const params = new URLSearchParams();
    if (query.page !== undefined) params.set("page", String(query.page));
    if (query.limit !== undefined) params.set("limit", String(query.limit));
    if (query.owner) params.set("owner", this.addr(query.owner));
    if (query.service) params.set("service", query.service);
    if (query.sort) params.set("sort", query.sort);
    if (query.isFeatured !== undefined) params.set("isFeatured", String(query.isFeatured));
    if (query.hideEmpty !== undefined) params.set("hideEmpty", String(query.hideEmpty));
    if (query.standard) params.set("standard", query.standard);
    if (query.chain) params.set("chain", query.chain);
    const qs = params.toString();
    return this.get<ApiResponse<ApiCollection[]>>(`/v1/collections${qs ? `?${qs}` : ""}`);
  }

  generateWallet(newWalletSiwsToken: string, siwsToken: string): Promise<{ walletAddress: string }> {
    return this.request<{ walletAddress: string }>("/v1/users/me/generate-wallet", {
      method: "POST",
      headers: this.bearer(siwsToken),
      body: JSON.stringify({ newWalletSiwsToken }),
    });
  }

  syncCoin(coinAddress: string, owner?: string): Promise<{ data: ApiCoin }> {
    return this.post<{ data: ApiCoin }>("/v1/coins/sync", { coinAddress, ...(owner ? { owner } : {}) });
  }

  registerCollection(contractAddress: string): Promise<{ data: ApiCollection }> {
    return this.post<{ data: ApiCollection }>("/v1/collections/register", { contractAddress });
  }

  getSponsorshipOffers(query: ApiSponsorshipOffersQuery = {}): Promise<ApiResponse<ApiSponsorshipOffer[]>> {
    const params = new URLSearchParams({ limit: String(query.limit ?? 50) });
    if (query.nftContract) params.set("nftContract", query.nftContract);
    if (query.author) params.set("author", query.author);
    if (query.owner) params.set("owner", query.owner);
    if (query.open !== undefined) params.set("open", String(query.open));
    return this.get<ApiResponse<ApiSponsorshipOffer[]>>(`/v1/sponsorship/offers?${params}`);
  }

  async getSponsorshipOffer(offerId: string): Promise<ApiSponsorshipOffer | null> {
    const res = await this.request<{ data: ApiSponsorshipOffer } | null>(
      `/v1/sponsorship/offers/${encodeURIComponent(offerId)}`,
      { method: "GET" },
      { allow404: true },
    );
    return res?.data ?? null;
  }

  async getSponsorshipProposal(proposalId: string): Promise<ApiSponsorshipProposal | null> {
    const res = await this.request<{ data: ApiSponsorshipProposal } | null>(
      `/v1/sponsorship/proposals/${encodeURIComponent(proposalId)}`,
      { method: "GET" },
      { allow404: true },
    );
    return res?.data ?? null;
  }

  async getSponsorshipBids(offerId: string): Promise<ApiSponsorshipBid[]> {
    const res = await this.get<{ data: ApiSponsorshipBid[] }>(`/v1/sponsorship/offers/${encodeURIComponent(offerId)}/bids`);
    return res.data;
  }

  getSponsorshipProposals(query: ApiSponsorshipProposalsQuery = {}): Promise<ApiResponse<ApiSponsorshipProposal[]>> {
    const params = new URLSearchParams({ limit: String(query.limit ?? 50) });
    if (query.nftContract) params.set("nftContract", query.nftContract);
    if (query.proposer) params.set("proposer", query.proposer);
    if (query.owner) params.set("owner", query.owner);
    if (query.open !== undefined) params.set("open", String(query.open));
    return this.get<ApiResponse<ApiSponsorshipProposal[]>>(`/v1/sponsorship/proposals?${params}`);
  }

  getSponsorshipLicenses(query: ApiSponsorshipLicensesQuery = {}): Promise<ApiResponse<ApiSponsorshipLicense[]>> {
    const params = new URLSearchParams({ limit: String(query.limit ?? 50) });
    if (query.holder) params.set("holder", query.holder);
    if (query.author) params.set("author", query.author);
    return this.get<ApiResponse<ApiSponsorshipLicense[]>>(`/v1/sponsorship/licenses?${params}`);
  }

  async getRewards(address: string): Promise<ApiUserRewards> {
    const res = await this.get<{ data: ApiUserRewards }>(`/v1/rewards/${this.addr(address)}`);
    return res.data;
  }

  getRewardsLeaderboard(page = 1, limit = 50): Promise<ApiResponse<ApiRewardsLeaderboardEntry[]>> {
    return this.get<ApiResponse<ApiRewardsLeaderboardEntry[]>>(`/v1/rewards?page=${page}&limit=${limit}`);
  }

  getRewardsEvents(address: string, page = 1, limit = 20): Promise<ApiResponse<ApiPointEvent[]>> {
    return this.get<ApiResponse<ApiPointEvent[]>>(
      `/v1/rewards/${this.addr(address)}/events?page=${page}&limit=${limit}`
    );
  }

  async getRewardsConfig(): Promise<ApiRewardsConfig> {
    const res = await this.get<{ data: ApiRewardsConfig }>(`/v1/rewards/config`);
    return res.data;
  }

  async getRewardsBatch(addresses: string[]): Promise<ApiRewardsBatchEntry[]> {
    if (addresses.length === 0) return [];
    const params = new URLSearchParams({ addresses: addresses.map((a) => this.addr(a)).join(",") });
    const res = await this.get<{ data: ApiRewardsBatchEntry[] }>(`/v1/rewards/batch?${params}`);
    return res.data;
  }
}
