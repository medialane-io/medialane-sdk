import { test, expect } from "bun:test";
import { UserFacingError } from "./errors.js";

test("UserFacingError marks a message as written for a user", () => {
  const err = new UserFacingError("Please check your balance and try again.");
  expect(err).toBeInstanceOf(Error);
  expect(err.name).toBe("UserFacingError");
  expect(err.message).toBe("Please check your balance and try again.");
});
