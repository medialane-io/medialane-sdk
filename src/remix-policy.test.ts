import { test, expect } from "bun:test";
import { getDerivativesTerm, resolveRemixPolicy } from "./remix-policy.js";

test("reads the Derivatives trait when present", () => {
  expect(getDerivativesTerm([{ trait_type: "Derivatives", value: "Allowed" }])).toBe("Allowed");
  expect(getDerivativesTerm([{ trait_type: "Derivatives", value: "Not Allowed" }])).toBe("Not Allowed");
});

test("returns null for a missing, empty or unrecognised trait", () => {
  expect(getDerivativesTerm([])).toBeNull();
  expect(getDerivativesTerm(null)).toBeNull();
  expect(getDerivativesTerm(undefined)).toBeNull();
  expect(getDerivativesTerm([{ trait_type: "Derivatives", value: "Maybe" }])).toBeNull();
  expect(getDerivativesTerm([{ trait_type: "License", value: "Allowed" }])).toBeNull();
});

test("the parent owner may always remix their own asset", () => {
  const p = resolveRemixPolicy({
    parentNoDerivatives: true,
    viewerIsParentOwner: true,
    dealAvailable: true,
  });
  expect(p.canRemixDirect).toBe(true);
});

test("a no-derivatives asset blocks direct remix for anyone else", () => {
  const p = resolveRemixPolicy({
    parentNoDerivatives: true,
    viewerIsParentOwner: false,
    dealAvailable: false,
  });
  expect(p.canRemixDirect).toBe(false);
});

test("the deal option is offered only to non-owners when a deal exists", () => {
  expect(
    resolveRemixPolicy({ parentNoDerivatives: true, viewerIsParentOwner: false, dealAvailable: true })
      .showDealOption,
  ).toBe(true);
  expect(
    resolveRemixPolicy({ parentNoDerivatives: true, viewerIsParentOwner: true, dealAvailable: true })
      .showDealOption,
  ).toBe(false);
  expect(
    resolveRemixPolicy({ parentNoDerivatives: true, viewerIsParentOwner: false, dealAvailable: false })
      .showDealOption,
  ).toBe(false);
});
