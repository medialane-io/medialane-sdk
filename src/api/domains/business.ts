import type { z } from "zod";
import type { Transport } from "../transport.js";
import type * as provisioning from "../../contract/provisioning.js";
import type { ApiBusinessProvisioning, ApiEmissionResult, ApiResponse, EmissionParams } from "../../types/api.js";

export type ProvisioningResult = ApiResponse<ApiBusinessProvisioning> & { reusedExistingWallet?: boolean };

export interface BusinessApi {
  emit(params: EmissionParams): Promise<ApiEmissionResult>;
  registerProvisioning(params: z.input<typeof provisioning.provisioningRegisterSchema>): Promise<ProvisioningResult>;
}

export function createBusinessApi(t: Transport): BusinessApi {
  return {
    async emit(params) {
      return (await t.post<ApiResponse<ApiEmissionResult>>("/v1/business/issuance/emission", params)).data;
    },
    registerProvisioning(params) {
      return t.post("/v1/business/provisioning", { chain: params.chain ?? "STARKNET", email: params.email });
    },
  };
}
