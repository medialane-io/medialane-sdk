import {
  deriveAesKey,
  generateDeviceKey,
  generateStarkKeyPair,
  sealPrivateKey,
  starkKeyPairFromPrivateKey,
  unsealPrivateKey,
} from "../starknet/passkey-wallet/crypto.js";
import { computeAccountAddress } from "../starknet/media-wallet/account.js";
import type { SealedOwner } from "./types.js";
import type { RecoveryKey } from "./recovery-key.js";
import { indexedDbDeviceKeys, type DeviceKeyStore } from "./device-keys.js";
import { PasskeyCancelledError, DeviceKeyMissingError, PasskeyUnsupportedError, type PasskeyUnsupportedReason } from "./passkey-errors.js";

export { PasskeyCancelledError, DeviceKeyMissingError, PasskeyUnsupportedError, type PasskeyUnsupportedReason };

export interface PasskeyConfig {
  appName: string;
  relyingPartyName: string;
  relyingPartyId: () => string;
  prfSalt: Uint8Array<ArrayBuffer>;
  hkdfInfo: Uint8Array<ArrayBuffer>;
  passkeyUser: () => Promise<PublicKeyCredentialUserEntity>;
  knownCredentials: () => PublicKeyCredentialDescriptor[];
  credentials?: CredentialsContainer;
  deviceKeys?: DeviceKeyStore;
  randomBytes?: (length: number) => Uint8Array<ArrayBuffer>;
}

export interface CreatedOwner {
  sealed: SealedOwner;
  privateKeyHex: string;
}

export interface PasskeyOwner {
  createOwnerKey(): Promise<CreatedOwner>;
  unlockOwnerKey(sealed: SealedOwner): Promise<string>;
  sealImportedOwnerKey(recovery: RecoveryKey): Promise<SealedOwner>;
}

interface Registration {
  credentialId: string;
  prfFirst: ArrayBuffer | null;
}

interface OwnerLock {
  aes: CryptoKey;
  lock?: "device";
}

const encodeBase64 = (buf: ArrayBuffer | Uint8Array): string => {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
};

const decodeBase64 = (value: string): Uint8Array<ArrayBuffer> => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

function isPasskeyCancellation(err: unknown): boolean {
  const name = (err as { name?: string } | null)?.name;
  return name === "NotAllowedError" || name === "AbortError";
}

