import { test, expect } from "bun:test";
import {
  buildSetFirstGuardianCall,
  buildTriggerEscapeOwnerCall,
  buildCompleteEscapeOwnerCall,
  buildCancelEscapeCall,
  decodeGuardiansInfo,
  decodeEscapeAndStatus,
} from "./guardian.js";
import { normalizeAddress } from "../../utils/address.js";

const norm = (a: string) => normalizeAddress("STARKNET", a);
const PUBKEY = "0x61cc05c5da6e9b1403a27ffa564498cd2b8cda1428b053b08dbbd1cceb744c6";
const PUBKEY_DECIMAL = BigInt(PUBKEY).toString();

test("buildSetFirstGuardianCall: change_guardians([], [Signer::Starknet(pubkey)])", () => {
  const call = buildSetFirstGuardianCall("0xfeed", PUBKEY);
  expect(call.contractAddress).toBe(norm("0xfeed"));
  expect(call.entrypoint).toBe("change_guardians");
  expect((call.calldata as string[]).map((f) => BigInt(f).toString())).toEqual([
    "0", "1", "0", PUBKEY_DECIMAL,
  ]);
});

test("buildTriggerEscapeOwnerCall: trigger_escape_owner(Signer::Starknet(pubkey))", () => {
  const call = buildTriggerEscapeOwnerCall("0xdead", PUBKEY);
  expect(call.contractAddress).toBe(norm("0xdead"));
  expect(call.entrypoint).toBe("trigger_escape_owner");
  expect((call.calldata as string[]).map((f) => BigInt(f).toString())).toEqual([
    "0", PUBKEY_DECIMAL,
  ]);
});

test("buildCompleteEscapeOwnerCall: escape_owner(), no calldata", () => {
  const call = buildCompleteEscapeOwnerCall("0xbeef");
  expect(call.contractAddress).toBe(norm("0xbeef"));
  expect(call.entrypoint).toBe("escape_owner");
  expect(call.calldata).toEqual([]);
});

test("buildCancelEscapeCall: cancel_escape(), no calldata", () => {
  const call = buildCancelEscapeCall("0xc0de");
  expect(call.contractAddress).toBe(norm("0xc0de"));
  expect(call.entrypoint).toBe("cancel_escape");
  expect(call.calldata).toEqual([]);
});

test("decodeGuardiansInfo: empty set", () => {
  expect(decodeGuardiansInfo(["0x0"])).toEqual([]);
});

test("decodeGuardiansInfo: one Starknet-type guardian", () => {
  const guid = "0x123";
  expect(decodeGuardiansInfo(["0x1", "0x0", guid, PUBKEY])).toEqual([
    { type: "Starknet", guid, storedValue: PUBKEY },
  ]);
});

test("decodeGuardiansInfo: two guardians of different types", () => {
  const res = ["0x2", "0x0", "0xaaa", "0xbbb", "0x1", "0xccc", "0xddd"];
  expect(decodeGuardiansInfo(res)).toEqual([
    { type: "Starknet", guid: "0xaaa", storedValue: "0xbbb" },
    { type: "Secp256k1", guid: "0xccc", storedValue: "0xddd" },
  ]);
});

test("decodeEscapeAndStatus: no escape in progress (Option::None)", () => {
  expect(decodeEscapeAndStatus(["0x0", "0x0", "0x1", "0x0"])).toEqual({
    readyAt: 0, escapeType: "None", status: "None",
  });
});

test("decodeEscapeAndStatus: owner escape in progress, not ready (Option::Some)", () => {
  const readyAt = 1800000000;
  const res = [`0x${readyAt.toString(16)}`, "0x2", "0x0", PUBKEY, "0x0", "0x1"];
  expect(decodeEscapeAndStatus(res)).toEqual({ readyAt, escapeType: "Owner", status: "NotReady" });
});

test("decodeEscapeAndStatus: guardian escape ready to complete", () => {
  const res = ["0x0", "0x1", "0x1", "0x2"];
  expect(decodeEscapeAndStatus(res)).toEqual({ readyAt: 0, escapeType: "Guardian", status: "Ready" });
});

test("getGuardians calls get_guardians_info on the given provider", async () => {
  const { getGuardians } = await import("./guardian.js");
  const calls: unknown[] = [];
  const provider = { callContract: async (req: unknown) => { calls.push(req); return ["0x0"]; } };
  const result = await getGuardians(provider as never, "0xfeed");
  expect(result).toEqual([]);
  expect(calls).toEqual([
    { contractAddress: norm("0xfeed"), entrypoint: "get_guardians_info", calldata: [] },
  ]);
});
