import { test, expect } from "bun:test";
import { createPasskeyOwner, PasskeyCancelledError } from "./passkey.js";

const PRF_SECRET = new Uint8Array(32).map((_, i) => (i * 7 + 3) % 256);
const IV = new Uint8Array(12).map((_, i) => (i * 11 + 5) % 256);
const PRIVATE_KEY = "0x012b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b";
const PUBLIC_KEY = "0x677874f055a89ae0c0bc8cfba7ca10828ec9b3a6757ce9d926d6446ebe91668";
const ADDRESS = "0x6958ce9523a63b831c5d3a691059affe47dfaab5124a9d7bf10f80a080b8cf";
const IO_SEALED =
  "PaOMvTir9uNzDWVRUv8aoUcY5BRp3kb3LKURbpwEzeKInDnbC/8NAQ9V2Y74XunBQsIsmcJnMavn0ZYGVX8RA/WWDrwFLPmepSCL29rbdnKmsw==";

const CREDENTIAL_ID_BYTES = Uint8Array.from([1, 2, 3, 4]);
const CREDENTIAL_ID = "AQIDBA==";

function credentialsStub(options: { prfFirst?: ArrayBuffer | null; throws?: unknown } = {}): CredentialsContainer {
  const results = options.prfFirst === undefined ? PRF_SECRET.buffer : options.prfFirst;
  const credential = {
    rawId: CREDENTIAL_ID_BYTES.buffer,
    getClientExtensionResults: () => (results ? { prf: { results: { first: results } } } : { prf: {} }),
  };
  return {
    create: async () => {
      if (options.throws) throw options.throws;
      return credential;
    },
    get: async () => {
      if (options.throws) throw options.throws;
      return credential;
    },
  } as unknown as CredentialsContainer;
}

function ownerFor(credentials: CredentialsContainer, hkdfInfo = "medialane-io-owner-key") {
  return createPasskeyOwner({
    appName: "Medialane",
    relyingPartyName: "Medialane",
    relyingPartyId: () => "www.medialane.io",
    prfSalt: new TextEncoder().encode("medialane://io/owner-key/v1"),
    hkdfInfo: new TextEncoder().encode(hkdfInfo),
    passkeyUser: async () => ({ id: Uint8Array.from([9]), name: "creator@example.com", displayName: "creator@example.com" }),
    knownCredentials: () => [],
    credentials,
    randomBytes: ((length: number) => (length === 12 ? IV : new Uint8Array(length).fill(9))) as never,
  });
}

test("an imported key seals to the bytes this app has always produced", async () => {
  const owner = ownerFor(credentialsStub());
  const sealed = await owner.sealImportedOwnerKey(PRIVATE_KEY);
  expect(sealed.ownerPubKey).toBe(PUBLIC_KEY);
  expect(sealed.address).toBe(ADDRESS);
  expect(sealed.credentialId).toBe(CREDENTIAL_ID);
  expect(sealed.ciphertext).toBe(IO_SEALED);
});

test("a sealed key unlocks back to the same key", async () => {
  const owner = ownerFor(credentialsStub());
  const sealed = await owner.sealImportedOwnerKey(PRIVATE_KEY);
  expect(await owner.unlockOwnerKey(sealed)).toBe(PRIVATE_KEY);
});

test("another app's key-derivation info cannot unlock this app's wallet", async () => {
  const owner = ownerFor(credentialsStub());
  const sealed = await owner.sealImportedOwnerKey(PRIVATE_KEY);
  const otherApp = ownerFor(credentialsStub(), "mediawallet-owner-key");
  await expect(otherApp.unlockOwnerKey(sealed)).rejects.toThrow();
});

test("a new owner key is sealed, addressed, and returned for signing", async () => {
  const owner = ownerFor(credentialsStub());
  const created = await owner.createOwnerKey();
  expect(created.sealed.address).toBe(owner.walletAddressForPrivateKey(created.privateKeyHex));
  expect(await owner.unlockOwnerKey(created.sealed)).toBe(created.privateKeyHex);
});

test("a cancelled passkey prompt is reported as cancelled, not as a failure", async () => {
  const cancelled = Object.assign(new Error("user cancelled"), { name: "NotAllowedError" });
  const owner = ownerFor(credentialsStub({ throws: cancelled }));
  await expect(owner.createOwnerKey()).rejects.toBeInstanceOf(PasskeyCancelledError);
});

test("a browser without PRF explains itself in the app's own name", async () => {
  const owner = ownerFor(credentialsStub({ prfFirst: null }));
  await expect(owner.createOwnerKey()).rejects.toThrow(/Medialane needs it to seal your key/);
});
