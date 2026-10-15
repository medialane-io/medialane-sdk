import { expect, test } from "bun:test";
import { apiKeyConfirmationTypedData } from "./api-key-confirmation.js";

const input = { action: "replace_api_key", key: "none", account: "acc_ABC123", expiresAt: 1_700_000_300 } as const;

test("the message names the action, the key it changes, the account and the expiry", () => {
  const typed = apiKeyConfirmationTypedData(input);
  expect(typed.primaryType).toBe("ApiKeyConfirmation");
  expect(typed.message).toEqual({ action: "replace_api_key", key: "none", account: "acc_ABC123", expiresAt: 1_700_000_300 });
  expect(typed.domain).toMatchObject({ name: "Medialane", chainId: "SN_MAIN", revision: "1" });
});

test("a confirmation is never the same message type as a wallet sign-in", () => {
  expect(apiKeyConfirmationTypedData(input).types).not.toHaveProperty("SiwsMessage");
});

test("the same input always gives the same message, so both sides build it identically", () => {
  expect(apiKeyConfirmationTypedData(input)).toEqual(apiKeyConfirmationTypedData({ ...input }));
  expect(apiKeyConfirmationTypedData({ ...input, action: "delete_api_key", key: "k1" }).message).toMatchObject({ action: "delete_api_key", key: "k1" });
});
