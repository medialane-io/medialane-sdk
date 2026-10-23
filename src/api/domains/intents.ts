import type { Transport } from "../transport.js";
import { intentPath, type IntentKind } from "../../contract/intents.js";
import type {
  ApiCheckoutIntentResult,
  ApiIntent,
  ApiIntentCreated,
  ApiTxSyncResult,
  CreateCheckoutIntentParams,
  IntentParamsByKind,
} from "../../types/api.js";

export interface IntentsApi {
  create<K extends IntentKind>(kind: K, params: IntentParamsByKind[K], opts?: { bearer?: string }): Promise<ApiIntentCreated>;
  checkout(params: CreateCheckoutIntentParams): Promise<ApiCheckoutIntentResult[]>;
  get(id: string): Promise<ApiIntent>;
  submitSignature(id: string, signature: string[]): Promise<ApiIntent>;
  confirm(id: string, txHash: string): Promise<ApiIntent>;
  syncTransaction(txHash: string): Promise<ApiTxSyncResult>;
}

export function createIntentsApi(t: Transport): IntentsApi {
  return {
    async create(kind, params, opts) {
      const res = await t.post<{ data: ApiIntentCreated }>(intentPath(kind), params, { bearer: opts?.bearer });
      return res.data;
    },
    async checkout(params) {
      const res = await t.post<{ data: ApiCheckoutIntentResult[] }>(intentPath("checkout"), params);
      return res.data;
    },
    async get(id) {
      return (await t.get<{ data: ApiIntent }>(`/v1/intents/${id}`)).data;
    },
    async submitSignature(id, signature) {
      return (await t.patch<{ data: ApiIntent }>(`/v1/intents/${id}/signature`, { signature })).data;
    },
    async confirm(id, txHash) {
      return (await t.patch<{ data: ApiIntent }>(`/v1/intents/${id}/confirm`, { txHash })).data;
    },
    async syncTransaction(txHash) {
      return (await t.post<{ data: ApiTxSyncResult }>("/v1/tx/sync", { txHash })).data;
    },
  };
}
