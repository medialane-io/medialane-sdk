import type { Transport } from "../transport.js";
import type { ApiKeyConfirmation } from "../../starknet/api-key-confirmation.js";
import type {
  ApiCreditPayment,
  ApiFundingInstructions,
  ApiFundingIntent,
  ApiFundingMethod,
  ApiFundingSubmit,
  ApiPortalKey,
  ApiPortalKeyCreated,
  ApiPortalMe,
  ApiPricing,
  ApiResponse,
} from "../../types/api.js";

export interface FundingApi {
  methods(): Promise<ApiFundingMethod[]>;
  create(input: { method: string; params: Record<string, unknown> }): Promise<ApiFundingIntent>;
  get(id: string): Promise<ApiFundingIntent>;
  challenge(id: string, payer: string): Promise<{ typedData: unknown }>;
  authorize(id: string, input: { payer: string; signature: string[] }): Promise<{ instructions: ApiFundingInstructions }>;
  submit(id: string, txHash: string): Promise<ApiFundingSubmit>;
  cancel(id: string): Promise<{ status: string }>;
}

export interface PortalApi {
  me(): Promise<ApiPortalMe>;
  apiKeys(): Promise<ApiPortalKey[]>;
  createApiKey(input: { label?: string } | undefined, confirmation: ApiKeyConfirmation): Promise<ApiPortalKeyCreated>;
  deleteApiKey(id: string, confirmation: ApiKeyConfirmation): Promise<{ id: string }>;
  creditHistory(): Promise<ApiCreditPayment[]>;
  checkDeposit(txHash: string): Promise<{ deposits: number }>;
  pricing(): Promise<ApiPricing>;
  funding: FundingApi;
}

export function createPortalApi(t: Transport): PortalApi {
  const data = async <T>(promise: Promise<ApiResponse<T>>): Promise<T> => (await promise).data;
  const fundingPath = (id: string) => `/v1/portal/funding/${encodeURIComponent(id)}`;
  return {
    me: () => data(t.get("/v1/portal/me")),
    apiKeys: () => data(t.get("/v1/portal/keys")),
    createApiKey: (input, confirmation) => data(t.post("/v1/portal/keys", { ...(input ?? {}), confirmation })),
    deleteApiKey: (id, confirmation) => data(t.delete(`/v1/portal/keys/${id}`, { confirmation })),
    creditHistory: () => data(t.get("/v1/portal/credits/history")),
    checkDeposit: (txHash) => data(t.post("/v1/portal/credits/check", { txHash })),
    pricing: () => t.get("/v1/pricing"),
    funding: {
      methods: () => data(t.get("/v1/portal/funding/methods")),
      create: (input) => data(t.post("/v1/portal/funding", { method: input.method, params: input.params })),
      get: (id) => data(t.get(fundingPath(id))),
      challenge: (id, payer) => data(t.post(`${fundingPath(id)}/challenge`, { payer })),
      authorize: (id, input) => data(t.post(`${fundingPath(id)}/authorize`, { payer: input.payer, signature: input.signature })),
      submit: (id, txHash) => data(t.post(`${fundingPath(id)}/submit`, { txHash })),
      cancel: (id) => data(t.post(`${fundingPath(id)}/cancel`, {})),
    },
  };
}
