import { hash, num } from "starknet";
import type { AdminRequest } from "./types.js";

/**
 * Canonical felt digest of a request — the SINGLE definition shared by signer
 * (portal/agent) and verifier (backend). Binds method+path+query+body+nonce+ts,
 * so a captured request cannot be retargeted or mutated without invalidating it.
 */
export function adminRequestDigest(req: AdminRequest): string {
  return hash.computePoseidonHashOnElements([
    hash.starknetKeccak(req.method.toUpperCase()),
    hash.starknetKeccak(req.path),
    hash.starknetKeccak(req.body ?? ""),
    num.toBigInt(req.nonce),
    BigInt(req.ts),
  ]);
}
