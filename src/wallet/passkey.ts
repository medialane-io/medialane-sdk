import {
  deriveAesKey,
  generateStarkKeyPair,
  sealPrivateKey,
  starkKeyPairFromPrivateKey,
  unsealPrivateKey,
} from "../starknet/passkey-wallet/crypto.js";
import { computeAccountAddress } from "../starknet/business-provisioning/account.js";
import type { SealedOwner } from "./types.js";

export class PasskeyCancelledError extends Error {
  constructor(message = "Passkey prompt was cancelled.") {
    super(message);
    this.name = "PasskeyCancelledError";
  }
}

export interface PasskeyConfig {
  appName: string;
  relyingPartyName: string;
  relyingPartyId: () => string;
  prfSalt: Uint8Array<ArrayBuffer>;
  hkdfInfo: Uint8Array<ArrayBuffer>;
  passkeyUser: () => Promise<PublicKeyCredentialUserEntity>;
  knownCredentials: () => PublicKeyCredentialDescriptor[];
  credentials?: CredentialsContainer;
  randomBytes?: (length: number) => Uint8Array<ArrayBuffer>;
}

export interface CreatedOwner {
  sealed: SealedOwner;
  privateKeyHex: string;
}

export interface PasskeyOwner {
  createOwnerKey(): Promise<CreatedOwner>;
  unlockOwnerKey(sealed: SealedOwner): Promise<string>;
  sealImportedOwnerKey(privateKeyInput: string): Promise<SealedOwner>;
  walletAddressForPrivateKey(privateKeyInput: string): string;
}

interface Registration {
  credentialId: string;
  prfFirst: ArrayBuffer | null;
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
    if (!api) throw new Error("Passkeys are only available in a browser.");
    return api;
  };

  const prfUnsupportedMessage = (): string => {
    const isBrave = typeof navigator !== "undefined" && "brave" in navigator;
    const cause = isBrave
      ? "Brave doesn't currently support the WebAuthn PRF extension."
      : "This browser didn't return a passkey PRF secret.";
    return (
      `${cause} ${config.appName} needs it to seal your key. Your device passkey (Touch ID) is fine, ` +
      "the limitation is the browser. Please open this in Safari or Chrome on an up-to-date OS."
    );
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
            residentKey: "required",
            userVerification: "required",
            authenticatorAttachment: "platform",
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
    return { credentialId: encodeBase64(credential.rawId), prfFirst: prf?.results?.first ?? null };
  }

  async function prfSecret(credentialId: string): Promise<Uint8Array<ArrayBuffer>> {
    let assertion: PublicKeyCredential;
    try {
      assertion = (await credentialsApi().get({
        publicKey: {
          challenge: randomBytes(32),
          rpId: config.relyingPartyId(),
          allowCredentials: [{ type: "public-key", id: decodeBase64(credentialId) }],
          userVerification: "required",
          extensions: { prf: { eval: { first: config.prfSalt } } } as AuthenticationExtensionsClientInputs,
        },
      })) as PublicKeyCredential;
    } catch (err) {
      if (isPasskeyCancellation(err)) throw new PasskeyCancelledError();
      throw err;
    }
    const result = (assertion.getClientExtensionResults() as { prf?: { results?: { first?: ArrayBuffer } } }).prf
      ?.results?.first;
    if (!result) throw new Error("Passkey PRF unavailable on this device/browser.");
    return new Uint8Array(result);
  }

  async function secretFromRegistration(registration: Registration): Promise<Uint8Array<ArrayBuffer>> {
    if (registration.prfFirst) return new Uint8Array(registration.prfFirst);
    try {
      return await prfSecret(registration.credentialId);
    } catch {
      throw new Error(prfUnsupportedMessage());
    }
  }

  async function seal(secret: Uint8Array<ArrayBuffer>, privateKeyHex: string): Promise<{ iv: string; ciphertext: string }> {
    const aes = await deriveAesKey(secret, config.hkdfInfo);
    const iv = randomBytes(12);
    const ciphertext = await sealPrivateKey(aes, iv, privateKeyHex);
    return { iv: encodeBase64(iv), ciphertext: encodeBase64(ciphertext) };
  }

  return {
    async createOwnerKey() {
      const registration = await registerPasskey();
      const secret = await secretFromRegistration(registration);
      const { privateKeyHex, publicKeyHex } = generateStarkKeyPair();
      const { iv, ciphertext } = await seal(secret, privateKeyHex);
      return {
        sealed: {
          credentialId: registration.credentialId,
          ownerPubKey: publicKeyHex,
          address: computeAccountAddress(publicKeyHex, 0),
          iv,
          ciphertext,
        },
        privateKeyHex,
      };
    },

    async unlockOwnerKey(sealed) {
      const secret = await prfSecret(sealed.credentialId);
      const aes = await deriveAesKey(secret, config.hkdfInfo);
      return unsealPrivateKey(aes, decodeBase64(sealed.iv), decodeBase64(sealed.ciphertext));
    },

    async sealImportedOwnerKey(privateKeyInput) {
      const { privateKeyHex, publicKeyHex } = starkKeyPairFromPrivateKey(privateKeyInput);
      const registration = await registerPasskey();
      const secret = await secretFromRegistration(registration);
      const { iv, ciphertext } = await seal(secret, privateKeyHex);
      return {
        credentialId: registration.credentialId,
        ownerPubKey: publicKeyHex,
        address: computeAccountAddress(publicKeyHex, 0),
        iv,
        ciphertext,
      };
    },

    walletAddressForPrivateKey(privateKeyInput) {
      return computeAccountAddress(starkKeyPairFromPrivateKey(privateKeyInput).publicKeyHex, 0);
    },
  };
}
