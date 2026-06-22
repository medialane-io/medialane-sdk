import { test, expect } from "bun:test";
import { encodeAdminHeaders, parseAdminHeaders, ADMIN_HEADERS, verifyAdminRequestSig, createAdminSessionGrant } from "./index.js";

test("encode → parse round-trips the grant and verifies the request sig", async () => {
  const session = await createAdminSessionGrant(async () => ["0x1", "0x2"], { wallet: "0xabc", ttlSeconds: 100 });
  const headers = encodeAdminHeaders(session, { method: "POST", path: "/admin/tenants", body: "{\"a\":1}" });
  const parsed = parseAdminHeaders((n) => headers[n]);
  expect(parsed).not.toBeNull();
  expect(parsed!.grant.wallet).toBe("0xabc");
  const ok = verifyAdminRequestSig(parsed!.grant.sessionPublicKey, {
    method: "POST", path: "/admin/tenants", body: "{\"a\":1}", nonce: parsed!.nonce, ts: parsed!.ts,
  }, parsed!.sig);
  expect(ok).toBe(true);
});

test("parse returns null on missing headers", () => {
  expect(parseAdminHeaders(() => null)).toBeNull();
  expect(parseAdminHeaders((n) => (n === ADMIN_HEADERS.nonce ? "0x1" : null))).toBeNull();
});
