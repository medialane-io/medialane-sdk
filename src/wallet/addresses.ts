import { validateAndParseAddress } from "starknet";
import { normalizeAddress } from "../utils/address.js";
import type { ReceiptProviderLike } from "./types.js";

export function normalizeWalletAddress(address: string): string {
  return normalizeAddress("STARKNET", address);
}

export function isValidStarknetAddress(address: string): boolean {
  try {
    validateAndParseAddress(address.trim());
    return true;
  } catch {
    return false;
  }
}

const CONTRACT_NOT_FOUND = 20;

export async function isDeployed(provider: ReceiptProviderLike, address: string): Promise<boolean> {
  try {
    await provider.getClassHashAt(normalizeWalletAddress(address));
    return true;
  } catch (err) {
    if ((err as { code?: unknown } | null)?.code === CONTRACT_NOT_FOUND) return false;
    throw err;
  }
}
