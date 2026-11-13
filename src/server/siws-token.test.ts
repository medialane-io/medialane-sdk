import { test, expect, describe } from "bun:test";
import { createHmac } from "crypto";
import {
  issueSiwsToken,
  verifySiwsToken,
  issueAccountSessionToken,
  verifyAccountSessionToken,
  readAccountSessionToken,
  IDENTITY_TTL_SECONDS,
  ACCOUNT_SESSION_TTL_SECONDS,
} from "./siws-token.js";

const SECRET = "test-secret-not-used-anywhere-real";

function legacyToken(prefix: string, payload: Record<string, unknown>): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", SECRET).update(encoded).digest("hex");
  return `${prefix}${encoded}.${sig}`;
}

function sessionTokenWith(payload: Record<string, unknown>): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", SECRET).update("account-session-v1").update(".").update(encoded).digest("hex");
  return `account_session_${encoded}.${sig}`;
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

describe("untagged signatures are no longer accepted", () => {
  // The domain tag's backward-compat window (medialane-backend commit a9ad9aa,
  // 2026-08-27) closed once the longest-lived token type (the 30-day account
  // session) could no longer be in circulation from before the tag existed.
  // Accepting an untagged signature indefinitely would have kept alive the
  // exact cross-token-type confusion that tag was added to close.
  test("rejects an untagged identity token", () => {
    const iat = nowSeconds();
    const token = legacyToken("siws_", { sub: "0xdef", chain: "STARKNET", iat, exp: iat + IDENTITY_TTL_SECONDS });
    expect(verifySiwsToken(SECRET, token)).toBeNull();
  });

  test("rejects an untagged account session token", () => {
    const iat = nowSeconds();
    const token = legacyToken("account_session_", { accountId: "acc_legacy", iat, exp: iat + 3600 });
    expect(verifyAccountSessionToken(SECRET, token)).toBeNull();
  });
});

describe("compatibility with the tokens already in circulation", () => {
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

describe("readAccountSessionToken", () => {
  test("returns the account id and the issue time", () => {
    const realNow = Date.now;
    Date.now = () => 1_800_000_000_000;
    try {
      const token = issueAccountSessionToken(SECRET, "acc_1");
      expect(readAccountSessionToken(SECRET, token)).toEqual({ accountId: "acc_1", issuedAt: 1_800_000_000 });
    } finally {
      Date.now = realNow;
    }
  });

  test("refuses what verifyAccountSessionToken refuses", () => {
    const token = issueAccountSessionToken(SECRET, "acc_1");
    const [head, sig] = [token.slice(0, token.lastIndexOf(".")), token.slice(token.lastIndexOf(".") + 1)];
    expect(readAccountSessionToken(SECRET, `${head}.${sig.replace(/^./, sig[0] === "a" ? "b" : "a")}`)).toBeNull();
    expect(readAccountSessionToken("another-secret-of-enough-length-xx", token)).toBeNull();
    expect(readAccountSessionToken(SECRET, issueAccountSessionToken(SECRET, "acc_1"))).not.toBeNull();
    expect(readAccountSessionToken(SECRET, issueSiwsToken(SECRET, "STARKNET", "0x1"))).toBeNull();
  });
});

describe("account session lifetime", () => {
  const issuedAt = 1_800_000_000;
  const at = (seconds: number, run: () => void) => {
    const realNow = Date.now;
    Date.now = () => seconds * 1000;
    try {
      run();
    } finally {
      Date.now = realNow;
    }
  };

  test("lasts a year from the issue time", () => {
    let token = "";
    at(issuedAt, () => {
      token = issueAccountSessionToken(SECRET, "acc_1");
    });
    at(issuedAt + ACCOUNT_SESSION_TTL_SECONDS - 60, () => {
      expect(readAccountSessionToken(SECRET, token)).not.toBeNull();
    });
    at(issuedAt + ACCOUNT_SESSION_TTL_SECONDS + 60, () => {
      expect(readAccountSessionToken(SECRET, token)).toBeNull();
    });
  });

  test("a token issued with a shorter stored expiry lasts the full year", () => {
    const token = sessionTokenWith({ accountId: "acc_old", iat: issuedAt, exp: issuedAt + 30 * 86_400 });
    at(issuedAt + 40 * 86_400, () => {
      expect(readAccountSessionToken(SECRET, token)).toEqual({ accountId: "acc_old", issuedAt });
    });
  });
});
