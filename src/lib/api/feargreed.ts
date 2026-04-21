import { cache } from '@/lib/cache';
import { FEAR_GREED_API, CACHE_TTL } from '@/lib/constants';
import type { FearGreedData } from '@/types/market';

// ---------------------------------------------------------------------------
// Types (API-specific)
// ---------------------------------------------------------------------------

interface FngApiEntry {
  value: string;
  value_classification: string;
  timestamp: string;
}

interface FngApiResponse {
  name: string;
  data: FngApiEntry[];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const CACHE_KEY = 'feargreed:index';

/**
 * Fetch the current Fear & Greed Index from alternative.me.
 *
 * Returns a normalized { value, classification, timestamp } object.
 * Cached for 30 minutes. Returns stale cache on fetch failure.
 */
export async function getFearGreedIndex(): Promise<FearGreedData> {
  // Check cache
  const cached = cache.get<FearGreedData>(CACHE_KEY);
  if (cached?.fresh) return cached.data;

  try {
    const res = await fetch(`${FEAR_GREED_API}/?limit=1`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: Math.floor(CACHE_TTL.FEAR_GREED / 1000) },
    });

    if (!res.ok) {
      throw new Error(`Fear & Greed API ${res.status}: ${res.statusText}`);
    }

    const json: FngApiResponse = await res.json();
    const entry = json.data?.[0];

    if (!entry) {
      throw new Error('Fear & Greed API returned empty data');
    }

    const data: FearGreedData = {
      value: parseInt(entry.value, 10),
      classification: entry.value_classification,
      timestamp: parseInt(entry.timestamp, 10) * 1000, // API returns seconds, we use ms
    };

    cache.set(CACHE_KEY, data, CACHE_TTL.FEAR_GREED);
    return data;
  } catch (err) {
    if (cached) return cached.data;
    throw err;
  }
}

/**
 * Fetch the last N days of Fear & Greed for trend display.
 * Returned oldest-to-newest actually is newest-to-oldest (alternative.me quirk):
 * the API returns [0]=today, [1]=yesterday, [2]=2 days ago...
 */
export async function getFearGreedHistory(limit = 2): Promise<FearGreedData[]> {
  const cacheKey = `feargreed:history:${limit}`;
  const cached = cache.get<FearGreedData[]>(cacheKey);
  if (cached?.fresh) return cached.data;

  try {
    const res = await fetch(`${FEAR_GREED_API}/?limit=${limit}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: Math.floor(CACHE_TTL.FEAR_GREED / 1000) },
    });
    if (!res.ok) throw new Error(`FNG history ${res.status}`);
    const json: FngApiResponse = await res.json();
    const out: FearGreedData[] = (json.data ?? []).map((e) => ({
      value: parseInt(e.value, 10),
      classification: e.value_classification,
      timestamp: parseInt(e.timestamp, 10) * 1000,
    }));
    cache.set(cacheKey, out, CACHE_TTL.FEAR_GREED);
    return out;
  } catch (err) {
    if (cached) return cached.data;
    throw err;
  }
}
