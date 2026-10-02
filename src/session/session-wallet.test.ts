import { test, expect } from "bun:test";
import type { SealedOwner } from "../wallet/types.js";
import { adoptSessionWallet, claimSessionWallet, type SessionWalletClaimDeps } from "./session-wallet.js";

test("adoptSessionWallet saves the account's wallet and returns it", async () => {
  const saved: string[] = [];
  const wallet = { walletAddress: "0xabc", needsKeySetup: true };
  expect(await adoptSessionWallet({ getSessionWallet: async () => wallet }, (a) => saved.push(a))).toEqual(wallet);
  expect(saved).toEqual(["0xabc"]);
});

test("adoptSessionWallet returns null and saves nothing when the account has no wallet", async () => {
  const saved: string[] = [];
  expect(await adoptSessionWallet({ getSessionWallet: async () => null }, (a) => saved.push(a))).toBeNull();
  expect(saved).toEqual([]);
});

test("adoptSessionWallet throws when the lookup fails, so it is never read as no wallet", async () => {
  const lookup = { getSessionWallet: async () => Promise.reject(new Error("network down")) };
  await expect(adoptSessionWallet(lookup, () => {})).rejects.toThrow("network down");
});

const WALLET = "0xabc";
const fresh: SealedOwner = { credentialId: "c", ownerPubKey: "0x1", address: "0x999", iv: "i", ciphertext: "x" };

function claimDeps(initial: SealedOwner | null = null) {
  const log: string[] = [];
  let stored = initial;
  let created = 0;
  const deps: SessionWalletClaimDeps = {
    createOwnerKey: async () => {
      created++;
      log.push("create");
      return { privateKeyHex: "0x1", sealed: fresh };
    },
    loadOwner: () => stored,
    saveOwner: (sealed) => {
      log.push("save");
      stored = sealed;
    },
    removeOwner: async (_sealed, guid) => {
      log.push(`remove:${guid}`);
    },
  };
  return { deps, log, stored: () => stored, created: () => created };
}

test("claimSessionWallet saves the new key for the wallet before it asks the server", async () => {
  const { deps, log, stored } = claimDeps();
  const api = { setupWalletKey: async () => (log.push("api"), { walletAddress: WALLET, removeOwnerGuid: null }) };
  await claimSessionWallet(api, WALLET, deps);
  expect(log).toEqual(["create", "save", "api"]);
  expect(stored()).toEqual({ ...fresh, address: WALLET });
});

test("claimSessionWallet removes Medialane's key with the saved key once the server has added it", async () => {
  const { deps, log } = claimDeps();
  const api = { setupWalletKey: async () => ({ walletAddress: WALLET, removeOwnerGuid: "0x77" }) };
  await claimSessionWallet(api, WALLET, deps);
  expect(log).toEqual(["create", "save", "remove:0x77"]);
});

test("claimSessionWallet removes nothing when Medialane's key is already gone", async () => {
  const { deps, log } = claimDeps();
  await claimSessionWallet({ setupWalletKey: async () => ({ walletAddress: WALLET, removeOwnerGuid: null }) }, WALLET, deps);
  expect(log.some((entry) => entry.startsWith("remove"))).toBe(false);
});

test("after a failed server call the retry reuses the saved key and makes no second one", async () => {
  const { deps, created } = claimDeps();
  await expect(
    claimSessionWallet({ setupWalletKey: async () => Promise.reject(new Error("timeout")) }, WALLET, deps),
  ).rejects.toThrow("timeout");
  await claimSessionWallet({ setupWalletKey: async () => ({ walletAddress: WALLET, removeOwnerGuid: null }) }, WALLET, deps);
  expect(created()).toBe(1);
});

test("a cancelled removal keeps the key, and the retry removes again without a new key", async () => {
  const { deps, log, created } = claimDeps();
  const api = { setupWalletKey: async () => ({ walletAddress: WALLET, removeOwnerGuid: "0x77" }) };
  let attempts = 0;
  const flaky: SessionWalletClaimDeps = {
    ...deps,
    removeOwner: async (sealed, guid) => {
      if (attempts++ === 0) throw new Error("Passkey prompt was cancelled.");
      return deps.removeOwner(sealed, guid);
    },
  };
  await expect(claimSessionWallet(api, WALLET, flaky)).rejects.toThrow("cancelled");
  await claimSessionWallet(api, WALLET, flaky);
  expect(created()).toBe(1);
  expect(log).toContain("remove:0x77");
});

test("a failed key creation (no PRF) saves nothing and never reaches the server", async () => {
  const { deps, log } = claimDeps();
  const failing: SessionWalletClaimDeps = {
    ...deps,
    createOwnerKey: async () => Promise.reject(new Error("This browser didn't return a passkey PRF secret.")),
  };
  let called = false;
  const api = { setupWalletKey: async () => ((called = true), { walletAddress: WALLET, removeOwnerGuid: null }) };
  await expect(claimSessionWallet(api, WALLET, failing)).rejects.toThrow("PRF");
  expect(called).toBe(false);
  expect(log).toEqual([]);
});

test("a key already saved for another wallet is not reused", async () => {
  const other: SealedOwner = { ...fresh, ownerPubKey: "0x5", address: "0xdef" };
  const { deps, created } = claimDeps(other);
  await claimSessionWallet({ setupWalletKey: async () => ({ walletAddress: WALLET, removeOwnerGuid: null }) }, WALLET, deps);
  expect(created()).toBe(1);
});
