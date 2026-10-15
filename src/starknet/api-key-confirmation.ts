import type { TypedData } from "starknet";

export type ApiKeyAction = "replace_api_key" | "delete_api_key";

export interface ApiKeyConfirmationInput {
  action: ApiKeyAction;
  /** For `delete_api_key`, the key's id; for `replace_api_key`, the current key's id, or `none`. */
  key: string;
  /** The account's public id. */
  account: string;
  /** Unix seconds. */
  expiresAt: number;
}

/** What the account's wallet signs to approve one API key change. */
export interface ApiKeyConfirmation {
  expiresAt: number;
  signature: string[];
}

export function apiKeyConfirmationTypedData(input: ApiKeyConfirmationInput): TypedData {
  return {
    domain: { name: "Medialane", version: "1", chainId: "SN_MAIN", revision: "1" },
    primaryType: "ApiKeyConfirmation",
    types: {
      StarknetDomain: [
        { name: "name", type: "shortstring" },
        { name: "version", type: "shortstring" },
        { name: "chainId", type: "shortstring" },
        { name: "revision", type: "shortstring" },
      ],
      ApiKeyConfirmation: [
        { name: "action", type: "shortstring" },
        { name: "key", type: "string" },
        { name: "account", type: "string" },
        { name: "expiresAt", type: "timestamp" },
      ],
    },
    message: { action: input.action, key: input.key, account: input.account, expiresAt: input.expiresAt },
  };
}
