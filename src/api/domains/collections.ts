import type { Transport } from "../transport.js";
import type {
  ApiCollection,
  ApiCollectionClaim,
  ApiCollectionProfile,
  ApiCollectionSlugClaim,
  ApiCollectionsListQuery,
  ApiResponse,
  ApiToken,
  CollectionTokensSort,
  UpdateCollectionProfileInput,
} from "../../types/api.js";

export interface GatedContent {
  title: string;
  url: string;
  type: string;
}

export interface CollectionsApi {
  list(query?: ApiCollectionsListQuery): Promise<ApiResponse<ApiCollection[]>>;
  get(contract: string): Promise<ApiCollection>;
  findBySlug(slug: string): Promise<ApiCollection | null>;
  tokens(contract: string, opts?: { page?: number; limit?: number; sort?: CollectionTokensSort }): Promise<ApiResponse<ApiToken[]>>;
  register(contractAddress: string): Promise<ApiCollection>;
  findProfile(contractAddress: string): Promise<ApiCollectionProfile | null>;
  updateProfile(contractAddress: string, data: UpdateCollectionProfileInput): Promise<ApiCollectionProfile>;
  findGatedContent(contractAddress: string): Promise<GatedContent | null>;
  claim(contractAddress: string, walletAddress: string): Promise<{ verified: boolean; collection?: ApiCollection; reason?: string }>;
  requestClaim(params: { contractAddress: string; walletAddress?: string; email: string; notes?: string }): Promise<{ claim: ApiCollectionClaim }>;
  slugAvailability(slug: string): Promise<{ available: boolean; reason?: string }>;
  submitSlugClaim(contractAddress: string, slug: string, notifyEmail?: string): Promise<{ claim: ApiCollectionSlugClaim }>;
  mySlugClaims(): Promise<{ claims: ApiCollectionSlugClaim[] }>;
}

const slugOf = (slug: string) => encodeURIComponent(slug.toLowerCase().trim());

export function createCollectionsApi(t: Transport): CollectionsApi {
  return {
    list(query = {}) {
      return t.get("/v1/collections", {
        page: query.page,
        limit: query.limit,
        owner: query.owner ? t.addr(query.owner) : undefined,
        service: query.service,
        sort: query.sort,
        isFeatured: query.isFeatured,
        hideEmpty: query.hideEmpty,
        standard: query.standard,
        chain: query.chain,
      });
    },
    async get(contract) {
      return (await t.get<ApiResponse<ApiCollection>>(`/v1/collections/${t.addr(contract)}`)).data;
    },
    async findBySlug(slug) {
      const res = await t.find<{ data: ApiCollection }>(`/v1/collections/by-slug/${slugOf(slug)}`);
      return res?.data ?? null;
    },
    tokens(contract, opts = {}) {
      return t.get(`/v1/collections/${t.addr(contract)}/tokens`, {
        page: opts.page ?? 1,
        limit: opts.limit ?? 20,
        sort: opts.sort ?? "recent",
      });
    },
    async register(contractAddress) {
      return (await t.post<{ data: ApiCollection }>("/v1/collections/register", { contractAddress })).data;
    },
    findProfile(contractAddress) {
      return t.find(`/v1/collections/${t.addr(contractAddress)}/profile`);
    },
    updateProfile(contractAddress, data) {
      return t.patch(`/v1/collections/${t.addr(contractAddress)}/profile`, data);
    },
    findGatedContent(contractAddress) {
      return t.find(`/v1/collections/${t.addr(contractAddress)}/gated-content`, { also: [403] });
    },
    claim(contractAddress, walletAddress) {
      return t.post("/v1/collections/claim", { contractAddress, walletAddress });
    },
    requestClaim(params) {
      return t.post("/v1/collections/claim/request", params);
    },
    slugAvailability(slug) {
      return t.get(`/v1/collection-slug-claims/check/${slugOf(slug)}`);
    },
    submitSlugClaim(contractAddress, slug, notifyEmail) {
      return t.post("/v1/collection-slug-claims", { contractAddress, slug, notifyEmail });
    },
    mySlugClaims() {
      return t.get("/v1/collection-slug-claims/me");
    },
  };
}
