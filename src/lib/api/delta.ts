import { cache } from '@/lib/cache';
import { DELTA_API_BASE, CACHE_TTL, TOKEN_INFO } from '@/lib/constants';
import type {
  DeltaTicker,
  DeltaCandle,
  DeltaOrderBook,
  DeltaProduct,
  DeltaApiResponse,
} from '@/types/delta';
import type { TokenCardData } from '@/types/market';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Generic fetch wrapper for Delta Exchange API.
 * Returns the `result` field from a `{ success, result }` envelope.
 * On network / parse errors, returns stale cache if available, else throws.
 */
async function deltaFetch<T>(
  path: string,
  cacheKey: string,
  ttl: number,
  query?: Record<string, string>,
): Promise<T> {
  // Check cache first
  const cached = cache.get<T>(cacheKey);
  if (cached?.fresh) return cached.data;

  const url = new URL(`${DELTA_API_BASE}${path}`);
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

    if (!res.ok) {
      throw new Error(`Delta API ${res.status}: ${res.statusText}`);
    }

    const json: DeltaApiResponse<T> = await res.json();

    if (!json.success) {
      throw new Error('Delta API returned success=false');
    }

    cache.set(cacheKey, json.result, ttl);
    return json.result;
  } catch (err) {
    // Stale-while-error: return expired cache when available
    if (cached) return cached.data;
    throw err;
  }
}

// ---------------------------------------------------------------------------
// API Functions
// ---------------------------------------------------------------------------

/** Fetch all tickers from Delta Exchange. */
export async function getTickers(): Promise<DeltaTicker[]> {
  const tickers = await deltaFetch<DeltaTicker[]>(
    '/tickers',
    'delta:tickers',
    CACHE_TTL.TICKERS,
  );

  // Compute convenience fields (Delta returns all numerics as strings)
  return tickers.map(enrichTicker);
}

/** Fetch a single ticker by symbol (e.g. 'BTCUSD'). */
export async function getTicker(symbol: string): Promise<DeltaTicker> {
  const ticker = await deltaFetch<DeltaTicker>(
    `/tickers/${symbol}`,
    `delta:ticker:${symbol}`,
    CACHE_TTL.TICKERS,
  );

  return enrichTicker(ticker);
}

/** Fetch OHLCV candles for charting. */
export async function getCandles(
  symbol: string,
  resolution: string,
  start: number,
  end: number,
): Promise<DeltaCandle[]> {
  const candles = await deltaFetch<DeltaCandle[]>(
    '/history/candles',
    `delta:candles:${symbol}:${resolution}:${start}:${end}`,
    CACHE_TTL.CANDLES,
    {
      symbol,
      resolution,
      start: String(start),
      end: String(end),
    },
  );

  return candles;
}

/** Fetch L2 order book for a symbol. */
export async function getOrderBook(symbol: string): Promise<DeltaOrderBook> {
  return deltaFetch<DeltaOrderBook>(
    `/l2orderbook/${symbol}`,
    `delta:orderbook:${symbol}`,
    CACHE_TTL.ORDERBOOK,
  );
}

/** Fetch all tradeable products. */
export async function getProducts(): Promise<DeltaProduct[]> {
  return deltaFetch<DeltaProduct[]>(
    '/products',
    'delta:products',
    5 * 60 * 1000, // 5 minutes
  );
}

// ---------------------------------------------------------------------------
// Filter & Sort Helpers
// ---------------------------------------------------------------------------

/** Add computed numeric fields to a raw ticker. */
function enrichTicker(t: DeltaTicker): DeltaTicker {
  const close = parseFloat(t.close) || 0;
  const open = parseFloat(t.open) || 0;
  const change = close - open;
  const changePct = open !== 0 ? (change / open) * 100 : 0;

  return {
    ...t,
    price_change_24h: change,
    price_change_pct_24h: changePct,
  };
}

/** Keep only perpetual futures tickers. */
export function filterPerpetuals(tickers: DeltaTicker[]): DeltaTicker[] {
  return tickers.filter((t) => t.contract_type === 'perpetual_futures');
}

/** Top N gainers by 24h percent change, descending. */
export function getTopGainers(tickers: DeltaTicker[], n: number): DeltaTicker[] {
  return [...tickers]
    .sort((a, b) => (b.price_change_pct_24h ?? 0) - (a.price_change_pct_24h ?? 0))
    .slice(0, n);
}

/** Top N losers by 24h percent change, ascending. */
export function getTopLosers(tickers: DeltaTicker[], n: number): DeltaTicker[] {
  return [...tickers]
    .sort((a, b) => (a.price_change_pct_24h ?? 0) - (b.price_change_pct_24h ?? 0))
    .slice(0, n);
}

/** Convert a raw DeltaTicker into the TokenCardData shape the frontend needs. */
export function parseTickerToTokenCard(ticker: DeltaTicker): TokenCardData {
  const info = TOKEN_INFO[ticker.symbol];

  return {
    symbol: ticker.symbol,
    name: info?.name ?? ticker.description ?? ticker.symbol,
    underlying: ticker.underlying_asset_symbol ?? ticker.symbol.replace('USD', ''),
    price: parseFloat(ticker.close) || 0,
    priceChange24h: ticker.price_change_24h ?? 0,
    priceChangePct24h: ticker.price_change_pct_24h ?? 0,
    high24h: parseFloat(ticker.high) || 0,
    low24h: parseFloat(ticker.low) || 0,
    volume24h: parseFloat(ticker.volume) || 0,
    turnoverUsd: parseFloat(ticker.turnover_usd) || 0,
    openInterest: parseFloat(ticker.oi) || 0,
    openInterestUsd: parseFloat(ticker.oi_value_usd) || 0,
    fundingRate: parseFloat(ticker.funding_rate) || 0,
    markPrice: parseFloat(ticker.mark_price) || 0,
    spotPrice: parseFloat(ticker.spot_price) || 0,
    // Filled later by CoinGecko / AI layers
    marketCap: null,
    sentimentScore: null,
    sentimentLabel: null,
  };
}
