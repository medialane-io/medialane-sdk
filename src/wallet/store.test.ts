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

test("saving a different wallet keeps the previous wallet's key under its address", () => {
  store.save(FAKE);
  const next: SealedOwner = { ...FAKE, credentialId: "cred2", address: "0x123", ciphertext: "ct2" };
  store.save(next);
  expect(store.load()).toEqual(next);
  expect(JSON.parse(localStorage.getItem(`app-one.wallet.owner.v1:${FAKE.address}`)!)).toEqual(FAKE);
});

test("saving the same wallet again keeps no extra copy", () => {
  store.save(FAKE);
  store.save({ ...FAKE, ciphertext: "ct-new" });
  expect(localStorage.length).toBe(1);
});

const KEY = "app-one.wallet.owner.v1";
const OTHER: SealedOwner = { ...FAKE, credentialId: "cred2", address: "0x123", ciphertext: "ct2" };
const fresh = () => createOwnerStore({ storeKey: KEY, changeEvent: "app-one-wallet" });

test("a recovery key and a replacement are kept side by side", () => {
  store.saveRecovery(FAKE);
  store.saveReplacement(OTHER);
  expect(store.loadRecovery()).toEqual(FAKE);
  expect(store.loadReplacement()).toEqual(OTHER);
  expect(store.load()).toBeNull();
  store.clearRecovery();
  expect(store.loadRecovery()).toBeNull();
  expect(store.loadReplacement()).toEqual(OTHER);
  store.clearReplacement();
  expect(store.loadReplacement()).toBeNull();
});

test("one app never reads another app's recovery key or replacement", () => {
  const other = createOwnerStore({ storeKey: "app-two.wallet.owner.v1", changeEvent: "app-two-wallet" });
  store.saveRecovery(FAKE);
  store.saveReplacement(OTHER);
  expect(other.loadRecovery()).toBeNull();
  expect(other.loadReplacement()).toBeNull();
});

test("a legacy pending key for the stored wallet becomes the recovery key", () => {
  localStorage.setItem(KEY, JSON.stringify(FAKE));
  localStorage.setItem(`${KEY}:pending`, JSON.stringify({ ...FAKE, credentialId: "cred-new", address: "0x0def" }));
  const migrated = fresh();
  expect(migrated.loadRecovery()?.credentialId).toBe("cred-new");
  expect(migrated.loadReplacement()).toBeNull();
  expect(localStorage.getItem(`${KEY}:pending`)).toBeNull();
});

test("a legacy pending key for another wallet becomes the replacement", () => {
  localStorage.setItem(KEY, JSON.stringify(FAKE));
  localStorage.setItem(`${KEY}:pending`, JSON.stringify(OTHER));
  const migrated = fresh();
  expect(migrated.loadReplacement()).toEqual(OTHER);
  expect(migrated.loadRecovery()).toBeNull();
  expect(localStorage.getItem(`${KEY}:pending`)).toBeNull();
});

test("a legacy pending key with no stored wallet becomes the replacement", () => {
  localStorage.setItem(`${KEY}:pending`, JSON.stringify(OTHER));
  expect(fresh().loadReplacement()).toEqual(OTHER);
});

test("a legacy key never overwrites a filled slot", () => {
  const kept = { ...FAKE, credentialId: "cred-kept" };
  localStorage.setItem(KEY, JSON.stringify(FAKE));
  localStorage.setItem(`${KEY}:recovery`, JSON.stringify(kept));
  localStorage.setItem(`${KEY}:pending`, JSON.stringify({ ...FAKE, credentialId: "cred-legacy" }));
  const migrated = fresh();
  expect(migrated.loadRecovery()).toEqual(kept);
  expect(localStorage.getItem(`${KEY}:pending`)).toBeNull();
});

test("a replacement in progress does not disturb a recovery", async () => {
  const { startSessionRecovery } = await import("../session/wallet-recovery.js");
  store.save(FAKE);
  store.saveReplacement(OTHER);
  const key = { ...FAKE, credentialId: "cred-recovery", ownerPubKey: "0x0777" };
  const api = {
    account: {
      walletRecovery: async () => ({ enabled: true, state: "none" as const, readyAt: null, newOwnerGuid: null, guardianPubkey: null }),
      startWalletRecovery: async () => ({ enabled: true, state: "waiting" as const, readyAt: 1, newOwnerGuid: null, guardianPubkey: null }),
      completeWalletRecovery: async () => ({ enabled: true, state: "none" as const, readyAt: null, newOwnerGuid: null, guardianPubkey: null }),
    },
  };
  await startSessionRecovery(api, FAKE.address, {
    createOwnerKey: async () => ({ privateKeyHex: "0x1", sealed: key }),
    loadRecovery: () => store.loadRecovery(),
    saveRecovery: (sealed) => store.saveRecovery(sealed),
    clearRecovery: () => store.clearRecovery(),
    saveOwner: (sealed) => store.save(sealed),
  });
  expect(store.loadReplacement()).toEqual(OTHER);
  expect(store.loadRecovery()?.credentialId).toBe("cred-recovery");
});
