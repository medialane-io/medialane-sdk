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
  ApiUserRewards,
  ApiRewardsLeaderboardEntry,
  ApiRewardsConfig,
  ApiRewardsBatchEntry,
  ApiPointEvent,
  ApiCoinsQuery,
  ApiCollectionProfile,
  ApiCreatorProfile,
  ApiCreatorListResult,
  ApiCollectionClaim,
  ApiCollectionSlugClaim,
  ApiUserWallet,
  ApiAppSource,
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
  ApiMetadataSignedUrl,
  ApiMetadataUpload,
  ApiPortalMe,
  ApiPortalKey,
  ApiPortalKeyCreated,
  ApiUsageDay,
  ApiWebhookEndpoint,
  ApiWebhookCreated,
  CreateWebhookParams,
  CreateListingIntentParams,
  MakeOfferIntentParams,
  FulfillOrderIntentParams,
  CancelOrderIntentParams,
  CreateMintIntentParams,
  CreateCollectionIntentParams,
  CreateCounterOfferIntentParams,
  CreateRemixOfferParams,
  AutoRemixOfferParams,
  ConfirmSelfRemixParams,
  ConfirmRemixOfferParams,
  ApiResponse,
  CollectionSort,
  CollectionTokensSort,
  PopClaimStatus,
  PopBatchEligibilityItem,
  DropMintStatus,
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
    message: string
  ) {
    super(message);
    this.name = "MedialaneApiError";
    this.code = deriveErrorCode(status);
  }
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

  /** Normalize an address for this client's chain (chain-scoped — Decision B). */
  private addr(a: string): string {
    return normalizeAddress(this.chain, a);
  }

  /**
   * The one HTTP path for the whole client: base headers (incl. x-api-key),
   * JSON error unwrapping, and `withRetry` (5xx/network only — 4xx never
   * retried). `allow404`/`allow403` turn those statuses into a `null` result
   * instead of a throw, for "profile may not exist" / "not a holder" reads —
   * so no method needs to hand-roll `fetch` to get that behavior.
   */
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
        let message = text;
        try {
          const body = JSON.parse(text) as { error?: string };
          if (body.error) message = body.error;
        } catch {
          // use raw text
        }
        throw new MedialaneApiError(response.status, message);
      }
      return response;
    }, this.retryOptions);

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

  private del<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: "DELETE" });
  }

  /** Bearer header for Clerk-JWT-authenticated routes. */
  private bearer(clerkToken: string): Record<string, string> {
    return { Authorization: `Bearer ${clerkToken}` };
  }

  // ─── Orders ────────────────────────────────────────────────────────────────

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

  getOrdersByUser(address: string, page = 1, limit = 20): Promise<ApiResponse<ApiOrder[]>> {
    return this.get<ApiResponse<ApiOrder[]>>(
      `/v1/orders/user/${this.addr(address)}?page=${page}&limit=${limit}`
    );
  }

  // ─── Tokens ────────────────────────────────────────────────────────────────

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

  // ─── Collections ───────────────────────────────────────────────────────────

  getCollections(
    page = 1,
    limit = 20,
    isKnown?: boolean,
    sort?: CollectionSort,
    service?: string,
    chain?: ChainFilter
  ): Promise<ApiResponse<ApiCollection[]>> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (isKnown !== undefined) params.set("isKnown", String(isKnown));
    if (sort) params.set("sort", sort);
    if (service) params.set("service", service);
    if (chain) params.set("chain", chain);
    return this.get<ApiResponse<ApiCollection[]>>(`/v1/collections?${params}`);
  }

  getCollectionsByOwner(owner: string, page = 1, limit = 50): Promise<ApiResponse<ApiCollection[]>> {
    const params = new URLSearchParams({ owner: this.addr(owner), page: String(page), limit: String(limit) });
    return this.get<ApiResponse<ApiCollection[]>>(`/v1/collections?${params}`);
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

  // ─── Activities ────────────────────────────────────────────────────────────

  getActivities(query: ApiActivitiesQuery = {}): Promise<ApiResponse<ApiActivity[]>> {
    const params = new URLSearchParams();
    if (query.type) params.set("type", query.type);
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

  // ─── Comments ──────────────────────────────────────────────────────────────

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

  // ─── Search ────────────────────────────────────────────────────────────────

  search(q: string, limit = 10, chain?: ChainFilter): Promise<ApiResponse<ApiSearchResult> & { query: string }> {
    const params = new URLSearchParams({ q, limit: String(limit) });
    if (chain) params.set("chain", chain);
    return this.get<ApiResponse<ApiSearchResult> & { query: string }>(
      `/v1/search?${params.toString()}`
    );
  }

  // ─── Intents ───────────────────────────────────────────────────────────────

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

  getIntent(id: string): Promise<ApiResponse<ApiIntent>> {
    return this.get<ApiResponse<ApiIntent>>(`/v1/intents/${id}`);
  }

  submitIntentSignature(id: string, signature: string[]): Promise<ApiResponse<ApiIntent>> {
    return this.patch<ApiResponse<ApiIntent>>(`/v1/intents/${id}/signature`, { signature });
  }

  confirmIntent(id: string, txHash: string): Promise<ApiResponse<ApiIntent>> {
    return this.patch<ApiResponse<ApiIntent>>(`/v1/intents/${id}/confirm`, { txHash });
  }

  createMintIntent(params: CreateMintIntentParams): Promise<ApiResponse<ApiIntentCreated>> {
    return this.post<ApiResponse<ApiIntentCreated>>("/v1/intents/mint", params);
  }

  createCollectionIntent(params: CreateCollectionIntentParams): Promise<ApiResponse<ApiIntentCreated>> {
    return this.post<ApiResponse<ApiIntentCreated>>("/v1/intents/create-collection", params);
  }

  /**
   * Create a counter-offer intent. The seller proposes a new price in response
   * to a buyer's active bid. clerkToken is optional — the endpoint authenticates
   * via the tenant API key; pass a Clerk JWT only if your backend requires it.
   */
  createCounterOfferIntent(
    params: CreateCounterOfferIntentParams,
    clerkToken?: string
  ): Promise<ApiResponse<ApiIntentCreated>> {
    const extraHeaders: Record<string, string> = clerkToken ? { "Authorization": `Bearer ${clerkToken}` } : {};
    return this.request<ApiResponse<ApiIntentCreated>>("/v1/intents/counter-offer", {
      method: "POST",
      body: JSON.stringify(params),
      headers: extraHeaders,
    });
  }

  /**
   * Fetch counter-offers. Pass `originalOrderHash` (buyer view) or
   * `sellerAddress` (seller view) — at least one is required.
   */
  getCounterOffers(query: ApiCounterOffersQuery): Promise<ApiResponse<ApiOrder[]>> {
    const params = new URLSearchParams();
    if (query.originalOrderHash) params.set("originalOrderHash", query.originalOrderHash);
    if (query.sellerAddress) params.set("sellerAddress", query.sellerAddress);
    if (query.page !== undefined) params.set("page", String(query.page));
    if (query.limit !== undefined) params.set("limit", String(query.limit));
    return this.get<ApiResponse<ApiOrder[]>>(`/v1/orders/counter-offers?${params}`);
  }

  // ─── Metadata ──────────────────────────────────────────────────────────────

  getMetadataSignedUrl(): Promise<ApiResponse<ApiMetadataSignedUrl>> {
    return this.get<ApiResponse<ApiMetadataSignedUrl>>("/v1/metadata/signed-url");
  }

  uploadMetadata(metadata: Record<string, unknown>): Promise<ApiResponse<ApiMetadataUpload>> {
    return this.post<ApiResponse<ApiMetadataUpload>>("/v1/metadata/upload", metadata);
  }

  resolveMetadata(uri: string): Promise<ApiResponse<unknown>> {
    const params = new URLSearchParams({ uri });
    return this.get<ApiResponse<unknown>>(`/v1/metadata/resolve?${params.toString()}`);
  }

  uploadFile(file: File): Promise<ApiResponse<ApiMetadataUpload>> {
    const formData = new FormData();
    formData.append("file", file);
    // Content-Type is intentionally omitted — request() detects FormData and
    // lets the runtime set multipart/form-data with the correct boundary.
    return this.request<ApiResponse<ApiMetadataUpload>>("/v1/metadata/upload-file", {
      method: "POST",
      body: formData,
    });
  }

  // ─── Portal (tenant self-service) ──────────────────────────────────────────

  getMe(): Promise<ApiResponse<ApiPortalMe>> {
    return this.get<ApiResponse<ApiPortalMe>>("/v1/portal/me");
  }

  getApiKeys(): Promise<ApiResponse<ApiPortalKey[]>> {
    return this.get<ApiResponse<ApiPortalKey[]>>("/v1/portal/keys");
  }

  createApiKey(label?: string): Promise<ApiResponse<ApiPortalKeyCreated>> {
    return this.post<ApiResponse<ApiPortalKeyCreated>>("/v1/portal/keys", label ? { label } : {});
  }

  deleteApiKey(id: string): Promise<ApiResponse<{ id: string; status: string }>> {
    return this.del<ApiResponse<{ id: string; status: string }>>(`/v1/portal/keys/${id}`);
  }

  getUsage(): Promise<ApiResponse<ApiUsageDay[]>> {
    return this.get<ApiResponse<ApiUsageDay[]>>("/v1/portal/usage");
  }

  getWebhooks(): Promise<ApiResponse<ApiWebhookEndpoint[]>> {
    return this.get<ApiResponse<ApiWebhookEndpoint[]>>("/v1/portal/webhooks");
  }

  createWebhook(params: CreateWebhookParams): Promise<ApiResponse<ApiWebhookCreated>> {
    return this.post<ApiResponse<ApiWebhookCreated>>("/v1/portal/webhooks", params);
  }

  deleteWebhook(id: string): Promise<ApiResponse<{ id: string; status: string }>> {
    return this.del<ApiResponse<{ id: string; status: string }>>(
      `/v1/portal/webhooks/${id}`
    );
  }

  // ─── Collection Claims ──────────────────────────────────────────────────────

  /**
   * Path 1: On-chain auto claim. Sends both x-api-key (tenant auth) and
   * Authorization: Bearer (Clerk JWT) simultaneously.
   */
  async claimCollection(
    contractAddress: string,
    walletAddress: string,
    clerkToken: string
  ): Promise<{ verified: boolean; collection?: ApiCollection; reason?: string }> {
    return this.request("/v1/collections/claim", {
      method: "POST",
      body: JSON.stringify({ contractAddress, walletAddress }),
      headers: this.bearer(clerkToken),
    });
  }

  /**
   * Path 3: Manual off-chain claim request (email-based).
   */
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

  // ─── Collection Profiles ────────────────────────────────────────────────────

  getCollectionProfile(contractAddress: string): Promise<ApiCollectionProfile | null> {
    return this.request<ApiCollectionProfile | null>(
      `/v1/collections/${this.addr(contractAddress)}/profile`,
      { method: "GET" },
      { allow404: true },
    );
  }

  /**
   * Update collection profile. Requires Clerk JWT for ownership check.
   */
  updateCollectionProfile(
    contractAddress: string,
    data: Partial<Omit<ApiCollectionProfile, "contractAddress" | "chain" | "updatedBy" | "updatedAt">>,
    clerkToken: string
  ): Promise<ApiCollectionProfile> {
    return this.request<ApiCollectionProfile>(
      `/v1/collections/${this.addr(contractAddress)}/profile`,
      { method: "PATCH", body: JSON.stringify(data), headers: this.bearer(clerkToken) },
    );
  }

  getGatedContent(
    contractAddress: string,
    clerkToken: string
  ): Promise<{ title: string; url: string; type: string } | null> {
    return this.request<{ title: string; url: string; type: string } | null>(
      `/v1/collections/${this.addr(contractAddress)}/gated-content`,
      { method: "GET", headers: this.bearer(clerkToken) },
      { allow404: true, allow403: true },
    );
  }

  // ─── Creator Profiles ───────────────────────────────────────────────────────

  /** List all creators with an approved username. */
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

  /** Resolve a username slug to a creator profile (public). */
  getCreatorByUsername(username: string): Promise<ApiCreatorProfile | null> {
    return this.request<ApiCreatorProfile | null>(
      `/v1/creators/by-username/${encodeURIComponent(username.toLowerCase().trim())}`,
      { method: "GET" },
      { allow404: true },
    );
  }

  /**
   * Update creator profile. Requires Clerk JWT; wallet must match authenticated user.
   */
  updateCreatorProfile(
    walletAddress: string,
    data: Partial<Omit<ApiCreatorProfile, "walletAddress" | "chain" | "updatedAt">>,
    clerkToken: string
  ): Promise<ApiCreatorProfile> {
    return this.request<ApiCreatorProfile>(
      `/v1/creators/${this.addr(walletAddress)}/profile`,
      { method: "PATCH", body: JSON.stringify(data), headers: this.bearer(clerkToken) },
    );
  }

  // ─── Collection Slug Claims ───────────────────────────────────────────────────

  /** Check if a collection slug is available (public, no auth). */
  checkCollectionSlugAvailability(slug: string): Promise<{ available: boolean; reason?: string }> {
    return this.get<{ available: boolean; reason?: string }>(
      `/v1/collection-slug-claims/check/${encodeURIComponent(slug.toLowerCase().trim())}`,
    );
  }

  /** Submit a slug claim for a collection. Requires Clerk JWT — caller must be the collection owner. */
  submitCollectionSlugClaim(
    contractAddress: string,
    slug: string,
    clerkToken: string,
    notifyEmail?: string
  ): Promise<{ claim: ApiCollectionSlugClaim }> {
    return this.request<{ claim: ApiCollectionSlugClaim }>("/v1/collection-slug-claims", {
      method: "POST",
      body: JSON.stringify({ contractAddress, slug, notifyEmail }),
      headers: this.bearer(clerkToken),
    });
  }

  /** Returns all slug claims submitted by the authenticated wallet. Requires Clerk JWT. */
  getMyCollectionSlugClaims(clerkToken: string): Promise<{ claims: ApiCollectionSlugClaim[] }> {
    return this.request<{ claims: ApiCollectionSlugClaim[] }>("/v1/collection-slug-claims/me", {
      method: "GET",
      headers: this.bearer(clerkToken),
    });
  }

  /** Resolve a collection slug to a full collection. Returns null if not found. */
  getCollectionBySlug(slug: string): Promise<ApiCollection | null> {
    return this.request<ApiCollection | null>(
      `/v1/collections/by-slug/${encodeURIComponent(slug.toLowerCase().trim())}`,
      { method: "GET" },
      { allow404: true },
    );
  }

  // ─── User Wallet ─────────────────────────────────────────────────────────────

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
  async registerUser(params: {
    walletAddress: string;
    // Free-form wallet-software label ("braavos" / "ready" / "chipipay" / …).
    // The backend lowercases it into Identity.provider and never gates on it
    // (07-identity §II) — so it's a plain string, not a closed enum.
    walletType?: string;
    appSource?: ApiAppSource;
    chain?: ApiChain;
  }): Promise<{
    accountId: string;
    publicId: string;
    walletAddress: string;
    chain: string;
    // The wallet identity's free-form provider label, echoed back from
    // Identity.provider ("braavos" / "chipipay" / "unknown" / …).
    provider: string;
    appSource: ApiAppSource;
    createdAt: string;
  }> {
    return this.post("/v1/users/register", params);
  }

  async upsertMyWallet(
    clerkToken: string,
    options: {
      // Free-form provider label (see registerUser); lowercased into
      // Identity.provider by the backend, never gated on.
      walletType?: string;
      appSource?: ApiAppSource;
      // 07-identity §I: the Wallet identifier is (chain, address). v1
      // backend rejects anything other than STARKNET on this route (the
      // auth path can only prove Starknet ownership); the field exists
      // so the year-2 multichain shape is locked in.
      chain?: ApiChain;
    } = {},
  ): Promise<ApiUserWallet> {
    const body: Record<string, string> = {
      walletType: options.walletType ?? "UNKNOWN",
      appSource: options.appSource ?? "MEDIALANE_SDK",
    };
    if (options.chain) body.chain = options.chain;
    return this.request<ApiUserWallet>("/v1/users/me", {
      method: "POST",
      body: JSON.stringify(body),
      headers: this.bearer(clerkToken),
    });
  }

  /**
   * Get the authenticated user's stored wallet address from the backend DB.
   * Returns null if the user has not completed onboarding yet.
   * Requires Clerk JWT; no tenant API key needed.
   */
  getMyWallet(clerkToken: string): Promise<ApiUserWallet | null> {
    return this.request<ApiUserWallet | null>(
      "/v1/users/me",
      { method: "GET", headers: this.bearer(clerkToken) },
      { allow404: true },
    );
  }

  // ─── Remix Licensing ─────────────────────────────────────────────────────────

  /**
   * Get public remixes of a token (open to everyone).
   */
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

  /**
   * Submit a custom remix offer for a token. Requires Clerk JWT.
   */
  submitRemixOffer(
    params: CreateRemixOfferParams,
    clerkToken: string
  ): Promise<ApiResponse<ApiRemixOffer>> {
    return this.request<ApiResponse<ApiRemixOffer>>("/v1/remix-offers", {
      method: "POST",
      body: JSON.stringify(params),
      headers: { "Authorization": `Bearer ${clerkToken}` },
    });
  }

  /**
   * Submit an auto remix offer for a token with an open license. Requires Clerk JWT.
   */
  submitAutoRemixOffer(
    params: AutoRemixOfferParams,
    clerkToken: string
  ): Promise<ApiResponse<ApiRemixOffer>> {
    return this.request<ApiResponse<ApiRemixOffer>>("/v1/remix-offers/auto", {
      method: "POST",
      body: JSON.stringify(params),
      headers: { "Authorization": `Bearer ${clerkToken}` },
    });
  }

  /**
   * Record a self-remix (owner remixing their own token). Requires Clerk JWT.
   */
  confirmSelfRemix(
    params: ConfirmSelfRemixParams,
    clerkToken: string
  ): Promise<ApiResponse<ApiRemixOffer>> {
    return this.request<ApiResponse<ApiRemixOffer>>("/v1/remix-offers/self/confirm", {
      method: "POST",
      body: JSON.stringify(params),
      headers: { "Authorization": `Bearer ${clerkToken}` },
    });
  }

  /**
   * List remix offers by role. Requires Clerk JWT.
   * role="creator" — offers where you are the original creator.
   * role="requester" — offers you made.
   */
  getRemixOffers(
    query: ApiRemixOffersQuery,
    clerkToken: string
  ): Promise<ApiResponse<ApiRemixOffer[]>> {
    const params = new URLSearchParams({ role: query.role });
    if (query.page !== undefined) params.set("page", String(query.page));
    if (query.limit !== undefined) params.set("limit", String(query.limit));
    return this.request<ApiResponse<ApiRemixOffer[]>>(`/v1/remix-offers?${params}`, {
      method: "GET",
      headers: this.bearer(clerkToken),
    });
  }

  /**
   * Get a single remix offer. Clerk JWT optional (price/currency hidden for non-participants).
   */
  getRemixOffer(id: string, clerkToken?: string): Promise<ApiResponse<ApiRemixOffer>> {
    return this.request<ApiResponse<ApiRemixOffer>>(`/v1/remix-offers/${id}`, {
      method: "GET",
      headers: clerkToken ? this.bearer(clerkToken) : undefined,
    });
  }

  /**
   * Creator approves a remix offer (authorises the requester to mint). Requires Clerk JWT.
   */
  confirmRemixOffer(
    id: string,
    params: ConfirmRemixOfferParams,
    clerkToken: string
  ): Promise<ApiResponse<ApiRemixOffer>> {
    return this.request<ApiResponse<ApiRemixOffer>>(`/v1/remix-offers/${id}/confirm`, {
      method: "POST",
      body: JSON.stringify(params),
      headers: { "Authorization": `Bearer ${clerkToken}` },
    });
  }

  /**
   * Creator rejects a remix offer. Requires Clerk JWT.
   */
  rejectRemixOffer(id: string, clerkToken: string): Promise<ApiResponse<ApiRemixOffer>> {
    return this.request<ApiResponse<ApiRemixOffer>>(`/v1/remix-offers/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Authorization": `Bearer ${clerkToken}` },
    });
  }

  /**
   * Requester extends the expiry of a pending remix offer by 1–30 days.
   * Requires Clerk JWT.
   */
  extendRemixOffer(id: string, days: number, clerkToken: string): Promise<ApiResponse<ApiRemixOffer>> {
    return this.request<ApiResponse<ApiRemixOffer>>(`/v1/remix-offers/${id}/extend`, {
      method: "POST",
      body: JSON.stringify({ days }),
      headers: { "Authorization": `Bearer ${clerkToken}` },
    });
  }

  // ─── POP Protocol ──────────────────────────────────────────────────────────

  getPopCollections(opts: { page?: number; limit?: number; sort?: CollectionSort } = {}): Promise<ApiResponse<ApiCollection[]>> {
    return this.getCollections(opts.page ?? 1, opts.limit ?? 20, undefined, opts.sort, "POP_PROTOCOL");
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

  // ─── Coins (fungible — ERC-20 etc.) ───────────────────────────────────────────
  // Coins are a separate model from Collections (spec 2026-06-14). Price/liquidity
  // is read live from Ekubo (CreatorCoinService.getPrice), never from these.

  getCoins(opts: ApiCoinsQuery = {}): Promise<ApiResponse<ApiCoin[]>> {
    const params = new URLSearchParams();
    if (opts.page) params.set("page", String(opts.page));
    if (opts.limit) params.set("limit", String(opts.limit));
    if (opts.service) params.set("service", opts.service);
    if (opts.chain) params.set("chain", opts.chain);
    const qs = params.toString();
    return this.get<ApiResponse<ApiCoin[]>>(`/v1/coins${qs ? `?${qs}` : ""}`);
  }

  getCoin(contract: string): Promise<{ data: ApiCoin }> {
    return this.get<{ data: ApiCoin }>(`/v1/coins/${this.addr(contract)}`);
  }

  // ─── Collection Drop ────────────────────────────────────────────────────────

  getDropCollections(opts: { page?: number; limit?: number; sort?: CollectionSort } = {}): Promise<ApiResponse<ApiCollection[]>> {
    return this.getCollections(opts.page ?? 1, opts.limit ?? 20, undefined, opts.sort, "COLLECTION_DROP");
  }

  async getDropMintStatus(collection: string, wallet: string): Promise<DropMintStatus> {
    const res = await this.get<{ data: DropMintStatus }>(
      `/v1/drop/mint-status/${this.addr(collection)}/${this.addr(wallet)}`
    );
    return res.data;
  }

  // ─── Rewards (v0.49.0) ─────────────────────────────────────────────────────
  // Scores are recomputed on a schedule by the backend (~15 min) — reads only.

  /** Score + level + progress + badges for one address (zeroed for unknown). */
  async getRewards(address: string): Promise<ApiUserRewards> {
    const res = await this.get<{ data: ApiUserRewards }>(`/v1/rewards/${this.addr(address)}`);
    return res.data;
  }

  /** Paginated XP leaderboard. */
  getRewardsLeaderboard(page = 1, limit = 50): Promise<ApiResponse<ApiRewardsLeaderboardEntry[]>> {
    return this.get<ApiResponse<ApiRewardsLeaderboardEntry[]>>(`/v1/rewards?page=${page}&limit=${limit}`);
  }

  /** Point-event history for an address. */
  getRewardsEvents(address: string, page = 1, limit = 20): Promise<ApiResponse<ApiPointEvent[]>> {
    return this.get<ApiResponse<ApiPointEvent[]>>(
      `/v1/rewards/${this.addr(address)}/events?page=${page}&limit=${limit}`
    );
  }

  /** Reward configuration: level ladder, enabled action XP values, badge catalog. */
  async getRewardsConfig(): Promise<ApiRewardsConfig> {
    const res = await this.get<{ data: ApiRewardsConfig }>(`/v1/rewards/config`);
    return res.data;
  }

  /** Minimal level info for up to 50 addresses — one call per list page. */
  async getRewardsBatch(addresses: string[]): Promise<ApiRewardsBatchEntry[]> {
    if (addresses.length === 0) return [];
    const params = new URLSearchParams({ addresses: addresses.map((a) => this.addr(a)).join(",") });
    const res = await this.get<{ data: ApiRewardsBatchEntry[] }>(`/v1/rewards/batch?${params}`);
    return res.data;
  }
}
