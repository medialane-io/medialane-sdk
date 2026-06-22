import { ec } from "starknet";
import { adminRequestDigest } from "./digest.js";
import type { AdminRequest, AdminRequestSig } from "./types.js";

/** Sign a request with the session private key. */
export function signAdminRequest(sessionPrivateKey: string, req: AdminRequest): AdminRequestSig {
  const digest = adminRequestDigest(req);
  return ec.starkCurve.sign(digest, sessionPrivateKey).toCompactHex();
}

/** Verify a request signature against the full session public key. */
export function verifyAdminRequestSig(
  sessionPublicKey: string,
  req: AdminRequest,
  sig: AdminRequestSig,
): boolean {
  try {
    return ec.starkCurve.verify(sig, adminRequestDigest(req), sessionPublicKey);
  } catch {
    return false;
  }
}
