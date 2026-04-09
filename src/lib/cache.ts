// In-memory TTL cache for API responses
// Returns stale data when fresh fetch fails (resilience pattern)

interface CacheEntry<T> {
  data: T;
  expiry: number;
  setAt: number;
}

class TTLCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();

  /**
   * Get cached data. Returns { data, fresh } where fresh=false means expired but available.
   * Returns null if key doesn't exist at all.
   */
  get<T>(key: string): { data: T; fresh: boolean } | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    return {
      data: entry.data as T,
      fresh: now < entry.expiry,
    };
  }

  /**
   * Set cache entry with TTL in milliseconds
   */
  set<T>(key: string, data: T, ttlMs: number): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      expiry: now + ttlMs,
      setAt: now,
    });
  }

  /**
   * Remove a specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size for monitoring
   */
  size(): number {
    return this.cache.size;
  }
}

// Singleton instance — shared across all API routes in the same process
export const cache = new TTLCache();
