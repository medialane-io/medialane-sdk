import { test, expect, describe } from "bun:test";
import { createHmac } from "node:crypto";
import {
  issueSiwsToken,
  verifySiwsToken,
  issueAccountSessionToken,
  verifyAccountSessionToken,
  IDENTITY_TTL_SECONDS,
} from "./siws-token.js";

const SECRET = "test-secret-not-used-anywhere-real";

// Reproduces exactly how the backend signed tokens before this module existed,
// so the tests can prove tokens already in circulation still verify.
function legacyToken(prefix: string, payload: Record<string, unknown>): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", SECRET).update(encoded).digest("hex");
  return `${prefix}${encoded}.${sig}`;
}

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

describe("identity tokens", () => {
  test("round-trips a wallet and chain", () => {
    const token = issueSiwsToken(SECRET, "STARKNET", "0xabc");
    expect(verifySiwsToken(SECRET, token)).toEqual({ address: "0xabc", chain: "STARKNET" });
  });

  test("rejects a token signed with a different secret", () => {
    const token = issueSiwsToken(SECRET, "STARKNET", "0xabc");
    expect(verifySiwsToken("another-secret", token)).toBeNull();
  });

  test("rejects a tampered payload", () => {
    const token = issueSiwsToken(SECRET, "STARKNET", "0xabc");
    const [head, sig] = token.slice("siws_".length).split(".");
    const forged = Buffer.from(JSON.stringify({ sub: "0xattacker", iat: nowSeconds(), exp: nowSeconds() + 60 })).toString("base64url");
    expect(verifySiwsToken(SECRET, `siws_${forged}.${sig}`)).toBeNull();
    expect(head).toBeTruthy();
  });

  test("rejects an expired token", () => {
    const token = issueSiwsToken(SECRET, "STARKNET", "0xabc", -10);
    expect(verifySiwsToken(SECRET, token)).toBeNull();
  });

  test("rejects a token minted implausibly far in the future", () => {
    const iat = nowSeconds() + 3600;
    expect(
      verifySiwsToken(SECRET, legacyToken("siws_", { sub: "0xabc", iat, exp: iat + 60 })),
    ).toBeNull();
  });
});

describe("account session tokens", () => {
  test("round-trips an account id", () => {
    const token = issueAccountSessionToken(SECRET, "acc_1");
    expect(verifyAccountSessionToken(SECRET, token)).toBe("acc_1");
  });
});

// The two families share a secret. Before domain separation the signature
// covered only the payload, so the kind of token was not authenticated.
describe("token kinds cannot be interchanged", () => {
  test("an account session token is not a valid identity token", () => {
    const session = issueAccountSessionToken(SECRET, "acc_1");
    const swapped = `siws_${session.slice("account_session_".length)}`;
    expect(verifySiwsToken(SECRET, swapped)).toBeNull();
  });

  test("an identity token is not a valid account session token", () => {
    const identity = issueSiwsToken(SECRET, "STARKNET", "0xabc");
    const swapped = `account_session_${identity.slice("siws_".length)}`;
    expect(verifyAccountSessionToken(SECRET, swapped)).toBeNull();
  });
});

// This module replaces three separate node:crypto implementations. If its
// output diverged from theirs, every token in circulation would stop verifying
// the moment any one consumer adopted it.
describe("compatibility with the tokens already in circulation", () => {
  test("verifies an untagged identity token issued by the previous code", () => {
    const iat = nowSeconds();
    const token = legacyToken("siws_", { sub: "0xdef", chain: "STARKNET", iat, exp: iat + IDENTITY_TTL_SECONDS });
    expect(verifySiwsToken(SECRET, token)).toEqual({ address: "0xdef", chain: "STARKNET" });
  });

  test("verifies an untagged account session token issued by the previous code", () => {
    const iat = nowSeconds();
    const token = legacyToken("account_session_", { accountId: "acc_legacy", iat, exp: iat + 3600 });
    expect(verifyAccountSessionToken(SECRET, token)).toBe("acc_legacy");
  });

  test("its own signatures match what node:crypto produces for the same input", () => {
    const token = issueSiwsToken(SECRET, "STARKNET", "0xabc");
    const [payload, signature] = token.slice("siws_".length).split(".");
    const viaNode = createHmac("sha256", SECRET)
      .update("siws-identity-v1")
      .update(".")
      .update(payload!)
      .digest("hex");
    expect(signature).toBe(viaNode);
  });
});
