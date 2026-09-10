import { test, expect } from "bun:test";
import { computeOwnerGuid, buildChangeOwnersCall, buildAddOwnerCall } from "./handoff.js";

const PUBKEY = "0x151c1fe8a4c7edba2dab3e168c4ab4638c606b5f6a14bdfdbd68c7f3241ac5";
const EXPECTED_GUID = "0x77e51695557ad11adcf5c962434b1c1feac94fa3f5cd6534759c5ae78518766";

test("computeOwnerGuid matches the contract's poseidon_2(\"Starknet Signer\", pubkey)", () => {
  expect(computeOwnerGuid(PUBKEY)).toBe(EXPECTED_GUID);
});

test("buildChangeOwnersCall encodes remove-one-add-one as [1, guid, 1, 0, newPubkey]", () => {
  const call = buildChangeOwnersCall("0xaccount", PUBKEY, "0x999");
  expect(call.contractAddress).toBe("0xaccount");
  expect(call.entrypoint).toBe("change_owners");
  expect(call.calldata).toEqual(["0x1", EXPECTED_GUID, "0x1", "0x0", "0x999", "0x1"]);
});

test("change_owners calldata ends with Option::None for owner_alive_signature", () => {
  const call = buildChangeOwnersCall("0xaccount", PUBKEY, "0x999");
  expect(call.calldata[call.calldata.length - 1]).toBe("0x1");
});

test("adding an owner without removing one omits the remove list", () => {
  const call = buildAddOwnerCall("0xaccount", "0x999");
  expect(call.entrypoint).toBe("change_owners");
  expect(call.calldata).toEqual(["0x0", "0x1", "0x0", "0x999", "0x1"]);
});
