import type { SealedOwner } from "./types.js";
import { normalizeWalletAddress } from "./addresses.js";

export interface OwnerStore {
  load(): SealedOwner | null;
  loadAddress(): string | null;
  save(sealed: SealedOwner): void;
  clear(): void;
  loadReplacement(): SealedOwner | null;
  saveReplacement(sealed: SealedOwner): void;
  clearReplacement(): void;
  loadRecovery(): SealedOwner | null;
  saveRecovery(sealed: SealedOwner): void;
  clearRecovery(): void;
  notifyChange(): void;
  onChange(listener: () => void): () => void;
}

function read(key: string): SealedOwner | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as SealedOwner) : null;
  } catch {
    return null;
  }
}

function sameWallet(a: string, b: string): boolean {
  try {
    return normalizeWalletAddress(a) === normalizeWalletAddress(b);
  } catch {
    return false;
  }
}

export function createOwnerStore(config: { storeKey: string; changeEvent: string }): OwnerStore {
  const { storeKey, changeEvent } = config;
  const replacementKey = `${storeKey}:replacement`;
  const recoveryKey = `${storeKey}:recovery`;
  const legacyPendingKey = `${storeKey}:pending`;

  const announce = (): void => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new Event(changeEvent));
  };

  const moveLegacyPending = (): void => {
    const legacy = read(legacyPendingKey);
    if (!legacy) return;
    const owner = read(storeKey);
    const target = owner && sameWallet(owner.address, legacy.address) ? recoveryKey : replacementKey;
    if (!read(target)) localStorage.setItem(target, JSON.stringify(legacy));
    localStorage.removeItem(legacyPendingKey);
  };

  if (typeof window !== "undefined") moveLegacyPending();

  return {
    load: () => read(storeKey),
    loadAddress() {
      return this.load()?.address ?? null;
    },
    save(sealed) {
      const previous = this.load();
      if (previous && previous.address !== sealed.address) {
        localStorage.setItem(`${storeKey}:${previous.address}`, JSON.stringify(previous));
      }
      localStorage.setItem(storeKey, JSON.stringify(sealed));
      announce();
    },
    clear() {
      localStorage.removeItem(storeKey);
      announce();
    },
    loadReplacement: () => read(replacementKey),
    saveReplacement: (sealed) => localStorage.setItem(replacementKey, JSON.stringify(sealed)),
    clearReplacement: () => localStorage.removeItem(replacementKey),
    loadRecovery: () => read(recoveryKey),
    saveRecovery: (sealed) => localStorage.setItem(recoveryKey, JSON.stringify(sealed)),
    clearRecovery: () => localStorage.removeItem(recoveryKey),
    notifyChange: announce,
    onChange(listener) {
      window.addEventListener(changeEvent, listener);
      return () => window.removeEventListener(changeEvent, listener);
    },
  };
}
