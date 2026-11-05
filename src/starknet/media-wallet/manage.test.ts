import { describe, expect, test } from "bun:test";
import { buildAddOwnerCall, buildRemoveOwnerByGuidCall } from "./owners.js";
import {
  buildCancelEscapeCall,
  buildCompleteEscapeOwnerCall,
  buildSetFirstGuardianCall,
  buildTriggerEscapeOwnerCall,
} from "./guardian.js";
import { buildWalletManageCall } from "./manage.js";
import { sameCalls } from "../sponsored-checks.js";

const OWNER = "0x0abc";

describe("buildWalletManageCall", () => {
  test("each wallet action builds the call its builder makes", () => {
    const cases = [
      [buildWalletManageCall({ owner: OWNER, action: "add_owner", pubkey: "0x11" }), buildAddOwnerCall(OWNER, "0x11")],
      [buildWalletManageCall({ owner: OWNER, action: "remove_owner", ownerGuid: "0x22" }), buildRemoveOwnerByGuidCall(OWNER, "0x22")],
      [buildWalletManageCall({ owner: OWNER, action: "cancel_escape" }), buildCancelEscapeCall(OWNER)],
      [buildWalletManageCall({ owner: OWNER, action: "set_first_guardian", pubkey: "0x33" }), buildSetFirstGuardianCall(OWNER, "0x33")],
      [buildWalletManageCall({ owner: OWNER, action: "trigger_escape", newOwnerPubkey: "0x44" }), buildTriggerEscapeOwnerCall(OWNER, "0x44")],
      [buildWalletManageCall({ owner: OWNER, action: "complete_escape" }), buildCompleteEscapeOwnerCall(OWNER)],
    ] as const;
    for (const [built, expected] of cases) expect(sameCalls([built], [expected])).toBe(true);
  });

  test("a wallet action missing its key is refused", () => {
    expect(() => buildWalletManageCall({ owner: OWNER, action: "add_owner" })).toThrow(/pubkey is required/);
    expect(() => buildWalletManageCall({ owner: OWNER, action: "remove_owner" })).toThrow(/ownerGuid is required/);
    expect(() => buildWalletManageCall({ owner: OWNER, action: "trigger_escape" })).toThrow(/newOwnerPubkey is required/);
  });
});
