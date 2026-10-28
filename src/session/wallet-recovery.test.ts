import { describe, expect, test } from "bun:test";
import { computeOwnerGuid } from "../starknet/media-wallet/owners.js";
import type { SealedOwner } from "../wallet/types.js";
import type { WalletRecovery } from "../api/domains/account.js";
import { finishSessionRecovery, startSessionRecovery, turnOnRecovery, type SessionRecoveryDeps } from "./wallet-recovery.js";

const WALLET = "0xabc";
const KEY = "0x0222";
const created: SealedOwner = { credentialId: "c", ownerPubKey: KEY, address: "0x999", iv: "i", ciphertext: "x" };
const pendingFor = (pubkey: string, address = WALLET): SealedOwner => ({ ...created, ownerPubKey: pubkey, address });

const none: WalletRecovery = { enabled: true, state: "none", readyAt: null, newOwnerGuid: null, guardianPubkey: null };
const waitingFor = (pubkey: string): WalletRecovery => ({ enabled: true, state: "waiting", readyAt: 1_900_000_000, newOwnerGuid: computeOwnerGuid(pubkey), guardianPubkey: null });

function deps(pending: SealedOwner | null = null) {
  const log: string[] = [];
  let held = pending;
  let owner: SealedOwner | null = null;
  const d: SessionRecoveryDeps = {
    createOwnerKey: async () => (log.push("create"), { privateKeyHex: "0x1", sealed: created }),
    loadPending: () => held,
    savePending: (sealed) => (log.push("savePending"), void (held = sealed)),
    clearPending: () => (log.push("clearPending"), void (held = null)),
    saveOwner: (sealed) => (log.push("saveOwner"), void (owner = sealed)),
  };
  return { d, log, held: () => held, owner: () => owner };
}

describe("starting a recovery on a new browser", () => {
  test("makes a key for this browser, keeps it as pending for the wallet, and asks the server to wait for it", async () => {
    const { d, log, held } = deps();
    const asked: string[] = [];
    const api = {
      account: {
        walletRecovery: async () => none,
        startWalletRecovery: async ({ newOwnerPubkey }: { newOwnerPubkey: string }) => (asked.push(newOwnerPubkey), waitingFor(newOwnerPubkey)),
        completeWalletRecovery: async () => none,
      },
    };
    const result = await startSessionRecovery(api, WALLET, d);
    expect(log).toEqual(["create", "savePending"]);
    expect(held()).toEqual({ ...created, address: WALLET });
    expect(asked).toEqual([KEY]);
    expect(result.state).toBe("waiting");
  });

  test("never makes this browser's key the active owner while it waits", async () => {
    const { d, log } = deps();
    const api = { account: { walletRecovery: async () => none, startWalletRecovery: async ({ newOwnerPubkey }: { newOwnerPubkey: string }) => waitingFor(newOwnerPubkey), completeWalletRecovery: async () => none } };
    await startSessionRecovery(api, WALLET, d);
    expect(log).not.toContain("saveOwner");
  });

  test("coming back reuses the key already pending and asks for nothing more while it waits", async () => {
    const { d, log } = deps(pendingFor("0x0777"));
    let started = 0;
    const api = { account: { walletRecovery: async () => waitingFor("0x0777"), startWalletRecovery: async () => (started++, none), completeWalletRecovery: async () => none } };
    const result = await startSessionRecovery(api, WALLET, d);
    expect(log).toEqual([]);
    expect(started).toBe(0);
    expect(result.state).toBe("waiting");
  });

  test("a pending key whose recovery was replaced or expired is started again without a new passkey", async () => {
    const { d, log } = deps(pendingFor("0x0777"));
    const asked: string[] = [];
    const api = { account: { walletRecovery: async () => none, startWalletRecovery: async ({ newOwnerPubkey }: { newOwnerPubkey: string }) => (asked.push(newOwnerPubkey), waitingFor(newOwnerPubkey)), completeWalletRecovery: async () => none } };
    await startSessionRecovery(api, WALLET, d);
    expect(log).toEqual([]);
    expect(asked).toEqual(["0x0777"]);
  });

  test("a pending key for another wallet is not used", async () => {
    const { d, log } = deps(pendingFor("0x0777", "0xdef"));
    const api = { account: { walletRecovery: async () => none, startWalletRecovery: async ({ newOwnerPubkey }: { newOwnerPubkey: string }) => waitingFor(newOwnerPubkey), completeWalletRecovery: async () => none } };
    await startSessionRecovery(api, WALLET, d);
    expect(log).toEqual(["create", "savePending"]);
  });
});

describe("finishing a recovery", () => {
  test("completes it for the pending key, then makes that key the owner on this browser", async () => {
    const { d, log, owner, held } = deps(pendingFor(KEY));
    const asked: string[] = [];
    const api = { account: { walletRecovery: async () => none, startWalletRecovery: async () => none, completeWalletRecovery: async ({ newOwnerPubkey }: { newOwnerPubkey: string }) => (asked.push(newOwnerPubkey), none) } };
    await finishSessionRecovery(api, WALLET, d);
    expect(asked).toEqual([KEY]);
    expect(log).toEqual(["saveOwner", "clearPending"]);
    expect(owner()?.address).toBe(WALLET);
    expect(held()).toBeNull();
  });

  test("keeps the pending key when the server says it is not ready", async () => {
    const { d, log, held } = deps(pendingFor(KEY));
    const api = { account: { walletRecovery: async () => none, startWalletRecovery: async () => none, completeWalletRecovery: async () => { throw new Error("The recovery is not ready yet"); } } };
    await expect(finishSessionRecovery(api, WALLET, d)).rejects.toThrow("not ready yet");
    expect(log).toEqual([]);
    expect(held()).not.toBeNull();
  });

  test("without a pending key there is nothing to finish", async () => {
    const { d } = deps();
    const api = { account: { walletRecovery: async () => none, startWalletRecovery: async () => none, completeWalletRecovery: async () => none } };
    await expect(finishSessionRecovery(api, WALLET, d)).rejects.toThrow();
  });
});

describe("turning recovery on", () => {
  const sealed = pendingFor("0x0abc");

  test("sets Medialane's guardian with the key the server names", async () => {
    const set: Array<[SealedOwner, string]> = [];
    const api = { account: { walletRecovery: async (): Promise<WalletRecovery> => ({ ...none, enabled: false, guardianPubkey: "0x0aaa" }) } };
    await turnOnRecovery(api, { setFirstGuardian: async (s, pubkey) => (set.push([s, pubkey]), "0xtx") }, sealed);
    expect(set).toEqual([[sealed, "0x0aaa"]]);
  });

  test("does nothing when it is already on", async () => {
    let calls = 0;
    const api = { account: { walletRecovery: async () => none } };
    await turnOnRecovery(api, { setFirstGuardian: async () => (calls++, "0xtx") }, sealed);
    expect(calls).toBe(0);
  });

  test("says plainly when the server cannot offer it", async () => {
    const api = { account: { walletRecovery: async (): Promise<WalletRecovery> => ({ ...none, enabled: false, guardianPubkey: null }) } };
    await expect(turnOnRecovery(api, { setFirstGuardian: async () => "0xtx" }, sealed)).rejects.toThrow("Recovery is not available right now");
  });
});
