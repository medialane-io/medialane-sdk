import { hash, num } from "starknet";
import type { AdminRequest } from "./types.js";

export function adminRequestDigest(req: AdminRequest): string {
  return hash.computePoseidonHashOnElements([
    hash.starknetKeccak(req.method.toUpperCase()),
    hash.starknetKeccak(req.path),
    hash.starknetKeccak(req.body ?? ""),
    num.toBigInt(req.nonce),
    BigInt(req.ts),
  ]);
}
