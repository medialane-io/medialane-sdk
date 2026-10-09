import { computeAccountAddress } from "../starknet/media-wallet/account.js";
import { test, expect } from "bun:test";
import { createPasskeyOwner, PasskeyCancelledError, PasskeyUnsupportedError } from "./passkey.js";

const PRF_SECRET = new Uint8Array(32).map((_, i) => (i * 7 + 3) % 256);
const IV = new Uint8Array(12).map((_, i) => (i * 11 + 5) % 256);
const PRIVATE_KEY = "0x012b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b";
const PUBLIC_KEY = "0x677874f055a89ae0c0bc8cfba7ca10828ec9b3a6757ce9d926d6446ebe91668";
const ADDRESS = "0x6958ce9523a63b831c5d3a691059affe47dfaab5124a9d7bf10f80a080b8cf";
const IO_SEALED =
  "PaOMvTir9uNzDWVRUv8aoUcY5BRp3kb3LKURbpwEzeKInDnbC/8NAQ9V2Y74XunBQsIsmcJnMavn0ZYGVX8RA/WWDrwFLPmepSCL29rbdnKmsw==";

const CREDENTIAL_ID_BYTES = Uint8Array.from([1, 2, 3, 4]);
const CREDENTIAL_ID = "AQIDBA==";

function credentialsStub(
  options: { prfFirst?: ArrayBuffer | null; throws?: unknown; onCreate?: (options: CredentialCreationOptions) => void } = {},
): CredentialsContainer {
  const results = options.prfFirst === undefined ? PRF_SECRET.buffer : options.prfFirst;
  const credential = {
    rawId: CREDENTIAL_ID_BYTES.buffer,
    getClientExtensionResults: () => (results ? { prf: { results: { first: results } } } : { prf: {} }),
  };
  return {
    create: async (createOptions: CredentialCreationOptions) => {
      options.onCreate?.(createOptions);
      if (options.throws) throw options.throws;
      return credential;
    },
    get: async () => {
      if (options.throws) throw options.throws;
      return credential;
    },
  } as unknown as CredentialsContainer;
}

function ownerFor(
  credentials: CredentialsContainer,
  hkdfInfo = "medialane-io-owner-key",
  clientCapabilities?: () => Promise<Record<string, boolean | undefined>>,
) {
  return createPasskeyOwner({
    appName: "Medialane",
    relyingPartyName: "Medialane",
    relyingPartyId: () => "www.medialane.io",
    prfSalt: new TextEncoder().encode("medialane://io/owner-key/v1"),
    hkdfInfo: new TextEncoder().encode(hkdfInfo),
    passkeyUser: async () => ({ id: Uint8Array.from([9]), name: "creator@example.com", displayName: "creator@example.com" }),
    knownCredentials: () => [],
    credentials,
    clientCapabilities,
    randomBytes: ((length: number) => (length === 12 ? IV : new Uint8Array(length).fill(9))) as never,
  });
}

test("an imported key seals to the bytes this app has always produced", async () => {
  const owner = ownerFor(credentialsStub());
  const sealed = await owner.sealImportedOwnerKey({ walletAddress: ADDRESS, privateKey: PRIVATE_KEY });
  expect(sealed.ownerPubKey).toBe(PUBLIC_KEY);
  expect(sealed.address).toBe(ADDRESS);
  expect(sealed.credentialId).toBe(CREDENTIAL_ID);
  expect(sealed.ciphertext).toBe(IO_SEALED);
});

test("an imported key is sealed for the wallet its recovery key names", async () => {
  const owner = ownerFor(credentialsStub());
  const wallet = "0x071c174b93d24b72fc4b25e1d28fce1267e30c4c57fa4b0980a403a97fa84f5f";
  const sealed = await owner.sealImportedOwnerKey({ walletAddress: wallet, privateKey: PRIVATE_KEY });
  expect(sealed.address).toBe(wallet);
  expect(sealed.ownerPubKey).toBe(PUBLIC_KEY);
});

test("a sealed key unlocks back to the same key", async () => {
  const owner = ownerFor(credentialsStub());
  const sealed = await owner.sealImportedOwnerKey({ walletAddress: ADDRESS, privateKey: PRIVATE_KEY });
  expect(await owner.unlockOwnerKey(sealed)).toBe(PRIVATE_KEY);
});

test("another app's key-derivation info cannot unlock this app's wallet", async () => {
  const owner = ownerFor(credentialsStub());
  const sealed = await owner.sealImportedOwnerKey({ walletAddress: ADDRESS, privateKey: PRIVATE_KEY });
  const otherApp = ownerFor(credentialsStub(), "mediawallet-owner-key");
  await expect(otherApp.unlockOwnerKey(sealed)).rejects.toThrow();
});

