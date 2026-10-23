import type { Transport } from "../transport.js";
import type {
  ApiRemixOffer,
  ApiRemixOffersQuery,
  AutoRemixOfferParams,
  ConfirmRemixOfferParams,
  ConfirmSelfRemixParams,
  CreateRemixOfferParams,
  ApiResponse,
} from "../../types/api.js";

export interface RemixApi {
  submit(params: CreateRemixOfferParams): Promise<ApiRemixOffer>;
  submitAuto(params: AutoRemixOfferParams): Promise<ApiRemixOffer>;
  confirmSelf(params: ConfirmSelfRemixParams): Promise<ApiRemixOffer>;
  list(query: ApiRemixOffersQuery): Promise<ApiResponse<ApiRemixOffer[]>>;
  get(id: string): Promise<ApiRemixOffer>;
  confirm(id: string, params: ConfirmRemixOfferParams): Promise<ApiRemixOffer>;
  reject(id: string): Promise<ApiRemixOffer>;
  extend(id: string, days: number): Promise<ApiRemixOffer>;
}

export function createRemixApi(t: Transport): RemixApi {
  const one = async (promise: Promise<ApiResponse<ApiRemixOffer>>): Promise<ApiRemixOffer> => (await promise).data;
  return {
    submit: (params) => one(t.post("/v1/remix-offers", params)),
    submitAuto: (params) => one(t.post("/v1/remix-offers/auto", params)),
    confirmSelf: (params) => one(t.post("/v1/remix-offers/self/confirm", params)),
    list: (query) =>
      t.get("/v1/remix-offers", { role: query.role, status: query.status, page: query.page, limit: query.limit }),
    get: (id) => one(t.get(`/v1/remix-offers/${id}`)),
    confirm: (id, params) => one(t.post(`/v1/remix-offers/${id}/confirm`, params)),
    reject: (id) => one(t.post(`/v1/remix-offers/${id}/reject`, {})),
    extend: (id, days) => one(t.post(`/v1/remix-offers/${id}/extend`, { days })),
  };
}
