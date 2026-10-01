import { computeAccountAddress } from "../starknet/business-provisioning/account.js";
import { starkKeyPairFromPrivateKey } from "../starknet/passkey-wallet/crypto.js";

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

/** The recovery key a user saves: a wallet address and one of its owner keys, in one string. */
export function encodeRecoveryKey(key: RecoveryKey): string {
  if (!ADDRESS.test(key.walletAddress) || BigInt(key.walletAddress) === 0n) throw new InvalidRecoveryKeyError();
  return `${PREFIX}${canonicalAddress(key.walletAddress)}:${keyPair(key.privateKey).privateKeyHex}`;
}

/** Reads a saved recovery key. A bare private key, saved before v1, restores the wallet that key first deployed. */
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
