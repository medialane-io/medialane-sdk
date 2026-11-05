import { describe, expect, test } from "bun:test";
import { resolveConfig } from "../../config.js";
import { buildIntent, canBuildIntent, resolveIntentInputs, UnknownIntentKindError, type IntentReaders } from "./build.js";

const readers: IntentReaders = {
  counterOf: async () => "0",
  royaltyCapOf: async () => "0",
  orderOf: async () => null,
};

describe("intent builder table", () => {
  test("an intent kind with no builder is refused", async () => {
    expect(canBuildIntent("comment")).toBe(false);
    expect(() => buildIntent("comment", {}, {}, resolveConfig({}))).toThrow(UnknownIntentKindError);
    await expect(resolveIntentInputs("comment", {}, readers)).rejects.toThrow(UnknownIntentKindError);
  });
});
