/** Where per-user UI state (column widths, filters, density...) is kept. Both calls may be async (a REST endpoint). */
export interface StateStorage {
  get(key: string): unknown | Promise<unknown>;
  set(key: string, value: unknown): void | Promise<void>;
}

const local: StateStorage = {
  get(key) {
    try {
      return JSON.parse(localStorage.getItem(`optikos:${key}`) ?? 'null');
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(`optikos:${key}`, JSON.stringify(value));
    } catch {
      // private mode or a full disk: the state is a convenience, not data
    }
  },
};

let current: StateStorage = local;

/** Replaces the default (`localStorage`) for every `persist`: send it to your API to follow the user across devices. */
export function setStateStorage(storage: StateStorage | undefined): void {
  current = storage ?? local;
}

// a storage that fails (offline, quota) must never break the screen that asked
export const loadState = <T = unknown>(key: string): Promise<T | null> =>
  new Promise((ok) => ok(current.get(key))).then((v) => (v ?? null) as T | null, () => null);
export const saveState = (key: string, value: unknown): Promise<void> =>
  new Promise<void>((ok) => ok(current.set(key, value))).catch(() => {});
