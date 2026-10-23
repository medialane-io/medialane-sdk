import { describe, expect, test } from "bun:test";
import { pageQuery } from "./common.js";

describe("pageQuery", () => {
  test("no query gives the defaults", () => {
    expect(pageQuery().parse({})).toEqual({ page: 1, limit: 20, skip: 0 });
  });

  test("a valid page and limit pass through and give the skip", () => {
    expect(pageQuery().parse({ page: "3", limit: "10" })).toEqual({ page: 3, limit: 10, skip: 20 });
  });

  test.each([
    ["abc", 20],
    ["", 20],
    ["0", 1],
    ["-5", 1],
    ["2.5", 2],
    ["1e3", 100],
    ["500", 100],
  ])("limit=%s gives %d with defaults 20 and 100", (raw, expected) => {
    expect(pageQuery().parse({ limit: raw }).limit).toBe(expected);
  });

  test("a repeated limit falls back to the default", () => {
    expect(pageQuery().parse({ limit: ["1", "2"] }).limit).toBe(20);
  });

  test.each([
    ["0", 1],
    ["-2", 1],
    ["abc", 1],
    ["", 1],
    ["2.9", 2],
  ])("page=%s gives %d", (raw, expected) => {
    expect(pageQuery().parse({ page: raw }).page).toBe(expected);
  });

  test("a route's own default and cap are used", () => {
    expect(pageQuery({ defaultLimit: 24, maxLimit: 48 }).parse({}).limit).toBe(24);
    expect(pageQuery({ defaultLimit: 24, maxLimit: 48 }).parse({ limit: "100" }).limit).toBe(48);
  });
});
