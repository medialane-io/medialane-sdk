import { describe, expect, test } from "bun:test";
import { normalizeAddress } from "./address.js";

// Documented Stellar strkeys: the SDF docs example account and the mainnet
// native-asset (XLM) contract id. Both carry CRC16-XModem checksums, so a
// passing validation is self-evident.
const STELLAR_ACCOUNT = "GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVSGZ";
const STELLAR_CONTRACT = "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA";

describe("normalizeAddress STELLAR", () => {
  test("accepts a valid account strkey verbatim", () => {
    expect(normalizeAddress("STELLAR", STELLAR_ACCOUNT)).toBe(STELLAR_ACCOUNT);
  });
  test("accepts a valid contract strkey verbatim", () => {
    expect(normalizeAddress("STELLAR", STELLAR_CONTRACT)).toBe(STELLAR_CONTRACT);
  });
  test("canonicalizes lowercase input to uppercase", () => {
    expect(normalizeAddress("STELLAR", STELLAR_ACCOUNT.toLowerCase())).toBe(STELLAR_ACCOUNT);
  });
  test("rejects a tampered checksum", () => {
    const bad = STELLAR_ACCOUNT.slice(0, -1) + (STELLAR_ACCOUNT.endsWith("A") ? "B" : "A");
    expect(() => normalizeAddress("STELLAR", bad)).toThrow();
  });
  test("rejects wrong prefix and wrong length", () => {
    expect(() => normalizeAddress("STELLAR", "S" + STELLAR_ACCOUNT.slice(1))).toThrow();
    expect(() => normalizeAddress("STELLAR", STELLAR_ACCOUNT.slice(0, 40))).toThrow();
  });
});

describe("normalizeAddress existing chains", () => {
  test("starknet pads", () => {
    expect(normalizeAddress("STARKNET", "0x1")).toBe("0x" + "1".padStart(64, "0"));
  });
  test("evm checksums", () => {
    expect(normalizeAddress("ETHEREUM", "0x52908400098527886e0f7030069857d2e4169ee7")).toBe(
      "0x52908400098527886E0F7030069857D2E4169EE7",
    );
  });
});
