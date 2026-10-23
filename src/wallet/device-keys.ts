export interface DeviceKeyStore {
  save(credentialId: string, key: CryptoKey): Promise<void>;
  load(credentialId: string): Promise<CryptoKey | null>;
}

const DATABASE = "medialane-wallet";
const STORE = "device-keys";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function run<T>(mode: IDBTransactionMode, act: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  try {
    return await new Promise<T>((resolve, reject) => {
      const request = act(db.transaction(STORE, mode).objectStore(STORE));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

export const indexedDbDeviceKeys: DeviceKeyStore = {
  async save(credentialId, key) {
    await run("readwrite", (store) => store.put(key, credentialId));
  },
  async load(credentialId) {
    return ((await run("readonly", (store) => store.get(credentialId))) as CryptoKey | undefined) ?? null;
  },
};
