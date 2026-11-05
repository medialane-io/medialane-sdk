import { expect, test } from "bun:test";
import { createIndexedDbDeviceKeys } from "./device-keys.js";

type Outcome = "commit" | "abort";

function fakeIndexedDb(outcome: Outcome, stored = new Map<string, unknown>()): () => IDBFactory {
  const later = (fn: () => void) => queueMicrotask(fn);
  const transaction = () => {
    const tx: Record<string, unknown> & { error: unknown } = { error: null };
    const finish = (commit: () => void) =>
      later(() => {
        if (outcome === "commit") {
          commit();
          (tx.oncomplete as (() => void) | undefined)?.();
        } else {
          tx.error = new Error("quota exceeded");
          (tx.onabort as (() => void) | undefined)?.();
        }
      });
    const request = (result: unknown, commit: () => void = () => {}) => {
      const req: Record<string, unknown> = { result };
      later(() => {
        (req.onsuccess as (() => void) | undefined)?.();
        finish(commit);
      });
      return req;
    };
    tx.objectStore = () => ({
      put: (value: unknown, key: string) => request(key, () => stored.set(key, value)),
      get: (key: string) => request(stored.get(key)),
    });
    return tx;
  };
  return () =>
    ({
      open: () => {
        const req: Record<string, unknown> = {};
        later(() => {
          req.result = { transaction, close: () => {} };
          (req.onsuccess as (() => void) | undefined)?.();
        });
        return req;
      },
    }) as unknown as IDBFactory;
}

const KEY = { type: "secret" } as unknown as CryptoKey;

test("a key is saved once the transaction commits", async () => {
  const stored = new Map<string, unknown>();
  await createIndexedDbDeviceKeys(fakeIndexedDb("commit", stored)).save("cred", KEY);
  expect(stored.get("cred")).toBe(KEY);
});

test("a write that aborts after the request succeeded is reported", async () => {
  await expect(createIndexedDbDeviceKeys(fakeIndexedDb("abort")).save("cred", KEY)).rejects.toThrow("quota exceeded");
});

test("load returns the stored key after commit", async () => {
  const stored = new Map<string, unknown>([["cred", KEY]]);
  expect(await createIndexedDbDeviceKeys(fakeIndexedDb("commit", stored)).load("cred")).toBe(KEY);
  expect(await createIndexedDbDeviceKeys(fakeIndexedDb("commit", stored)).load("other")).toBeNull();
});
