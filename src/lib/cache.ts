import { kv } from "@vercel/kv";

const memoryCache = new Map<string, { data: unknown; expiry: number }>();

function isKvAvailable(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

export async function cached<T>(key: string, ttlSeconds: number, fetcher: () => Promise<T>): Promise<{ data: T; fromCache: boolean }> {
  // Try cache first
  try {
    if (isKvAvailable()) {
      const cached = await kv.get<T>(key);
      if (cached !== null && cached !== undefined) return { data: cached, fromCache: true };
    } else {
      const entry = memoryCache.get(key);
      if (entry && entry.expiry > Date.now()) return { data: entry.data as T, fromCache: true };
    }
  } catch (e) {
    console.warn(`Cache read failed for ${key}:`, e);
  }

  // Fetch fresh
  const fresh = await fetcher();

  // Store in cache
  try {
    if (isKvAvailable()) {
      await kv.set(key, fresh, { ex: ttlSeconds });
    } else {
      memoryCache.set(key, { data: fresh, expiry: Date.now() + ttlSeconds * 1000 });
    }
  } catch (e) {
    console.warn(`Cache write failed for ${key}:`, e);
  }

  return { data: fresh, fromCache: false };
}
