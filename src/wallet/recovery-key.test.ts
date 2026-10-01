import { test, expect } from "bun:test";
import { computeAccountAddress } from "../starknet/business-provisioning/account.js";
import { starkKeyPairFromPrivateKey } from "../starknet/passkey-wallet/crypto.js";
import { encodeRecoveryKey, parseRecoveryKey, InvalidRecoveryKeyError } from "./recovery-key.js";

const PRIVATE_KEY = "0x01" + "2b".repeat(31);
const WALLET = "0x071c174b93d24b72fc4b25e1d28fce1267e30c4c57fa4b0980a403a97fa84f5f";

test("a recovery key carries the wallet address and the key", () => {
  const encoded = encodeRecoveryKey({ walletAddress: WALLET, privateKey: PRIVATE_KEY });
  expect(encoded).toBe(`medialane-recovery:v1:${WALLET}:${PRIVATE_KEY}`);
  expect(parseRecoveryKey(encoded)).toEqual({ walletAddress: WALLET, privateKey: PRIVATE_KEY });
});

test("any owner key restores its wallet, not only the key that deployed it", () => {
  const encoded = encodeRecoveryKey({ walletAddress: WALLET, privateKey: PRIVATE_KEY });
  const { publicKeyHex } = starkKeyPairFromPrivateKey(PRIVATE_KEY);
  expect(parseRecoveryKey(encoded).walletAddress).not.toBe(computeAccountAddress(publicKeyHex, 0));
});

test("an address written without leading zeros reads the same", () => {
  const short = `0x${BigInt(WALLET).toString(16)}`;
  expect(parseRecoveryKey(`medialane-recovery:v1:${short}:${PRIVATE_KEY}`).walletAddress).toBe(WALLET);
});

test("surrounding spaces are ignored", () => {
  expect(parseRecoveryKey(`  medialane-recovery:v1:${WALLET}:${PRIVATE_KEY}\n`).walletAddress).toBe(WALLET);
});

test("a bare private key saved before v1 restores the wallet it deployed", () => {
  const { publicKeyHex } = starkKeyPairFromPrivateKey(PRIVATE_KEY);
  expect(parseRecoveryKey(PRIVATE_KEY)).toEqual({ walletAddress: computeAccountAddress(publicKeyHex, 0), privateKey: PRIVATE_KEY });
});

test("anything else is not a recovery key", () => {
  for (const bad of [
    "",
    "nonsense",
    "0xzz",
    "medialane-recovery:v1:",
    `medialane-recovery:v1:${WALLET}`,
    `medialane-recovery:v1:not-an-address:${PRIVATE_KEY}`,
    `medialane-recovery:v1:0x0:${PRIVATE_KEY}`,
    `medialane-recovery:v1:${WALLET}:0xzz`,
    `medialane-recovery:v1:${WALLET}:${PRIVATE_KEY}:extra`,
  ]) {
    expect(() => parseRecoveryKey(bad)).toThrow(InvalidRecoveryKeyError);
  }
});
