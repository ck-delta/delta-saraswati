import { NextResponse } from 'next/server';
import { getTicker, getCandles } from '@/lib/api/delta';
import { fetchAllNews } from '@/lib/api/news';
import { calculateTechScore } from '@/lib/signals/tech-score';
import { calculateDerivScore } from '@/lib/signals/deriv-score';
import { calculateNewsScore } from '@/lib/signals/news-score';
import { aggregateAISignal } from '@/lib/signals/composite';
import { cache } from '@/lib/cache';

export const runtime = 'nodejs';
export const revalidate = 60;

const CACHE_TTL = 60 * 1000;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol: rawSymbol } = await params;
  const symbol = rawSymbol.toUpperCase();

  const cacheKey = `ai-signal:${symbol}`;
  const cached = cache.get<unknown>(cacheKey);
  if (cached?.fresh) {
    return NextResponse.json({ ...(cached.data as object), cached: true });
  }

  try {
    const now = Math.floor(Date.now() / 1000);
    // Need 200 4h candles = 800h = 33 days
    const start = now - 34 * 86400;

    const [ticker, candles, oiCandles, news] = await Promise.all([
      getTicker(symbol),
      getCandles(symbol, '4h', start, now),
      // OI candles (hourly, 24h window for 6h lookback)
      getCandles(`OI:${symbol}`, '1h', now - 48 * 3600, now).catch(() => []),
      fetchAllNews().catch(() => []),
    ]);

    // --- Technical ---
    const tech = calculateTechScore(candles);
    if (!tech) {
      return NextResponse.json(
        { error: 'Not enough candle history to compute technical score' },
        { status: 503 },
      );
    }

    // --- Derivatives ---
    // OI candle close = OI value. 6h ago = 6 candles back on 1h resolution.
    const oiNow = oiCandles.length > 0 ? Number(oiCandles[oiCandles.length - 1].close) : 0;
    const oiPrior = oiCandles.length > 6
      ? Number(oiCandles[oiCandles.length - 7].close)
      : oiNow;
    const priceNow = parseFloat(ticker.close);
    const pricePrior = candles.length > 2
      ? Number(candles[candles.length - 2].close)   // last completed 4h bar (close to 6h ago)
      : priceNow;

    const deriv = calculateDerivScore({
      priceNow,
      pricePrior,
      oiNow,
      oiPrior,
      fundingRate: parseFloat(ticker.funding_rate) || 0,
      spotPrice: parseFloat(ticker.spot_price) || 0,
      markPrice: parseFloat(ticker.mark_price) || 0,
    });

    // --- News ---
    const newsResult = calculateNewsScore(symbol, news);

    // --- Aggregate ---
    const composite = aggregateAISignal(newsResult, tech, deriv);

    const response = {
      symbol,
      timestamp: Date.now(),
      composite,
      breakdown: {
        news: newsResult,
        technical: tech,
        derivatives: deriv,
      },
    };

    cache.set(cacheKey, response, CACHE_TTL);
    return NextResponse.json(response);
  } catch (err) {
    console.error(`AI signal error for ${symbol}:`, err);
    const stale = cache.get<unknown>(cacheKey);
    if (stale) {
      return NextResponse.json({ ...(stale.data as object), stale: true });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to compute AI signal' },
      { status: 500 },
    );
  }
}
