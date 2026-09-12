import { test, expect } from "bun:test";
import {
  buildApprovalUrl,
  parseApprovalRequest,
  buildReturnUrl,
  isMedialaneOrigin,
  InvalidApprovalRequestError,
} from "./approval.js";

const KEY = "0x1f8b1e9a7d3c5f6082b4d1e3a9c7f50826d4b1e9a3c7f50826d4b1e9a3c7f5";
const REQUEST = {
  publicKey: KEY,
  appName: "Medialane Portal",
  returnUrl: "https://portal.medialane.io/link-device",
};

test("an approval link carries the key, the app asking, and where to come back to", () => {
  const url = new URL(buildApprovalUrl("https://www.medialane.io", REQUEST));
  expect(url.pathname).toBe("/approve-app");
  expect(url.searchParams.get("key")).toBe(KEY);
  expect(url.searchParams.get("app")).toBe("Medialane Portal");
  expect(url.searchParams.get("return")).toBe(REQUEST.returnUrl);
});

test("what was built is what is read back", () => {
  const url = new URL(buildApprovalUrl("https://www.medialane.io", REQUEST));
  expect(parseApprovalRequest(url.searchParams)).toEqual(REQUEST);
});

test("an app outside Medialane cannot be returned to", () => {
  for (const bad of [
    "https://evil.com/steal",
    "https://medialane.io.evil.com/steal",
    "https://notmedialane.io/steal",
    "http://portal.medialane.io/x",
    "javascript:alert(1)",
  ]) {
    expect(() => buildApprovalUrl("https://www.medialane.io", { ...REQUEST, returnUrl: bad })).toThrow(
      InvalidApprovalRequestError,
    );
  }
});

test("an app outside Medialane cannot be asked to approve", () => {
  expect(() => buildApprovalUrl("https://evil.com", REQUEST)).toThrow(InvalidApprovalRequestError);
});

test("every Medialane app counts, and localhost for development", () => {
  for (const origin of [
    "https://medialane.io",
    "https://www.medialane.io",
    "https://portal.medialane.io",
    "http://localhost:3000",
  ]) {
    expect(isMedialaneOrigin(origin)).toBe(true);
  }
});

test("a key that is not a key is refused", () => {
  for (const bad of ["", "0x0", "not-a-key", "0x" + "f".repeat(65)]) {
    expect(() => buildApprovalUrl("https://www.medialane.io", { ...REQUEST, publicKey: bad })).toThrow(
      InvalidApprovalRequestError,
    );
  }
});

test("a request with no app name is refused, so nobody approves an unnamed app", () => {
  expect(() => buildApprovalUrl("https://www.medialane.io", { ...REQUEST, appName: "   " })).toThrow(
    InvalidApprovalRequestError,
  );
});

test("the outcome comes back on the return url", () => {
  expect(buildReturnUrl(REQUEST.returnUrl, "approved")).toContain("approval=approved");
  expect(buildReturnUrl(REQUEST.returnUrl, "declined")).toContain("approval=declined");
});

test("a declined outcome cannot be redirected off Medialane", () => {
  expect(() => buildReturnUrl("https://evil.com", "approved")).toThrow(InvalidApprovalRequestError);
});
