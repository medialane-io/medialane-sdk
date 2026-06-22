import { test, expect } from "bun:test";
import { ec, encode } from "starknet";
import { adminRequestDigest } from "./digest.js";
import { signAdminRequest, verifyAdminRequestSig } from "./request.js";
import type { AdminRequest } from "./types.js";

function freshKey() {
  const priv = ec.starkCurve.utils.randomPrivateKey();
  const privHex = "0x" + encode.buf2hex(priv);
  const pubHex = "0x" + encode.buf2hex(ec.starkCurve.getPublicKey(privHex, false));
  return { privHex, pubHex };
}

const req: AdminRequest = {
  method: "get", path: "/admin/tenants?page=1", body: "", nonce: "0x1", ts: 1_700_000_000,
};

test("digest is deterministic and case-normalizes the method", () => {
  expect(adminRequestDigest(req)).toBe(adminRequestDigest({ ...req, method: "GET" }));
});

test("valid signature verifies; tampered path/body/nonce do not", () => {
  const { privHex, pubHex } = freshKey();
  const sig = signAdminRequest(privHex, req);
  expect(verifyAdminRequestSig(pubHex, req, sig)).toBe(true);
  expect(verifyAdminRequestSig(pubHex, { ...req, path: "/admin/tenants?page=2" }, sig)).toBe(false);
  expect(verifyAdminRequestSig(pubHex, { ...req, body: "{\"x\":1}" }, sig)).toBe(false);
  expect(verifyAdminRequestSig(pubHex, { ...req, nonce: "0x2" }, sig)).toBe(false);
});

test("a different key does not verify", () => {
  const a = freshKey(); const b = freshKey();
  const sig = signAdminRequest(a.privHex, req);
  expect(verifyAdminRequestSig(b.pubHex, req, sig)).toBe(false);
});
