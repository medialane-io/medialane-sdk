import { describe, expect, test } from "bun:test";
import type { Call } from "starknet";
import { sameCalls } from "../sponsored-checks.js";
import orders from "./orders.fixtures.json";
import signed from "./signed.fixtures.json";
import { populateSignedCalls } from "./signed.js";

const cases = [
  ["listing", "listing721"],
  ["listing", "listing1155"],
  ["offer", "offer721"],
  ["offer", "offer1155"],
  ["cancel", "cancel721"],
  ["cancel", "cancel1155"],
  ["counter-offer", "counterOffer"],
] as const;

describe("signed order calls", () => {
  for (const [kind, name] of cases) {
    test(`a signed ${name} carries its order and signature as the backend does`, () => {
      const built = { calls: orders[name].calls as Call[], typedData: orders[name].typedData as never };
      expect(sameCalls(populateSignedCalls(kind, built, signed.signature), signed[name] as Call[])).toBe(true);
    });
  }

  test("only the last call carries the signature; earlier calls are unchanged", () => {
    const built = { calls: orders.listing721.calls as Call[], typedData: orders.listing721.typedData as never };
    const populated = populateSignedCalls("listing", built, signed.signature);
    expect(populated[0]).toEqual(orders.listing721.calls[0] as Call);
  });

  test("a build without typed data can't be signed", () => {
    expect(() => populateSignedCalls("listing", { calls: orders.listing721.calls as Call[] }, signed.signature)).toThrow();
  });
});
