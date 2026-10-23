import { computeAccountAddress } from "../starknet/media-wallet/account.js";
import { test, expect } from "bun:test";
import { createPasskeyOwner, DeviceKeyMissingError, PasskeyCancelledError, PasskeyUnsupportedError } from "./passkey.js";
import type { DeviceKeyStore } from "./device-keys.js";

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
  options: {
    prfFirst?: ArrayBuffer | null;
    prfEnabled?: boolean;
    throws?: unknown;
    onCreate?: (options: CredentialCreationOptions) => void;
    onGet?: () => void;
  } = {},
): CredentialsContainer {
  const results = options.prfFirst === undefined ? PRF_SECRET.buffer : options.prfFirst;
  const prf = results ? { results: { first: results } } : {};
  const credential = {
    rawId: CREDENTIAL_ID_BYTES.buffer,
    getClientExtensionResults: () => ({ prf }),
  };
  const created = {
    rawId: CREDENTIAL_ID_BYTES.buffer,
    getClientExtensionResults: () => ({
      prf: options.prfEnabled === undefined ? prf : { ...prf, enabled: options.prfEnabled },
    }),
  };
  return {
    create: async (createOptions: CredentialCreationOptions) => {
      options.onCreate?.(createOptions);
      if (options.throws) throw options.throws;
      return created;
    },
    get: async () => {
      options.onGet?.();
      if (options.throws) throw options.throws;
      return credential;
    },
  } as unknown as CredentialsContainer;
}

function memoryDeviceKeys(): DeviceKeyStore & { keys: Map<string, CryptoKey> } {
  const keys = new Map<string, CryptoKey>();
  return {
    keys,
    save: async (id, key) => void keys.set(id, key),
    load: async (id) => keys.get(id) ?? null,
  };
}

function ownerFor(
  credentials: CredentialsContainer,
  hkdfInfo = "medialane-io-owner-key",
  deviceKeys: DeviceKeyStore = memoryDeviceKeys(),
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
    deviceKeys,
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

test("the passkey is saved on this device", async () => {
  let seen: CredentialCreationOptions | undefined;
  await ownerFor(credentialsStub({ onCreate: (o) => (seen = o) })).createOwnerKey();
  expect(seen?.publicKey?.authenticatorSelection?.authenticatorAttachment).toBe("platform");
  expect(seen?.publicKey?.authenticatorSelection?.residentKey).toBe("required");
  expect(seen?.publicKey?.authenticatorSelection?.userVerification).toBe("required");
});

test("no error message names a browser", async () => {
  const errors = [new PasskeyUnsupportedError("no-webauthn"), new PasskeyUnsupportedError("no-prf"), new DeviceKeyMissingError()];
  for (const err of errors) expect(err.message).not.toMatch(/brave|chrome|safari|firefox|edge/i);
});

test("a passkey reporting PRF disabled at creation that returns the secret on read creates the wallet key", async () => {
  const created = {
    rawId: CREDENTIAL_ID_BYTES.buffer,
    getClientExtensionResults: () => ({ prf: { enabled: false } }),
  };
  const read = {
    rawId: CREDENTIAL_ID_BYTES.buffer,
    getClientExtensionResults: () => ({ prf: { results: { first: PRF_SECRET.buffer } } }),
  };
  const credentials = { create: async () => created, get: async () => read } as unknown as CredentialsContainer;
  const result = await ownerFor(credentials).createOwnerKey();
  expect(result.sealed.credentialId).toBe(CREDENTIAL_ID);
  expect(result.sealed.lock).toBeUndefined();
});

test("a passkey that returns no PRF secret anywhere locks the key to this device", async () => {
  const store = memoryDeviceKeys();
  const owner = ownerFor(credentialsStub({ prfFirst: null, prfEnabled: false }), undefined, store);
  const created = await owner.createOwnerKey();
  expect(created.sealed.lock).toBe("device");
  expect(created.sealed.address).toBe(computeAccountAddress(created.sealed.ownerPubKey, 0));
  expect(store.keys.has(CREDENTIAL_ID)).toBe(true);
  expect(await owner.unlockOwnerKey(created.sealed)).toBe(created.privateKeyHex);
});

test("a device-locked key is read once after creation, and unlocking asks for the passkey without PRF", async () => {
  const seen: Array<CredentialRequestOptions> = [];
  const base = credentialsStub({ prfFirst: null, prfEnabled: false });
  const credentials = {
    create: base.create.bind(base),
    get: async (options: CredentialRequestOptions) => (seen.push(options), base.get(options)),
  } as unknown as CredentialsContainer;
  const owner = ownerFor(credentials);
  const created = await owner.createOwnerKey();
  expect(seen).toHaveLength(1);
  await owner.unlockOwnerKey(created.sealed);
  expect(seen).toHaveLength(2);
  expect(seen[1]?.publicKey?.extensions).toBeUndefined();
  expect(seen[1]?.publicKey?.userVerification).toBe("required");
});

test("an imported key can be locked to this device too", async () => {
  const owner = ownerFor(credentialsStub({ prfFirst: null }));
  const sealed = await owner.sealImportedOwnerKey({ walletAddress: ADDRESS, privateKey: PRIVATE_KEY });
  expect(sealed.lock).toBe("device");
  expect(sealed.address).toBe(ADDRESS);
  expect(await owner.unlockOwnerKey(sealed)).toBe(PRIVATE_KEY);
});

test("a device-locked key whose browser key is gone says so", async () => {
  const sealed = await ownerFor(credentialsStub({ prfFirst: null })).createOwnerKey();
  const err = await ownerFor(credentialsStub({ prfFirst: null }), undefined, memoryDeviceKeys())
    .unlockOwnerKey(sealed.sealed)
    .catch((e: unknown) => e);
  expect(err).toBeInstanceOf(DeviceKeyMissingError);
});

test("a cancelled passkey prompt while unlocking a device-locked key is reported as cancelled", async () => {
  const store = memoryDeviceKeys();
  const created = await ownerFor(credentialsStub({ prfFirst: null }), undefined, store).createOwnerKey();
  const cancelled = Object.assign(new Error("user cancelled"), { name: "NotAllowedError" });
  const credentials = { get: async () => { throw cancelled; } } as unknown as CredentialsContainer;
  await expect(ownerFor(credentials, undefined, store).unlockOwnerKey(created.sealed)).rejects.toBeInstanceOf(
    PasskeyCancelledError,
  );
});

test("a browser that says it cannot do PRF is still asked for a passkey, and the key is locked to the device", async () => {
  let prompted = false;
  const credentials = credentialsStub({ prfFirst: null, onCreate: () => (prompted = true) });
  const created = await ownerFor(credentials).createOwnerKey();
  expect(prompted).toBe(true);
  expect(created.sealed.lock).toBe("device");
});

test("a cancelled follow-up read creates nothing", async () => {
  let creates = 0;
  const cancelled = Object.assign(new Error("user cancelled"), { name: "NotAllowedError" });
  const base = credentialsStub({ prfFirst: null, prfEnabled: true });
  const credentials = {
    create: async (o: CredentialCreationOptions) => (creates++, base.create(o)),
    get: async () => {
      throw cancelled;
    },
  } as unknown as CredentialsContainer;
  const store = memoryDeviceKeys();
  await expect(ownerFor(credentials, undefined, store).createOwnerKey()).rejects.toBeInstanceOf(PasskeyCancelledError);
  expect(creates).toBe(1);
  expect(store.keys.size).toBe(0);
});
