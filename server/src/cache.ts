interface Entry {
  value: Promise<unknown>;
  expiresAt: number;
}

const DEFAULT_MAX_ENTRIES = 2_000;

/**
 * Small in-memory TTL cache. Stores the in-flight promise so concurrent
 * requests for the same key share one upstream call.
 */
export class TtlCache {
  private readonly entries = new Map<string, Entry>();

  constructor(
    private readonly now: () => number = Date.now,
    private readonly maxEntries = DEFAULT_MAX_ENTRIES,
  ) {}

  get size(): number {
    return this.entries.size;
  }

  getOrLoad<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
    const hit = this.entries.get(key);
    if (hit && hit.expiresAt > this.now()) return hit.value as Promise<T>;

    const value = loader();
    this.entries.set(key, { value, expiresAt: this.now() + ttlMs });
    // Failed loads must not be cached, or one LTA hiccup would stick for the whole TTL
    value.catch(() => {
      if (this.entries.get(key)?.value === value) this.entries.delete(key);
    });
    if (this.entries.size > this.maxEntries) this.evictExpired();
    return value;
  }

  private evictExpired(): void {
    const now = this.now();
    for (const [key, entry] of this.entries) {
      if (entry.expiresAt <= now) this.entries.delete(key);
    }
  }
}
