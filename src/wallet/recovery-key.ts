import { typedData, type TypedData } from "starknet";
import { computeAccountAddress } from "../starknet/media-wallet/account.js";
import { signWithPrivateKey, starkKeyPairFromPrivateKey } from "../starknet/passkey-wallet/crypto.js";
import { normalizeSiwsSignature } from "../starknet/siws/client.js";

const PREFIX = "medialane-recovery:v1:";
const ADDRESS = /^0x[0-9a-fA-F]{1,64}$/;

export class InvalidRecoveryKeyError extends Error {
  constructor(message = "This is not a valid recovery key.") {
    super(message);
    this.name = "InvalidRecoveryKeyError";
  }
}

export interface RecoveryKey {
  walletAddress: string;
  privateKey: string;
}

const canonicalAddress = (address: string) => `0x${BigInt(address).toString(16).padStart(64, "0")}`;

function keyPair(privateKey: string) {
  try {
    return starkKeyPairFromPrivateKey(privateKey);
  } catch {
    throw new InvalidRecoveryKeyError();
  }
}

export function encodeRecoveryKey(key: RecoveryKey): string {
  if (!ADDRESS.test(key.walletAddress) || BigInt(key.walletAddress) === 0n) throw new InvalidRecoveryKeyError();
  return `${PREFIX}${canonicalAddress(key.walletAddress)}:${keyPair(key.privateKey).privateKeyHex}`;
}

export function parseRecoveryKey(input: string): RecoveryKey {
  const trimmed = input.trim();
  if (!trimmed.startsWith(PREFIX)) {
    const { privateKeyHex, publicKeyHex } = keyPair(trimmed);
    return { walletAddress: computeAccountAddress(publicKeyHex, 0), privateKey: privateKeyHex };
  }
  const parts = trimmed.slice(PREFIX.length).split(":");
  const [walletAddress, privateKey] = parts;
  if (parts.length !== 2 || !walletAddress || !privateKey || !ADDRESS.test(walletAddress) || BigInt(walletAddress) === 0n) {
    throw new InvalidRecoveryKeyError();
  }
  return { walletAddress: canonicalAddress(walletAddress), privateKey: keyPair(privateKey).privateKeyHex };
}

export interface RecoveryKeyProof {
  walletAddress: string;
  nonce: string;
  signature: string[];
}

export async function signRecoveryKeyProof(args: { backendUrl: string; key: RecoveryKey }): Promise<RecoveryKeyProof> {
  const { key } = args;
  const nonceRes = await fetch(`${args.backendUrl.replace(/\/$/, "")}/v1/auth/siws/nonce`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletAddress: key.walletAddress }),
  });
  if (!nonceRes.ok) throw new Error("Failed to prepare the wallet proof");
  const { nonce, typedData: message } = (await nonceRes.json()) as { nonce: string; typedData: TypedData };
  const signature = await signWithPrivateKey(key.privateKey, typedData.getMessageHash(message, key.walletAddress));
  return { walletAddress: key.walletAddress, nonce, signature: normalizeSiwsSignature(signature) };
}
