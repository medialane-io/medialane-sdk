import { test, expect } from "bun:test";
import { UPLOAD_LIMITS, formatFileSize, uploadSizeError } from "./uploads.js";

const MB = 1024 * 1024;

test("images may be up to 50 MB", () => {
  expect(UPLOAD_LIMITS.image.maxBytes).toBe(50 * MB);
  expect(uploadSizeError({ size: 50 * MB })).toBeNull();
});

test("an image over the limit gets a message with both sizes", () => {
  expect(uploadSizeError({ size: 63.2 * MB })).toBe("That image is 63.2 MB. Please choose one under 50 MB.");
});

test("documents and media use their own limits", () => {
  expect(uploadSizeError({ size: 21 * MB }, "document")).toBe("That file is 21 MB. Please choose one under 20 MB.");
  expect(uploadSizeError({ size: 99 * MB }, "media")).toBeNull();
});

test("formatFileSize shows whole megabytes without a decimal", () => {
  expect(formatFileSize(20 * MB)).toBe("20 MB");
  expect(formatFileSize(1.25 * MB)).toBe("1.3 MB");
});
