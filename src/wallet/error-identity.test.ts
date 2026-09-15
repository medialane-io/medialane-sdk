import { test, expect } from "bun:test";
import { InvalidStarkPrivateKeyError } from "../starknet/index.js";
import { createPasskeyOwner } from "./passkey.js";

const owner = createPasskeyOwner({
  appName: "Medialane",
  relyingPartyName: "Medialane",
  relyingPartyId: () => "www.medialane.io",
  prfSalt: new TextEncoder().encode("salt") as Uint8Array<ArrayBuffer>,
  hkdfInfo: new TextEncoder().encode("info") as Uint8Array<ArrayBuffer>,
  passkeyUser: async () => ({ id: Uint8Array.from([1]), name: "a", displayName: "a" }),
  knownCredentials: () => [],
});

test("a refused recovery key is the same error class the entry exports", () => {
  for (const bad of ["", "0x", "0x0", "nonsense", "0xzz", "0x" + "f".repeat(64)]) {
    expect(() => owner.walletAddressForPrivateKey(bad)).toThrow(InvalidStarkPrivateKeyError);
  }
});

test("a valid key still yields an address", () => {
  expect(owner.walletAddressForPrivateKey("0x01" + "2b".repeat(31))).toBe(
    "0x6958ce9523a63b831c5d3a691059affe47dfaab5124a9d7bf10f80a080b8cf",
  );
});
