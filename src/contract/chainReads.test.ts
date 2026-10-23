import { test, expect } from "bun:test";
import type { z } from "zod";
import {
  apiErrorBodySchema,
  creatorCoinGuaranteesSchema,
  dropStateFromWire,
  dropStateToWire,
  dropStateWireSchema,
  ipNftTokenDataSchema,
  popClaimInfoSchema,
  tierOnchainSchema,
} from "./chainReads.js";
import type { ApiIpNftTokenData, ApiTierOnchain } from "../types/api.js";
import type { PopClaimInfo } from "../starknet/pop-claim.js";
import type { CreatorCoinGuarantees } from "../starknet/services/creatorCoin.js";
import type { DropOnchain } from "../starknet/drop-state.js";

type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
const same = <A, B>(_value: Same<A, B>) => {};

test("the schemas describe the same shapes as the SDK types", () => {
  same<z.output<typeof tierOnchainSchema>, ApiTierOnchain>(true);
  same<z.output<typeof ipNftTokenDataSchema>, ApiIpNftTokenData>(true);
  same<z.output<typeof popClaimInfoSchema>, PopClaimInfo>(true);
  same<z.output<typeof creatorCoinGuaranteesSchema>, CreatorCoinGuarantees>(true);
  same<ReturnType<typeof dropStateFromWire>, DropOnchain>(true);
  expect(true).toBe(true);
});

test("drop state amounts cross the wire as decimal strings and come back as bigint", () => {
  const state: DropOnchain = {
    organizer: "0x1",
    startTime: 0,
    endTime: 9,
    price: 2n ** 70n,
    paymentToken: "0x2",
    maxPerWallet: 3n,
    allowlistRoot: "0x0",
    maxSupply: 0n,
    totalMinted: 5n,
  };
  const wire = dropStateWireSchema.parse(dropStateToWire(state));
  expect(wire.price).toBe((2n ** 70n).toString());
  expect(dropStateFromWire(wire)).toEqual(state);
});

test("a drop state with a non-numeric amount is rejected", () => {
  expect(dropStateWireSchema.safeParse({ organizer: "0x1", startTime: 0, endTime: 0, price: "1.5", paymentToken: "0x2", maxPerWallet: "0", allowlistRoot: "0x0", maxSupply: "0", totalMinted: "0" }).success).toBe(false);
});

test("an error body carries a message and an optional machine code", () => {
  expect(apiErrorBodySchema.parse({ error: "no credits", code: "credits_exhausted" })).toEqual({ error: "no credits", code: "credits_exhausted" });
  expect(apiErrorBodySchema.parse({ error: "bad" })).toEqual({ error: "bad" });
  expect(apiErrorBodySchema.safeParse({ code: "x" }).success).toBe(false);
});
