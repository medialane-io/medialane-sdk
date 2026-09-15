import type { SealedOwner } from "./types.js";

export interface OwnerStore {
  load(): SealedOwner | null;
  loadAddress(): string | null;
  save(sealed: SealedOwner): void;
  clear(): void;
  notifyChange(): void;
  onChange(listener: () => void): () => void;
}

export function createOwnerStore(config: { storeKey: string; changeEvent: string }): OwnerStore {
  const { storeKey, changeEvent } = config;
  const announce = (): void => {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new Event(changeEvent));
  };
  return {
    load() {
      if (typeof window === "undefined") return null;
      try {
        const raw = localStorage.getItem(storeKey);
        return raw ? (JSON.parse(raw) as SealedOwner) : null;
      } catch {
        return null;
      }
    },
    loadAddress() {
      return this.load()?.address ?? null;
    },
    save(sealed) {
      localStorage.setItem(storeKey, JSON.stringify(sealed));
      announce();
    },
    clear() {
      localStorage.removeItem(storeKey);
      announce();
    },
    notifyChange: announce,
    onChange(listener) {
      window.addEventListener(changeEvent, listener);
      return () => window.removeEventListener(changeEvent, listener);
    },
  };
}
