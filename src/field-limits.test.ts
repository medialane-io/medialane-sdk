import { expect, test } from "bun:test";
import { FIELD_LIMITS } from "./index.js";

test("standard field limits", () => {
  expect(FIELD_LIMITS).toEqual({ name: 255, symbol: 10, description: 2000 });
});
