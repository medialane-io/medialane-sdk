import { test, expect } from "bun:test";
import type { Call, ProviderInterface } from "starknet";
import { createMediaWallet, canRemoveDevice, describeDevices } from "./client.js";
import { computeOwnerGuid } from "../starknet/business-provisioning/handoff.js";
import type { GuardianInfo } from "../starknet/business-provisioning/guardian.js";
import type { PasskeyOwner, SealedOwner, WalletExecutor } from "./index.js";

const PRIVATE_KEY = "0x012b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b";
const SEALED: SealedOwner = {
  credentialId: "cred",
  ownerPubKey: "0x677874f055a89ae0c0bc8cfba7ca10828ec9b3a6757ce9d926d6446ebe91668",
  address: "0x6958ce9523a63b831c5d3a691059affe47dfaab5124a9d7bf10f80a080b8cf",
  iv: "iv",
  ciphertext: "ct",
};
const TARGET = "0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7";

function walletWith(overrides: { unlocks?: () => Promise<string> } = {}) {
  const sent: Array<{ userAddress: string; calls: Call[] }> = [];
  let unlockCount = 0;
  const passkey = {
    unlockOwnerKey: async () => {
      unlockCount += 1;
      return overrides.unlocks ? overrides.unlocks() : PRIVATE_KEY;
    },
  } as unknown as PasskeyOwner;
  const executor: WalletExecutor = {
    execute: async ({ userAddress, calls }) => {
      sent.push({ userAddress, calls });
      return { transactionHash: "0xsent" };
    },
  };
  const wallet = createMediaWallet({
    store: {} as never,
    passkey,
    executor,
    provider: () => ({}) as ProviderInterface,
    unlockTtlMs: 10_000,
  });
  return { wallet, sent, unlockCount: () => unlockCount };
}

test("setting a guardian sends one call from the wallet's own address", async () => {
  const { wallet, sent } = walletWith();
  expect(await wallet.setFirstGuardian(SEALED, "0xabc123")).toBe("0xsent");
  expect(sent).toHaveLength(1);
  expect(sent[0]!.userAddress).toBe(SEALED.address);
  expect(sent[0]!.calls).toHaveLength(1);
});

test("a guardian recovers a different account, so the call runs as that account", async () => {
  const { wallet, sent } = walletWith();
  await wallet.triggerEscapeOwner(SEALED, TARGET, "0xdef456");
  await wallet.completeEscapeOwner(SEALED, TARGET);
  expect(sent.map((s) => s.userAddress)).toEqual([TARGET, TARGET]);
});

test("adding and removing a device run as the wallet itself", async () => {
  const { wallet, sent } = walletWith();
  await wallet.addDevice(SEALED, "0xbeef01");
  await wallet.removeDevice(SEALED, "0xfeed01");
  expect(sent.every((s) => s.userAddress === SEALED.address)).toBe(true);
  expect(sent).toHaveLength(2);
});

test("one passkey prompt covers a signature and the transaction that follows", async () => {
  const { wallet, unlockCount } = walletWith();
  const signer = wallet.signerFor(SEALED);
  await signer.signTypedData({
    types: {
      StarknetDomain: [
        { name: "name", type: "shortstring" },
        { name: "version", type: "shortstring" },
        { name: "chainId", type: "shortstring" },
        { name: "revision", type: "shortstring" },
      ],
      Ping: [{ name: "value", type: "felt" }],
    },
    primaryType: "Ping",
    domain: { name: "medialane", version: "1", chainId: "SN_MAIN", revision: "1" },
    message: { value: "1" },
  });
  await signer.execute([{ contractAddress: "0x1", entrypoint: "transfer", calldata: [] }]);
  expect(unlockCount()).toBe(1);
});

test("locking forces the next action to ask for the passkey again", async () => {
  const { wallet, unlockCount } = walletWith();
  await wallet.addDevice(SEALED, "0xbeef01");
  wallet.lock(SEALED.address);
  await wallet.addDevice(SEALED, "0xbeef01");
  expect(unlockCount()).toBe(2);
});

test("a refused passkey is not remembered as an unlocked wallet", async () => {
  let attempt = 0;
  const { wallet, unlockCount } = walletWith({
    unlocks: async () => {
      attempt += 1;
      if (attempt === 1) throw new Error("cancelled");
      return PRIVATE_KEY;
    },
  });
  await expect(wallet.addDevice(SEALED, "0xbeef01")).rejects.toThrow("cancelled");
  expect(await wallet.addDevice(SEALED, "0xbeef01")).toBe("0xsent");
  expect(unlockCount()).toBe(2);
});

test("this device is marked among the account's owners", () => {
  const owners: GuardianInfo[] = [
    { type: "Starknet", guid: computeOwnerGuid("0xaaa"), storedValue: "0xaaa" },
    { type: "Starknet", guid: computeOwnerGuid("0xbbb"), storedValue: "0xbbb" },
  ];
  const devices = describeDevices(owners, "0xbbb");
  expect(devices.map((d) => d.isThisDevice)).toEqual([false, true]);
});

test("the last remaining device cannot be removed", () => {
  const devices = describeDevices([{ type: "Starknet", guid: computeOwnerGuid("0xaaa"), storedValue: "0xaaa" }], "0xaaa");
  expect(canRemoveDevice(devices, devices[0]!.guid)).toBe(false);
});

test("a device that is not an owner cannot be removed", () => {
  const owners: GuardianInfo[] = [
    { type: "Starknet", guid: computeOwnerGuid("0xaaa"), storedValue: "0xaaa" },
    { type: "Starknet", guid: computeOwnerGuid("0xbbb"), storedValue: "0xbbb" },
  ];
  const devices = describeDevices(owners, "0xaaa");
  expect(canRemoveDevice(devices, computeOwnerGuid("0xccc"))).toBe(false);
  expect(canRemoveDevice(devices, computeOwnerGuid("0xbbb"))).toBe(true);
});