export function createPasskeyOwner(config: PasskeyConfig): PasskeyOwner {
  const randomBytes: (length: number) => Uint8Array<ArrayBuffer> =
    config.randomBytes ?? ((length: number) => crypto.getRandomValues(new Uint8Array(length)));
  const credentialsApi = (): CredentialsContainer => {
    const api = config.credentials ?? (typeof navigator === "undefined" ? undefined : navigator.credentials);
    if (!api) throw new PasskeyUnsupportedError("no-webauthn");
    return api;
  };

  async function registerPasskey(): Promise<Registration> {
    let credential: PublicKeyCredential;
    try {
      credential = (await credentialsApi().create({
        publicKey: {
          challenge: randomBytes(32),
          rp: { name: config.relyingPartyName, id: config.relyingPartyId() },
          user: await config.passkeyUser(),
          excludeCredentials: config.knownCredentials(),
          pubKeyCredParams: [
            { type: "public-key", alg: -7 },
            { type: "public-key", alg: -257 },
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            residentKey: "required",
            userVerification: "required",
          },
          extensions: { prf: { eval: { first: config.prfSalt } } } as AuthenticationExtensionsClientInputs,
        },
      })) as PublicKeyCredential;
    } catch (err) {
      if (isPasskeyCancellation(err)) throw new PasskeyCancelledError();
      throw err;
    }
    const prf = (
      credential.getClientExtensionResults() as {
        prf?: { enabled?: boolean; results?: { first?: ArrayBuffer } };
      }
    ).prf;
    return {
      credentialId: encodeBase64(credential.rawId),
      prfFirst: prf?.results?.first ?? null,
    };
  }

  async function assertPasskey(
    credentialId: string,
    extensions?: AuthenticationExtensionsClientInputs,
  ): Promise<PublicKeyCredential> {
    try {
      return (await credentialsApi().get({
        publicKey: {
          challenge: randomBytes(32),
          rpId: config.relyingPartyId(),
          allowCredentials: [{ type: "public-key", id: decodeBase64(credentialId) }],
          userVerification: "required",
          ...(extensions ? { extensions } : {}),
        },
      })) as PublicKeyCredential;
    } catch (err) {
      if (isPasskeyCancellation(err)) throw new PasskeyCancelledError();
      throw err;
    }
  }

  async function prfSecret(credentialId: string): Promise<Uint8Array<ArrayBuffer>> {
    const assertion = await assertPasskey(credentialId, {
      prf: { eval: { first: config.prfSalt } },
    } as AuthenticationExtensionsClientInputs);
    const result = (assertion.getClientExtensionResults() as { prf?: { results?: { first?: ArrayBuffer } } }).prf
      ?.results?.first;
    if (!result) throw new PasskeyUnsupportedError("no-prf");
    return new Uint8Array(result);
  }

  const deviceKeys = config.deviceKeys ?? indexedDbDeviceKeys;

  async function lockFor(registration: Registration): Promise<OwnerLock> {
    if (registration.prfFirst) {
      return { aes: await deriveAesKey(new Uint8Array(registration.prfFirst), config.hkdfInfo) };
    }
    try {
      return { aes: await deriveAesKey(await prfSecret(registration.credentialId), config.hkdfInfo) };
    } catch (err) {
      if (!(err instanceof PasskeyUnsupportedError) || err.reason !== "no-prf") throw err;
    }
    const aes = await generateDeviceKey();
    await deviceKeys.save(registration.credentialId, aes);
    return { aes, lock: "device" };
  }

  async function unlockFor(sealed: SealedOwner): Promise<CryptoKey> {
    if (sealed.lock !== "device") return deriveAesKey(await prfSecret(sealed.credentialId), config.hkdfInfo);
    await assertPasskey(sealed.credentialId);
    const aes = await deviceKeys.load(sealed.credentialId);
    if (!aes) throw new DeviceKeyMissingError();
    return aes;
  }

  async function seal(aes: CryptoKey, privateKeyHex: string): Promise<{ iv: string; ciphertext: string }> {
    const iv = randomBytes(12);
    const ciphertext = await sealPrivateKey(aes, iv, privateKeyHex);
    return { iv: encodeBase64(iv), ciphertext: encodeBase64(ciphertext) };
  }

  return {
    async createOwnerKey() {
      const registration = await registerPasskey();
      const { aes, lock } = await lockFor(registration);
      const { privateKeyHex, publicKeyHex } = generateStarkKeyPair();
      const { iv, ciphertext } = await seal(aes, privateKeyHex);
      return {
        sealed: {
          credentialId: registration.credentialId,
          ownerPubKey: publicKeyHex,
          address: computeAccountAddress(publicKeyHex, 0),
          iv,
          ciphertext,
          ...(lock ? { lock } : {}),
        },
        privateKeyHex,
      };
    },

    async unlockOwnerKey(sealed) {
      const aes = await unlockFor(sealed);
      return unsealPrivateKey(aes, decodeBase64(sealed.iv), decodeBase64(sealed.ciphertext));
    },

    async sealImportedOwnerKey(recovery) {
      const { privateKeyHex, publicKeyHex } = starkKeyPairFromPrivateKey(recovery.privateKey);
      const registration = await registerPasskey();
      const { aes, lock } = await lockFor(registration);
      const { iv, ciphertext } = await seal(aes, privateKeyHex);
      return {
        credentialId: registration.credentialId,
        ownerPubKey: publicKeyHex,
        address: recovery.walletAddress,
        iv,
        ciphertext,
        ...(lock ? { lock } : {}),
      };
    },
  };
}
