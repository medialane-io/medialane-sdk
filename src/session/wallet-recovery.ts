import type { AccountApi } from "../api/domains/account.js";
import type { CreatedOwner } from "../wallet/passkey.js";
import type { SealedOwner } from "../wallet/types.js";
import { normalizeWalletAddress } from "../wallet/addresses.js";
import { computeOwnerGuid } from "../starknet/media-wallet/owners.js";
import { UserFacingError } from "../errors.js";

type RecoveryApi = { account: Pick<AccountApi, "walletRecovery" | "startWalletRecovery" | "completeWalletRecovery"> };

export interface SessionRecoveryDeps {
  createOwnerKey(): Promise<CreatedOwner>;
  loadRecovery(): SealedOwner | null;
  saveRecovery(sealed: SealedOwner): void;
  clearRecovery(): void;
  saveOwner(sealed: SealedOwner): void;
}

const sameWallet = (a: string, b: string) => normalizeWalletAddress(a) === normalizeWalletAddress(b);

export async function startSessionRecovery(api: RecoveryApi, walletAddress: string, deps: SessionRecoveryDeps) {
  const saved = deps.loadRecovery();
  let pending = saved && sameWallet(saved.address, walletAddress) ? saved : null;
  if (!pending) {
    pending = { ...(await deps.createOwnerKey()).sealed, address: walletAddress };
    deps.saveRecovery(pending);
  }
  const current = await api.account.walletRecovery();
  if (current.state !== "none" && current.newOwnerGuid !== null && BigInt(current.newOwnerGuid) === BigInt(computeOwnerGuid(pending.ownerPubKey))) {
    return current;
  }
  return api.account.startWalletRecovery({ newOwnerPubkey: pending.ownerPubKey });
}

export async function finishSessionRecovery(api: RecoveryApi, walletAddress: string, deps: SessionRecoveryDeps): Promise<void> {
  const saved = deps.loadRecovery();
  if (!saved || !sameWallet(saved.address, walletAddress)) throw new UserFacingError("There is no recovery to finish on this browser");
  await api.account.completeWalletRecovery({ newOwnerPubkey: saved.ownerPubKey });
  deps.saveOwner(saved);
  deps.clearRecovery();
}

export async function turnOnRecovery(
  api: { account: Pick<AccountApi, "walletRecovery"> },
  wallet: { setFirstGuardian(sealed: SealedOwner, guardianPubkey: string): Promise<unknown> },
  sealed: SealedOwner,
): Promise<void> {
  const status = await api.account.walletRecovery();
  if (status.enabled) return;
  if (!status.guardianPubkey) throw new UserFacingError("Recovery is not available right now");
  await wallet.setFirstGuardian(sealed, status.guardianPubkey);
}
