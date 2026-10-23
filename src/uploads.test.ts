import { test, expect } from "bun:test";
import { MAX_UPLOAD_BYTES, UPLOAD_LIMITS, acceptFor, formatFileSize, uploadError, uploadSizeError } from "./uploads.js";

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

test("kinds keep their own types", () => {
  expect(UPLOAD_LIMITS.image.mimeTypes).not.toContain("video/mp4");
  expect(UPLOAD_LIMITS.media.mimeTypes).toContain("video/mp4");
});

test("formatFileSize shows whole megabytes without a decimal", () => {
  expect(formatFileSize(20 * MB)).toBe("20 MB");
  expect(formatFileSize(1.25 * MB)).toBe("1.3 MB");
});

test("uploadError accepts the kind's types", () => {
  expect(uploadError({ size: 1000, type: "image/png" })).toBeNull();
  expect(uploadError({ size: 1000, type: "image/avif" })).toBeNull();
});

test("uploadError names the accepted types for anything else", () => {
  expect(uploadError({ size: 1000, type: "image/heic" })).toBe("Choose an image in JPG, JPEG, PNG, GIF, SVG, WEBP or AVIF.");
  expect(uploadError({ size: 1000, type: "", name: "x.exe" }, "document")).toBe("Choose a file in PDF, DOC, DOCX, ODT, RTF, TXT or MD.");
});

test("a file without a browser type is accepted by its extension", () => {
  expect(uploadError({ size: 1000, type: "", name: "notes.MD" }, "document")).toBeNull();
});

test("uploadError checks the size after the type", () => {
  expect(uploadError({ size: 95 * MB, type: "image/png" })).toBe("That image is 95 MB. Please choose one under 90 MB.");
});

test("acceptFor lists the types then the extensions", () => {
  expect(acceptFor("image").startsWith("image/jpeg,")).toBe(true);
  expect(acceptFor("image").endsWith(",.avif")).toBe(true);
});