test("a new owner key is sealed, addressed, and returned for signing", async () => {
  const owner = ownerFor(credentialsStub());
  const created = await owner.createOwnerKey();
  expect(created.sealed.address).toBe(computeAccountAddress(created.sealed.ownerPubKey, 0));
  expect(await owner.unlockOwnerKey(created.sealed)).toBe(created.privateKeyHex);
});

test("a cancelled passkey prompt is reported as cancelled, not as a failure", async () => {
  const cancelled = Object.assign(new Error("user cancelled"), { name: "NotAllowedError" });
  const owner = ownerFor(credentialsStub({ throws: cancelled }));
  await expect(owner.createOwnerKey()).rejects.toBeInstanceOf(PasskeyCancelledError);
});

test("a passkey that returns no PRF secret is reported as unsupported, with no-prf", async () => {
  const owner = ownerFor(credentialsStub({ prfFirst: null }));
  const err = await owner.createOwnerKey().catch((e: unknown) => e);
  expect(err).toBeInstanceOf(PasskeyUnsupportedError);
  expect((err as PasskeyUnsupportedError).reason).toBe("no-prf");
});

test("unlocking with a passkey that returns no PRF secret is reported as no-prf", async () => {
  const sealed = await ownerFor(credentialsStub()).sealImportedOwnerKey({ walletAddress: ADDRESS, privateKey: PRIVATE_KEY });
  const err = await ownerFor(credentialsStub({ prfFirst: null })).unlockOwnerKey(sealed).catch((e: unknown) => e);
  expect(err).toBeInstanceOf(PasskeyUnsupportedError);
  expect((err as PasskeyUnsupportedError).reason).toBe("no-prf");
});

test("without a credentials API the failure is no-webauthn", async () => {
  const owner = createPasskeyOwner({
    appName: "Medialane",
    relyingPartyName: "Medialane",
    relyingPartyId: () => "www.medialane.io",
    prfSalt: new Uint8Array(1),
    hkdfInfo: new Uint8Array(1),
    passkeyUser: async () => ({ id: Uint8Array.from([9]), name: "a", displayName: "a" }),
    knownCredentials: () => [],
  });
  const original = globalThis.navigator;
  Object.defineProperty(globalThis, "navigator", { value: undefined, configurable: true });
  try {
    const err = await owner.createOwnerKey().catch((e: unknown) => e);
    expect(err).toBeInstanceOf(PasskeyUnsupportedError);
    expect((err as PasskeyUnsupportedError).reason).toBe("no-webauthn");
  } finally {
    Object.defineProperty(globalThis, "navigator", { value: original, configurable: true });
  }
});

test("a passkey can be saved anywhere that supports PRF, not only on this device", async () => {
  let seen: CredentialCreationOptions | undefined;
  await ownerFor(credentialsStub({ onCreate: (o) => (seen = o) })).createOwnerKey();
  expect(seen?.publicKey?.authenticatorSelection?.authenticatorAttachment).toBeUndefined();
  expect(seen?.publicKey?.authenticatorSelection?.residentKey).toBe("required");
  expect(seen?.publicKey?.authenticatorSelection?.userVerification).toBe("required");
});

test("no error message names a browser", async () => {
  const errors = [
    await ownerFor(credentialsStub({ prfFirst: null })).createOwnerKey().catch((e: unknown) => e),
    new PasskeyUnsupportedError("no-webauthn"),
  ];
  for (const err of errors) expect((err as Error).message).not.toMatch(/brave|chrome|safari|firefox|edge/i);
});

test("a browser that says it can't do PRF is refused before any passkey prompt", async () => {
  let prompted = false;
  const credentials = credentialsStub({ onCreate: () => (prompted = true) });
  const owner = ownerFor(credentials, undefined, async () => ({ "extension:prf": false }));
  const err = await owner.createOwnerKey().catch((e: unknown) => e);
  expect(err).toBeInstanceOf(PasskeyUnsupportedError);
  expect((err as PasskeyUnsupportedError).reason).toBe("no-prf");
  expect(prompted).toBe(false);
});

test("a browser that is unsure, or can't answer, still gets the passkey prompt", async () => {
  for (const caps of [async () => ({ "extension:prf": true }), async () => ({}), async () => Promise.reject(new Error("boom"))]) {
    const created = await ownerFor(credentialsStub(), undefined, caps).createOwnerKey();
    expect(created.sealed.credentialId).toBe(CREDENTIAL_ID);
  }
});
