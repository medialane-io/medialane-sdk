import { describe, expect, test } from "bun:test";
import { stellarOrderRef } from "./venue.js";

describe("stellarOrderRef", () => {
  const C = "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA";
  const G = "GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVSGZ";
  test("stable digest of (contract, offerer, salt)", () => {
    const ref = stellarOrderRef(C, G, 42n);
    expect(ref).toMatch(/^0x[0-9a-f]{64}$/);
    expect(stellarOrderRef(C, G, 42n)).toBe(ref);
  });
  test("distinct per salt / offerer / contract", () => {
    const ref = stellarOrderRef(C, G, 42n);
    expect(stellarOrderRef(C, G, 43n)).not.toBe(ref);
    expect(stellarOrderRef(C, C, 42n)).not.toBe(ref);
  });
});
