import { test, expect } from "bun:test";
import { computeOwnerGuid, buildAddOwnerCall, buildRemoveOwnerCall, buildRemoveOwnerByGuidCall } from "./owners.js";

const PUBKEY = "0x151c1fe8a4c7edba2dab3e168c4ab4638c606b5f6a14bdfdbd68c7f3241ac5";
const EXPECTED_GUID = "0x77e51695557ad11adcf5c962434b1c1feac94fa3f5cd6534759c5ae78518766";

test("computeOwnerGuid matches the contract's poseidon_2(\"Starknet Signer\", pubkey)", () => {
  expect(computeOwnerGuid(PUBKEY)).toBe(EXPECTED_GUID);
});

test("adding an owner keeps Option::None, since the signer is not being removed", () => {
  const call = buildAddOwnerCall("0xaccount", "0x999");
  expect(call.calldata[call.calldata.length - 1]).toBe("0x1");
});

test("adding an owner without removing one omits the remove list", () => {
  const call = buildAddOwnerCall("0xaccount", "0x999");
  expect(call.entrypoint).toBe("change_owners");
  expect(call.calldata).toEqual(["0x0", "0x1", "0x0", "0x999", "0x1"]);
});

test("removing by guid passes the guid through without re-hashing it", () => {
  const call = buildRemoveOwnerByGuidCall("0xaccount", EXPECTED_GUID);
  expect(call.calldata).toEqual(["0x1", EXPECTED_GUID, "0x0", "0x1"]);
});

test("removing by pubkey and by its guid produce identical calldata", () => {
  expect(buildRemoveOwnerByGuidCall("0xa", computeOwnerGuid(PUBKEY)).calldata).toEqual(
    buildRemoveOwnerCall("0xa", PUBKEY).calldata,
  );
});
