import { test, expect } from "bun:test";
import { MAX_UPLOAD_BYTES, formatFileSize, uploadSizeError } from "./uploads.js";

const MB = 1024 * 1024;

test("one size for every kind", () => {
  expect(MAX_UPLOAD_BYTES).toBe(94_371_840);
  for (const kind of ["image", "document", "media"] as const) {
    expect(uploadSizeError({ size: MAX_UPLOAD_BYTES }, kind)).toBeNull();
  }
});

test("over the size gets a message with both sizes", () => {
  expect(uploadSizeError({ size: 95 * MB })).toBe("That image is 95 MB. Please choose one under 90 MB.");
  expect(uploadSizeError({ size: 95 * MB }, "document")).toBe("That file is 95 MB. Please choose one under 90 MB.");
});

test("formatFileSize shows whole megabytes without a decimal", () => {
  expect(formatFileSize(20 * MB)).toBe("20 MB");
  expect(formatFileSize(1.25 * MB)).toBe("1.3 MB");
});
