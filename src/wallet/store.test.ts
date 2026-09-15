import { test, expect, beforeEach } from "bun:test";
import type { SealedOwner } from "./types.js";

if (typeof (globalThis as { window?: unknown }).window === "undefined") {
  (globalThis as { window: unknown }).window = globalThis;
}
if (typeof (globalThis as { localStorage?: unknown }).localStorage === "undefined") {
  const memory = new Map<string, string>();
  (globalThis as { localStorage: Storage }).localStorage = {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => void memory.set(key, value),
    removeItem: (key: string) => void memory.delete(key),
    clear: () => memory.clear(),
    key: (index: number) => Array.from(memory.keys())[index] ?? null,
    get length() {
      return memory.size;
    },
  } as Storage;
}

const { createOwnerStore } = await import("./store.js");

const FAKE: SealedOwner = {
  credentialId: "cred1",
  ownerPubKey: "0xabc",
  address: "0xdef",
  iv: "iv1",
  ciphertext: "ct1",
};

const store = createOwnerStore({ storeKey: "app-one.wallet.owner.v1", changeEvent: "app-one-wallet" });

beforeEach(() => {
  localStorage.clear();
});

test("reports no wallet until one is saved", () => {
  expect(store.load()).toBeNull();
  expect(store.loadAddress()).toBeNull();
});

test("round-trips a sealed owner and reads its address", () => {
  store.save(FAKE);
  expect(store.load()).toEqual(FAKE);
  expect(store.loadAddress()).toBe("0xdef");
});

test("clearing removes the wallet", () => {
  store.save(FAKE);
  store.clear();
  expect(store.load()).toBeNull();
});

test("one app never reads another app's wallet", () => {
  const other = createOwnerStore({ storeKey: "app-two.wallet.owner.v1", changeEvent: "app-two-wallet" });
  store.save(FAKE);
  expect(other.load()).toBeNull();
});

test("saving and clearing announce the app's own change event", () => {
  const seen: string[] = [];
  const stop = store.onChange(() => seen.push("changed"));
  store.save(FAKE);
  store.clear();
  store.notifyChange();
  stop();
  store.save(FAKE);
  expect(seen).toEqual(["changed", "changed", "changed"]);
});

test("unreadable storage reports no wallet instead of throwing", () => {
  localStorage.setItem("app-one.wallet.owner.v1", "not json");
  expect(store.load()).toBeNull();
});
