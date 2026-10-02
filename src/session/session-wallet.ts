import { typedData as starknetTypedData } from "starknet";
import type { ApiClient } from "../api/client.js";
import type { CreatedOwner } from "../wallet/passkey.js";
import type { SealedOwner } from "../wallet/types.js";
import { computeOwnerGuid, ownerAliveTypedData } from "../starknet/media-wallet/owners.js";
import { signWithPrivateKey } from "../starknet/passkey-wallet/crypto.js";

export interface SessionWallet {
  walletAddress: string;
  needsKeySetup: boolean;
}

export async function adoptSessionWallet(
  api: Pick<ApiClient, "getSessionWallet">,
  saveAddress: (walletAddress: string) => void,
): Promise<SessionWallet | null> {
  const wallet = await api.getSessionWallet();
  if (wallet) saveAddress(wallet.walletAddress);
  return wallet;
}

export interface SessionWalletKeyDeps {
  createOwnerKey(): Promise<CreatedOwner>;
  saveOwner(sealed: SealedOwner): void;
  now?(): number;
}

const PROOF_TTL_SECONDS = 600;

export async function setupSessionWalletKey(
  api: Pick<ApiClient, "setupWalletKey">,
  walletAddress: string,
  deps: SessionWalletKeyDeps,
): Promise<void> {
  const { sealed, privateKeyHex } = await deps.createOwnerKey();
  const now = deps.now?.() ?? Math.floor(Date.now() / 1000);
  const expiration = now + PROOF_TTL_SECONDS;
  const message = ownerAliveTypedData(computeOwnerGuid(sealed.ownerPubKey), expiration, "SN_MAIN");
  const signature = signWithPrivateKey(privateKeyHex, starknetTypedData.getMessageHash(message as never, walletAddress));

  const result = await api.setupWalletKey({ newOwnerPubkey: sealed.ownerPubKey, signature, expiration });
  deps.saveOwner({ ...sealed, address: result.walletAddress });
}
