import { test, expect } from "bun:test";
import { typedData as starknetTypedData } from "starknet";
import { computeOwnerGuid, ownerAliveTypedData } from "../starknet/media-wallet/owners.js";
import { signWithPrivateKey, starkKeyPairFromPrivateKey } from "../starknet/passkey-wallet/crypto.js";
import { adoptSessionWallet, setupSessionWalletKey, type SessionWalletKeyDeps } from "./session-wallet.js";

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

const privateKeyHex = "0x1234567890abcdef";
const ownerPubKey = starkKeyPairFromPrivateKey(privateKeyHex).publicKeyHex;

function keyDeps() {
  const saved: unknown[] = [];
  const deps: SessionWalletKeyDeps = {
    createOwnerKey: async () => ({
      privateKeyHex,
      sealed: { credentialId: "c", ownerPubKey, address: "", iv: "i", ciphertext: "x" },
    }),
    saveOwner: (sealed) => {
      saved.push(sealed);
    },
    now: () => 1_000,
  };
  return { deps, saved };
}

test("setupSessionWalletKey signs the owner-alive proof for the wallet with the new key", async () => {
  const sent: unknown[] = [];
  const { deps } = keyDeps();
  await setupSessionWalletKey(
    { setupWalletKey: async (params) => (sent.push(params), { walletAddress: "0xabc" }) },
    "0xabc",
    deps,
  );
  const expected = signWithPrivateKey(
    privateKeyHex,
    starknetTypedData.getMessageHash(ownerAliveTypedData(computeOwnerGuid(ownerPubKey), 1_600, "SN_MAIN") as never, "0xabc"),
  );
  expect(sent).toEqual([{ newOwnerPubkey: ownerPubKey, signature: expected, expiration: 1_600 }]);
});

test("setupSessionWalletKey saves the new key for the wallet's address", async () => {
  const { deps, saved } = keyDeps();
  await setupSessionWalletKey({ setupWalletKey: async () => ({ walletAddress: "0xabc" }) }, "0xabc", deps);
  expect(saved).toEqual([{ credentialId: "c", ownerPubKey, address: "0xabc", iv: "i", ciphertext: "x" }]);
});

test("setupSessionWalletKey saves nothing when the setup is refused", async () => {
  const { deps, saved } = keyDeps();
  const api = { setupWalletKey: async () => Promise.reject(new Error("Verify your email first")) };
  await expect(setupSessionWalletKey(api, "0xabc", deps)).rejects.toThrow("Verify your email first");
  expect(saved).toEqual([]);
});
