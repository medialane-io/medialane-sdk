export interface DeviceKeyStore {
  save(credentialId: string, key: CryptoKey): Promise<void>;
  load(credentialId: string): Promise<CryptoKey | null>;
}

const DATABASE = "medialane-wallet";
const STORE = "device-keys";

export function createIndexedDbDeviceKeys(factory: () => IDBFactory = () => indexedDB): DeviceKeyStore {
  function open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = factory().open(DATABASE, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function run<T>(mode: IDBTransactionMode, act: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const db = await open();
    try {
      return await new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE, mode);
        const request = act(transaction.objectStore(STORE));
        const fail = () => reject(transaction.error ?? request.error);
        transaction.oncomplete = () => resolve(request.result);
        transaction.onerror = fail;
        transaction.onabort = fail;
      });
    } finally {
      db.close();
    }
  }

  return {
    async save(credentialId, key) {
      await run("readwrite", (store) => store.put(key, credentialId));
    },
    async load(credentialId) {
      return ((await run("readonly", (store) => store.get(credentialId))) as CryptoKey | undefined) ?? null;
    },
  };
}

export const indexedDbDeviceKeys: DeviceKeyStore = createIndexedDbDeviceKeys();
