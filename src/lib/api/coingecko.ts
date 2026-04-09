import { cache } from '@/lib/cache';
import { COINGECKO_API_BASE, CACHE_TTL } from '@/lib/constants';

// ---------------------------------------------------------------------------
// Types (CoinGecko-specific, not exported globally)
// ---------------------------------------------------------------------------

interface CoinGeckoPrice {
  usd: number;
  usd_24h_change: number;
  usd_market_cap: number;
  usd_24h_vol: number;
}

export interface MarketDataEntry {
  id: string;
  priceUsd: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
}

export interface MarketChartPoint {
  timestamp: number;
  price: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Fetch from CoinGecko with stale-while-error resilience.
 * Returns stale cache on 429 (rate limit) or network errors.
 */
async function geckoFetch<T>(
  path: string,
  cacheKey: string,
  ttl: number,
  query?: Record<string, string>,
): Promise<T> {
  const cached = cache.get<T>(cacheKey);
  if (cached?.fresh) return cached.data;

  const url = new URL(`${COINGECKO_API_BASE}${path}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      url.searchParams.set(k, v);
    }
  }

  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
      next: { revalidate: Math.floor(ttl / 1000) },
    });

    // CoinGecko free tier: respect rate limits gracefully
    if (res.status === 429) {
      if (cached) return cached.data;
      throw new Error('CoinGecko rate limited (429) and no cached data available');
    }

    if (!res.ok) {
      throw new Error(`CoinGecko ${res.status}: ${res.statusText}`);
    }

    const json = (await res.json()) as T;
    cache.set(cacheKey, json, ttl);
    return json;
  } catch (err) {
    if (cached) return cached.data;
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch price, 24h change, market cap, and volume for a list of CoinGecko IDs.
 *
 * @param ids - CoinGecko coin IDs, e.g. ['bitcoin', 'ethereum', 'solana']
 * @returns Map of id -> MarketDataEntry
 */
export async function getMarketData(
  ids: string[],
): Promise<Record<string, MarketDataEntry>> {
  if (ids.length === 0) return {};

  const idsStr = ids.join(',');
  const cacheKey = `coingecko:prices:${idsStr}`;

  const raw = await geckoFetch<Record<string, CoinGeckoPrice>>(
    '/simple/price',
    cacheKey,
    CACHE_TTL.MARKET_DATA,
    {
      ids: idsStr,
      vs_currencies: 'usd',
      include_24hr_change: 'true',
      include_market_cap: 'true',
      include_24hr_vol: 'true',
    },
  );

  const result: Record<string, MarketDataEntry> = {};

  for (const id of ids) {
    const entry = raw[id];
    if (!entry) continue;
    result[id] = {
      id,
      priceUsd: entry.usd ?? 0,
      change24h: entry.usd_24h_change ?? 0,
      marketCap: entry.usd_market_cap ?? 0,
      volume24h: entry.usd_24h_vol ?? 0,
    };
  }

  return result;
}

/**
 * Fetch price history for a coin over N days. Used for sparkline charts.
 *
 * @param id   - CoinGecko coin ID, e.g. 'bitcoin'
 * @param days - Number of days of history (1, 7, 30, 90, 365, max)
 */
export async function getMarketChart(
  id: string,
  days: number,
): Promise<MarketChartPoint[]> {
  const cacheKey = `coingecko:chart:${id}:${days}`;

  const raw = await geckoFetch<{ prices: [number, number][] }>(
    `/coins/${id}/market_chart`,
    cacheKey,
    CACHE_TTL.NEWS, // 5 min — charts don't need rapid refresh
    {
      id,
      vs_currency: 'usd',
      days: String(days),
    },
  );

  return (raw.prices ?? []).map(([timestamp, price]) => ({
    timestamp,
    price,
  }));
}
