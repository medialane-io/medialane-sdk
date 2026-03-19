import { normalizeAddress } from "../utils/address.js";
import type { MedialaneErrorCode } from "../types/errors.js";
import { withRetry, type RetryOptions } from "../utils/retry.js";
import type {
  ApiOrder,
  ApiOrdersQuery,
  ApiToken,
  ApiCollection,
  ApiCollectionProfile,
  ApiCreatorProfile,
  ApiCollectionClaim,
  ApiActivity,
  ApiActivitiesQuery,
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
  ApiResponse,
  CollectionSort,
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
    retryOptions?: RetryOptions
  ) {
    this.baseHeaders = apiKey ? { "x-api-key": apiKey } : {};
    this.retryOptions = retryOptions;
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const url = `${this.baseUrl.replace(/\/$/, "")}${path}`;
    const headers: Record<string, string> = { ...this.baseHeaders };
    if (!(init?.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }
    const res = await withRetry(async () => {
      const response = await fetch(url, {
        ...init,
        headers: { ...headers, ...(init?.headers as Record<string, string> | undefined) },
      });
      if (!response.ok) {
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

  // ─── Orders ────────────────────────────────────────────────────────────────

  getOrders(query: ApiOrdersQuery = {}): Promise<ApiResponse<ApiOrder[]>> {
    const params = new URLSearchParams();
    if (query.status) params.set("status", query.status);
    if (query.collection) params.set("collection", query.collection);
    if (query.currency) params.set("currency", query.currency);
    if (query.sort) params.set("sort", query.sort);
    if (query.page !== undefined) params.set("page", String(query.page));
    if (query.limit !== undefined) params.set("limit", String(query.limit));
    if (query.offerer) params.set("offerer", normalizeAddress(query.offerer));
    if (query.minPrice) params.set("minPrice", query.minPrice);
    if (query.maxPrice) params.set("maxPrice", query.maxPrice);
    const qs = params.toString();
    return this.get<ApiResponse<ApiOrder[]>>(`/v1/orders${qs ? `?${qs}` : ""}`);
  }

  getOrder(orderHash: string): Promise<ApiResponse<ApiOrder>> {
    return this.get<ApiResponse<ApiOrder>>(`/v1/orders/${orderHash}`);
  }

  getActiveOrdersForToken(contract: string, tokenId: string): Promise<ApiResponse<ApiOrder[]>> {
    return this.get<ApiResponse<ApiOrder[]>>(`/v1/orders/token/${normalizeAddress(contract)}/${tokenId}`);
  }

  getOrdersByUser(address: string, page = 1, limit = 20): Promise<ApiResponse<ApiOrder[]>> {
    return this.get<ApiResponse<ApiOrder[]>>(
      `/v1/orders/user/${normalizeAddress(address)}?page=${page}&limit=${limit}`
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
      `/v1/tokens/owned/${normalizeAddress(address)}?page=${page}&limit=${limit}`
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
    sort?: CollectionSort
  ): Promise<ApiResponse<ApiCollection[]>> {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (isKnown !== undefined) params.set("isKnown", String(isKnown));
    if (sort) params.set("sort", sort);
    return this.get<ApiResponse<ApiCollection[]>>(`/v1/collections?${params}`);
  }

  getCollectionsByOwner(owner: string, page = 1, limit = 50): Promise<ApiResponse<ApiCollection[]>> {
    const params = new URLSearchParams({ owner: normalizeAddress(owner), page: String(page), limit: String(limit) });
    return this.get<ApiResponse<ApiCollection[]>>(`/v1/collections?${params}`);
  }

  getCollection(contract: string): Promise<ApiResponse<ApiCollection>> {
    return this.get<ApiResponse<ApiCollection>>(`/v1/collections/${normalizeAddress(contract)}`);
  }

  getCollectionTokens(
    contract: string,
    page = 1,
    limit = 20
  ): Promise<ApiResponse<ApiToken[]>> {
    return this.get<ApiResponse<ApiToken[]>>(
      `/v1/collections/${normalizeAddress(contract)}/tokens?page=${page}&limit=${limit}`
    );
  }

  // ─── Activities ────────────────────────────────────────────────────────────

  getActivities(query: ApiActivitiesQuery = {}): Promise<ApiResponse<ApiActivity[]>> {
    const params = new URLSearchParams();
    if (query.type) params.set("type", query.type);
    if (query.page !== undefined) params.set("page", String(query.page));
    if (query.limit !== undefined) params.set("limit", String(query.limit));
    const qs = params.toString();
    return this.get<ApiResponse<ApiActivity[]>>(`/v1/activities${qs ? `?${qs}` : ""}`);
  }

  getActivitiesByAddress(
    address: string,
    page = 1,
    limit = 20
  ): Promise<ApiResponse<ApiActivity[]>> {
    return this.get<ApiResponse<ApiActivity[]>>(
      `/v1/activities/${normalizeAddress(address)}?page=${page}&limit=${limit}`
    );
  }

  // ─── Search ────────────────────────────────────────────────────────────────

  search(q: string, limit = 10): Promise<ApiResponse<ApiSearchResult> & { query: string }> {
    const params = new URLSearchParams({ q, limit: String(limit) });
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

  createMintIntent(params: CreateMintIntentParams): Promise<ApiResponse<ApiIntentCreated>> {
    return this.post<ApiResponse<ApiIntentCreated>>("/v1/intents/mint", params);
  }

  createCollectionIntent(params: CreateCollectionIntentParams): Promise<ApiResponse<ApiIntentCreated>> {
    return this.post<ApiResponse<ApiIntentCreated>>("/v1/intents/create-collection", params);
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
    const url = `${this.baseUrl.replace(/\/$/, "")}/v1/collections/claim`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "x-api-key": this.baseHeaders["x-api-key"] ?? "",
        "Content-Type": "application/json",
        "Authorization": `Bearer ${clerkToken}`,
      },
      body: JSON.stringify({ contractAddress, walletAddress }),
    });
    return res.json();
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

  async getCollectionProfile(contractAddress: string): Promise<ApiCollectionProfile | null> {
    const url = `${this.baseUrl.replace(/\/$/, "")}/v1/collections/${normalizeAddress(contractAddress)}/profile`;
    const res = await fetch(url, { headers: this.baseHeaders });
    if (res.status === 404) return null;
    return res.json();
  }

  /**
   * Update collection profile. Requires Clerk JWT for ownership check.
   */
  async updateCollectionProfile(
    contractAddress: string,
    data: Partial<Omit<ApiCollectionProfile, "contractAddress" | "chain" | "updatedBy" | "updatedAt">>,
    clerkToken: string
  ): Promise<ApiCollectionProfile> {
    const url = `${this.baseUrl.replace(/\/$/, "")}/v1/collections/${normalizeAddress(contractAddress)}/profile`;
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        "x-api-key": this.baseHeaders["x-api-key"] ?? "",
        "Content-Type": "application/json",
        "Authorization": `Bearer ${clerkToken}`,
      },
      body: JSON.stringify(data),
    });
    return res.json();
  }

  // ─── Creator Profiles ───────────────────────────────────────────────────────

  async getCreatorProfile(walletAddress: string): Promise<ApiCreatorProfile | null> {
    const url = `${this.baseUrl.replace(/\/$/, "")}/v1/creators/${normalizeAddress(walletAddress)}/profile`;
    const res = await fetch(url, { headers: this.baseHeaders });
    if (res.status === 404) return null;
    return res.json();
  }

  /** Resolve a username slug to a creator profile (public). */
  async getCreatorByUsername(username: string): Promise<ApiCreatorProfile | null> {
    const url = `${this.baseUrl.replace(/\/$/, "")}/v1/creators/by-username/${encodeURIComponent(username.toLowerCase().trim())}`;
    const res = await fetch(url, { headers: this.baseHeaders });
    if (res.status === 404) return null;
    return res.json();
  }

  /**
   * Update creator profile. Requires Clerk JWT; wallet must match authenticated user.
   */
  async updateCreatorProfile(
    walletAddress: string,
    data: Partial<Omit<ApiCreatorProfile, "walletAddress" | "chain" | "updatedAt">>,
    clerkToken: string
  ): Promise<ApiCreatorProfile> {
    const url = `${this.baseUrl.replace(/\/$/, "")}/v1/creators/${normalizeAddress(walletAddress)}/profile`;
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        "x-api-key": this.baseHeaders["x-api-key"] ?? "",
        "Content-Type": "application/json",
        "Authorization": `Bearer ${clerkToken}`,
      },
      body: JSON.stringify(data),
    });
    return res.json();
  }
}
