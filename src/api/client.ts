import type {
  ApiOrder,
  ApiOrdersQuery,
  ApiToken,
  ApiCollection,
  ApiResponse,
} from "../types/api.js";

export class MedialaneApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "MedialaneApiError";
  }
}

export class ApiClient {
  constructor(private readonly baseUrl: string) {}

  private async request<T>(path: string): Promise<T> {
    const url = `${this.baseUrl.replace(/\/$/, "")}${path}`;
    const res = await fetch(url);
    if (!res.ok) {
      let message = res.statusText;
      try {
        const body = (await res.json()) as { error?: string };
        if (body.error) message = body.error;
      } catch {
        // use statusText
      }
      throw new MedialaneApiError(res.status, message);
    }
    return res.json() as Promise<T>;
  }

  // ─── Orders ──────────────────────────────────────────────────────────────

  getOrders(query: ApiOrdersQuery = {}): Promise<ApiResponse<ApiOrder[]>> {
    const params = new URLSearchParams();
    if (query.status) params.set("status", query.status);
    if (query.collection) params.set("collection", query.collection);
    if (query.currency) params.set("currency", query.currency);
    if (query.sort) params.set("sort", query.sort);
    if (query.page !== undefined) params.set("page", String(query.page));
    if (query.limit !== undefined) params.set("limit", String(query.limit));
    if (query.offerer) params.set("offerer", query.offerer);
    const qs = params.toString();
    return this.request<ApiResponse<ApiOrder[]>>(`/v1/orders${qs ? `?${qs}` : ""}`);
  }

  getOrder(orderHash: string): Promise<ApiResponse<ApiOrder>> {
    return this.request<ApiResponse<ApiOrder>>(`/v1/orders/${orderHash}`);
  }

  getListingsForToken(contract: string, tokenId: string): Promise<ApiResponse<ApiOrder[]>> {
    return this.request<ApiResponse<ApiOrder[]>>(`/v1/orders/token/${contract}/${tokenId}`);
  }

  getOrdersByUser(address: string, page = 1, limit = 20): Promise<ApiResponse<ApiOrder[]>> {
    return this.request<ApiResponse<ApiOrder[]>>(
      `/v1/orders/user/${address}?page=${page}&limit=${limit}`
    );
  }

  // ─── Tokens ──────────────────────────────────────────────────────────────

  getToken(contract: string, tokenId: string, wait = false): Promise<ApiResponse<ApiToken>> {
    return this.request<ApiResponse<ApiToken>>(
      `/v1/tokens/${contract}/${tokenId}${wait ? "?wait=true" : ""}`
    );
  }

  getTokensByOwner(address: string, page = 1, limit = 20): Promise<ApiResponse<ApiToken[]>> {
    return this.request<ApiResponse<ApiToken[]>>(
      `/v1/tokens/owned/${address}?page=${page}&limit=${limit}`
    );
  }

  // ─── Collections ─────────────────────────────────────────────────────────

  getCollections(page = 1, limit = 20): Promise<ApiResponse<ApiCollection[]>> {
    return this.request<ApiResponse<ApiCollection[]>>(
      `/v1/collections?page=${page}&limit=${limit}`
    );
  }

  getCollection(contract: string): Promise<ApiResponse<ApiCollection>> {
    return this.request<ApiResponse<ApiCollection>>(`/v1/collections/${contract}`);
  }
}
