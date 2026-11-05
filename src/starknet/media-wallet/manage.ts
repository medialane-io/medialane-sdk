import type { Call } from "starknet";
import type { CreateWalletManageIntentParams } from "../../types/api.js";
import { normalizeAddress } from "../../utils/address.js";
import { buildAddOwnerCall, buildRemoveOwnerByGuidCall } from "./owners.js";
import {
  buildCancelEscapeCall,
  buildCompleteEscapeOwnerCall,
  buildSetFirstGuardianCall,
  buildTriggerEscapeOwnerCall,
} from "./guardian.js";

export function buildWalletManageCall(params: CreateWalletManageIntentParams): Call {
  const owner = normalizeAddress("STARKNET", params.owner);
  const need = (value: string | undefined, name: string): string => {
    if (!value) throw new Error(`${name} is required`);
    return value;
  };
  switch (params.action) {
    case "add_owner":
      return buildAddOwnerCall(owner, need(params.pubkey, "pubkey"));
    case "remove_owner":
      return buildRemoveOwnerByGuidCall(owner, need(params.ownerGuid, "ownerGuid"));
    case "cancel_escape":
      return buildCancelEscapeCall(owner);
    case "set_first_guardian":
      return buildSetFirstGuardianCall(owner, need(params.pubkey, "pubkey"));
    case "trigger_escape":
      return buildTriggerEscapeOwnerCall(owner, need(params.newOwnerPubkey, "newOwnerPubkey"));
    case "complete_escape":
      return buildCompleteEscapeOwnerCall(owner);
  }
}
