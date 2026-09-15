import { describe, expect, test } from "bun:test";
import { computeAccountAddress } from "../business-provisioning/account.js";
import {
  deriveAesKey,
  sealPrivateKey,
  signWithPrivateKey,
  starkKeyPairFromPrivateKey,
  unsealPrivateKey,
} from "./crypto.js";

const PRIVATE_KEY = "0x012b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b2b";
const PUBLIC_KEY = "0x677874f055a89ae0c0bc8cfba7ca10828ec9b3a6757ce9d926d6446ebe91668";
const ADDRESS = "0x6958ce9523a63b831c5d3a691059affe47dfaab5124a9d7bf10f80a080b8cf";
const MESSAGE_HASH = "0x1234";
const SIGNATURE = [
  "0x2b7f1d3ed9b9b930f0591ecbcc4dbff9d0756392380732c52ab885b20de5765",
  "0x458ae1bfd6dd3f1d4b7a512a49037fa24cb2af17c457a067a3976cc5434172c",
];

const PRF_SECRET_B64 = "AwoRGB8mLTQ7QklQV15lbHN6gYiPlp2kq7K5wMfO1dw=";
const IV_B64 = "BRAbJjE8R1JdaHN+";

const SEALED_BY_APP = {
  "medialane-io-owner-key":
    "PaOMvTir9uNzDWVRUv8aoUcY5BRp3kb3LKURbpwEzeKInDnbC/8NAQ9V2Y74XunBQsIsmcJnMavn0ZYGVX8RA/WWDrwFLPmepSCL29rbdnKmsw==",
  "medialane-portal-owner-key":
    "7yHoAqz8fkkTxoMPIsWDHE3cixjS+/U1Dd6pojFxH3doW9IXueb9LU/8loyF7lIFSCrgmhq2dUB6d6RtGmhAgnlNvS/qwcM85oX9CUPyeFUy0Q==",
  "mediawallet-owner-key":
    "UZRng/3Hcx4L+SYAP+FxPSHh6z8ydQaptBp8XyCJEB3bZaIqSkKzd5Hy6J4a5ZTanrZClYAn6gjGMS3rESwcPCqJTJ+fsng59Pmqqu+6JfYoCQ==",
} as const;

const bytes = (b64: string): Uint8Array => Uint8Array.from(Buffer.from(b64, "base64"));
const toB64 = (buf: ArrayBuffer): string => Buffer.from(new Uint8Array(buf)).toString("base64");
const info = (value: string): Uint8Array => new TextEncoder().encode(value);

describe("an owner key seals and unseals the same way for every app", () => {
  for (const [hkdfInfo, sealed] of Object.entries(SEALED_BY_APP)) {
    test(`${hkdfInfo} seals to the recorded bytes`, async () => {
      const aes = await deriveAesKey(bytes(PRF_SECRET_B64), info(hkdfInfo));
      expect(toB64(await sealPrivateKey(aes, bytes(IV_B64), PRIVATE_KEY))).toBe(sealed);
    });

    test(`${hkdfInfo} unseals a wallet sealed before this code moved`, async () => {
      const aes = await deriveAesKey(bytes(PRF_SECRET_B64), info(hkdfInfo));
      expect(await unsealPrivateKey(aes, bytes(IV_B64), bytes(sealed))).toBe(PRIVATE_KEY);
    });
  }

  test("each app's key-derivation info seals the same key differently", () => {
    const sealed = Object.values(SEALED_BY_APP);
    expect(new Set(sealed).size).toBe(sealed.length);
  });

  test("one app cannot unseal another app's wallet", async () => {
    const aes = await deriveAesKey(bytes(PRF_SECRET_B64), info("medialane-io-owner-key"));
    await expect(
      unsealPrivateKey(aes, bytes(IV_B64), bytes(SEALED_BY_APP["mediawallet-owner-key"])),
    ).rejects.toThrow();
  });
});

describe("a key always yields the same wallet", () => {
  test("the private key yields the recorded public key", () => {
    expect(starkKeyPairFromPrivateKey(PRIVATE_KEY).publicKeyHex).toBe(PUBLIC_KEY);
  });

  test("the public key yields the recorded address", () => {
    expect(computeAccountAddress(PUBLIC_KEY, 0)).toBe(ADDRESS);
  });

  test("signing is deterministic", () => {
    expect(signWithPrivateKey(PRIVATE_KEY, MESSAGE_HASH)).toEqual(SIGNATURE as unknown as [string, string]);
  });
});
