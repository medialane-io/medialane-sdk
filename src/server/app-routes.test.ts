import { describe, expect, test } from "bun:test";
import { isPublicAppRoute } from "./app-routes.js";

const A = "0x" + "a".repeat(64);

describe("public app routes", () => {
  const open: Array<[string, string]> = [
    ["GET", "collections"],
    ["GET", `collections/${A}/tokens`],
    ["GET", `tokens/${A}/1/history`],
    ["GET", `tokens/${A}/1/balances/${A}`],
    ["GET", `tokens/${A}/1/owners`],
    ["GET", `orders/token/${A}/1`],
    ["GET", "search"],
    ["GET", `coins/${A}/guarantees`],
    ["GET", `pop/${A}/claim-info`],
    ["GET", `drops/${A}/state`],
    ["GET", `ipnft/${A}/1`],
    ["GET", `club/${A}/1/member/${A}`],
    ["GET", "metadata/resolve"],
    ["GET", "auth/email/exists"],
    ["POST", "auth/email/register-account"],
    ["POST", "auth/email/request-code"],
    ["POST", "auth/email/verify-code"],
    ["POST", "auth/email/confirm"],
    ["POST", "auth/siws/nonce"],
    ["POST", "auth/siws/verify"],
    ["POST", "users/register"],
  ];
  for (const [method, path] of open) {
    test(`${method} ${path} is public`, () => expect(isPublicAppRoute(method, path)).toBe(true));
  }

  const closed: Array<[string, string]> = [
    ["POST", "rpc"],
    ["POST", "swap/quote"],
    ["POST", "metadata/upload-file"],
    ["GET", "metadata/signed-url"],
    ["POST", "intents/listing"],
    ["GET", "intents/abc"],
    ["POST", "tx/sync"],
    ["POST", "collections/register"],
    ["GET", "wallet-activity"],
    ["GET", "users/me"],
    ["GET", "portal/me"],
    ["GET", `collections/${A}/gated-content`],
    ["GET", "remix-offers"],
    ["POST", "paymaster/invoke/build"],
    ["GET", "collections/../users/me"],
    ["DELETE", "collections"],
  ];
  for (const [method, path] of closed) {
    test(`${method} ${path} needs an account`, () => expect(isPublicAppRoute(method, path)).toBe(false));
  }
});
