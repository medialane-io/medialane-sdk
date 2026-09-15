import { computeAccountAddress } from "../starknet/business-provisioning/account.js";
import type { SealedOwner } from "./types.js";

export function isRecoveryKeyForWallet(sealed: SealedOwner): boolean {
  try {
    return BigInt(computeAccountAddress(sealed.ownerPubKey, 0)) === BigInt(sealed.address);
  } catch {
    return false;
  }
}
