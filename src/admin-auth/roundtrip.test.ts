import { test, expect } from "bun:test";
import { ec, encode } from "starknet";
import { adminRequestDigest } from "./digest.js";
import { signAdminRequest, verifyAdminRequestSig } from "./request.js";
import { buildAdminSessionTypedData, createAdminSessionGrant, sessionKeyHashOf } from "./grant.js";
import { ADMIN_SCOPE, type AdminRequest } from "./types.js";

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

test("grant binds the session key and is reconstructible by the verifier", async () => {
  let signedData: any = null;
  const session = await createAdminSessionGrant(
    async (data) => { signedData = data; return ["0xaa", "0xbb"]; },
    { wallet: "0x123", ttlSeconds: 100, now: () => 1_700_000_000_000 },
  );
  // sessionKeyHash in the grant matches the hash of the public key
  expect(session.grant.sessionKeyHash).toBe(sessionKeyHashOf(session.grant.sessionPublicKey));
  expect(session.grant.scope).toBe(ADMIN_SCOPE);
  expect(session.grant.expiresAt - session.grant.issuedAt).toBe(100);
  // verifier rebuilds the SAME typed data from grant fields
  const rebuilt = buildAdminSessionTypedData({
    sessionKeyHash: session.grant.sessionKeyHash, scope: session.grant.scope,
    issuedAt: session.grant.issuedAt, expiresAt: session.grant.expiresAt,
  });
  expect(rebuilt).toEqual(signedData);
});
