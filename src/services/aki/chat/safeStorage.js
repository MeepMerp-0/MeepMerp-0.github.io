// One Web Storage area with every access guarded. A write the browser refuses is kept in memory for this page instead,
// and that copy is read first until a later write succeeds. The area is looked up on every access, because reading
// window.localStorage itself throws where site data is blocked.
export class SafeStorage {
  #area;
  #memory = new Map();

  constructor(area) {
    this.#area = area;
  }

  get(key) {
    if (this.#memory.has(key)) return this.#memory.get(key);
    try { return this.#storage()?.getItem(key) ?? null; } catch { return null; }
  }

  set(key, value) {
    try {
      const storage = this.#storage();
      if (!storage) throw new Error('no storage');
      storage.setItem(key, value);
      this.#memory.delete(key);
    } catch { this.#memory.set(key, value); }
  }

  remove(key) {
    this.#memory.delete(key);
    try { this.#storage()?.removeItem(key); } catch { /* memory only */ }
  }

  #storage() {
    try { return this.#area(); } catch { return null; }
  }
}

export const localStore = new SafeStorage(() => window.localStorage);
export const tabStore = new SafeStorage(() => window.sessionStorage);
