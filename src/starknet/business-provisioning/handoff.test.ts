import { test, expect } from "bun:test";
import { computeOwnerGuid, buildChangeOwnersCall, buildAddOwnerCall, buildRemoveOwnerCall, buildRemoveOwnerByGuidCall, ownerAliveTypedData } from "./handoff.js";

const PUBKEY = "0x151c1fe8a4c7edba2dab3e168c4ab4638c606b5f6a14bdfdbd68c7f3241ac5";
const EXPECTED_GUID = "0x77e51695557ad11adcf5c962434b1c1feac94fa3f5cd6534759c5ae78518766";

test("computeOwnerGuid matches the contract's poseidon_2(\"Starknet Signer\", pubkey)", () => {
  expect(computeOwnerGuid(PUBKEY)).toBe(EXPECTED_GUID);
});

test("buildChangeOwnersCall encodes remove-one-add-one with the owner-alive proof", () => {
  const call = buildChangeOwnersCall("0xaccount", PUBKEY, "0x999", {
    newOwnerPubkey: "0x999",
    signature: ["0x11", "0x22"],
    expiration: 1100,
  });
  expect(call.contractAddress).toBe("0xaccount");
  expect(call.entrypoint).toBe("change_owners");
  expect(call.calldata).toEqual([
    "0x1", EXPECTED_GUID, "0x1", "0x0", "0x999", "0x0", "0x0", "0x999", "0x11", "0x22", "0x44c",
  ]);
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

test("a handoff without owner-alive is refused rather than built", () => {
  expect(() => buildChangeOwnersCall("0xaccount", PUBKEY, "0x999")).toThrow(
    /owner-alive/i,
  );
});

test("owner-alive serialises as Some, the starknet signature, then the expiry", () => {
  const call = buildChangeOwnersCall("0xaccount", PUBKEY, "0x999", {
    newOwnerPubkey: "0x999",
    signature: ["0x11", "0x22"],
    expiration: 1100,
  });
  expect(call.calldata.slice(-6)).toEqual(["0x0", "0x0", "0x999", "0x11", "0x22", "0x44c"]);
});

test("the owner-alive typed data names the incoming owner's guid", () => {
  const td = ownerAliveTypedData(computeOwnerGuid("0x999"), 1100, "0x534e5f4d41494e");
  expect(td.primaryType).toBe("Owner Alive");
  expect((td.message as Record<string, unknown>)["Owner GUID"]).toBe(computeOwnerGuid("0x999"));
});
