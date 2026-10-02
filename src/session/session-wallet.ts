import type { ApiClient } from "../api/client.js";
import type { CreatedOwner } from "../wallet/passkey.js";
import type { SealedOwner } from "../wallet/types.js";
import { normalizeWalletAddress } from "../wallet/addresses.js";

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

export interface SessionWalletClaimDeps {
  createOwnerKey(): Promise<CreatedOwner>;
  loadOwner(): SealedOwner | null;
  saveOwner(sealed: SealedOwner): void;
  removeOwner(sealed: SealedOwner, ownerGuid: string): Promise<unknown>;
}

export async function claimSessionWallet(
  api: Pick<ApiClient, "setupWalletKey">,
  walletAddress: string,
  deps: SessionWalletClaimDeps,
): Promise<void> {
  const saved = deps.loadOwner();
  const resuming = saved !== null && normalizeWalletAddress(saved.address) === normalizeWalletAddress(walletAddress);
  const sealed = resuming ? saved : { ...(await deps.createOwnerKey()).sealed, address: walletAddress };
  if (!resuming) deps.saveOwner(sealed);

  const { removeOwnerGuid } = await api.setupWalletKey({ newOwnerPubkey: sealed.ownerPubKey });
  if (removeOwnerGuid) await deps.removeOwner(sealed, removeOwnerGuid);
}
