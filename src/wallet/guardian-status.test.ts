import { test, expect } from "bun:test";
import type { GuardianInfo, EscapeInfo } from "../starknet/business-provisioning/guardian.js";
import { describeGuardianStatus, describeRecoveryAction } from "./guardian-status.js";

const GUARDIAN: GuardianInfo = { type: "Starknet", guid: "0xguid", storedValue: "0xabc123" };

test("no guardians configured", () => {
  expect(describeGuardianStatus([])).toEqual({ kind: "none" });
});

test("one guardian active", () => {
  expect(describeGuardianStatus([GUARDIAN])).toEqual({ kind: "active", guardian: GUARDIAN });
});

test("no escape in progress", () => {
  expect(describeRecoveryAction({ readyAt: 0, escapeType: "None", status: "None" } as EscapeInfo)).toBe("none");
});

test("an owner escape that is not ready yet waits", () => {
  const escape = { readyAt: Date.now() / 1000 + 86400, escapeType: "Owner", status: "NotReady" } as EscapeInfo;
  expect(describeRecoveryAction(escape)).toBe("none");
});

test("a ready owner escape can be completed", () => {
  expect(describeRecoveryAction({ readyAt: 0, escapeType: "Owner", status: "Ready" } as EscapeInfo)).toBe("complete");
});

test("an expired owner escape can be started again", () => {
  expect(describeRecoveryAction({ readyAt: 0, escapeType: "Owner", status: "Expired" } as EscapeInfo)).toBe("start");
});

test("a guardian-type escape is not an owner recovery", () => {
  expect(describeRecoveryAction({ readyAt: 0, escapeType: "Guardian", status: "Ready" } as EscapeInfo)).toBe("none");
});
