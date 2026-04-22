import { NextResponse } from 'next/server';
import {
  getTicker,
  getCandles,
  computePCR,
  computeOptionsLS,
} from '@/lib/api/delta';
import { getClassifiedNews } from '@/lib/api/news';
import { calculateTechScore } from '@/lib/signals/tech-score';
import { calculateDerivScore } from '@/lib/signals/deriv-score';
import { calculateNewsScore } from '@/lib/signals/news-score';
import { aggregateAISignal } from '@/lib/signals/composite';
import { calculatePivotPoints, snapToRound, type PivotPoints } from '@/lib/ta/indicators';
import { buildThingsToNote, type ThingToNote } from '@/lib/ai/things-to-note';
import { cache } from '@/lib/cache';

export const runtime = 'nodejs';
export const revalidate = 60;

const CACHE_TTL = 60 * 1000;

// Underlyings we attempt PCR + L/S for (options liquid enough to matter)
const OPTIONS_UNDERLYINGS = new Set(['BTC', 'ETH']);

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol: rawSymbol } = await params;
  const symbol = rawSymbol.toUpperCase();
  const underlying = symbol.replace(/USDT?$/, '');

  const cacheKey = `ai-signal:${symbol}`;
  const cached = cache.get<unknown>(cacheKey);
  if (cached?.fresh) {
    return NextResponse.json({ ...(cached.data as object), cached: true });
  }

  try {
    const now = Math.floor(Date.now() / 1000);
    const start = now - 34 * 86400;

    // Parallel fetches. Options helpers (PCR, L/S) are short-circuited for
    // underlyings without liquid options.
    const shouldFetchOptions = OPTIONS_UNDERLYINGS.has(underlying);
    const [
      ticker,
      candles4h,
      candles1d,
      oiCandles,
      news,
      pcr,
      ls,
    ] = await Promise.all([
      getTicker(symbol),
      getCandles(symbol, '4h', start, now),
      // Daily candles for pivot points (needs at least one completed daily bar)
      getCandles(symbol, '1d', now - 7 * 86400, now).catch(() => []),
      getCandles(`OI:${symbol}`, '1h', now - 48 * 3600, now).catch(() => []),
      getClassifiedNews().catch(() => []),
      shouldFetchOptions ? computePCR(underlying) : Promise.resolve(null),
      shouldFetchOptions ? computeOptionsLS(underlying) : Promise.resolve(null),
    ]);

    const tech = calculateTechScore(candles4h);
    if (!tech) {
      return NextResponse.json(
        { error: 'Not enough candle history to compute technical score' },
        { status: 503 },
      );
    }

    const oiNow = oiCandles.length > 0 ? Number(oiCandles[oiCandles.length - 1].close) : 0;
    const oiPrior = oiCandles.length > 6
      ? Number(oiCandles[oiCandles.length - 7].close)
      : oiNow;
    const priceNow = parseFloat(ticker.close);
    const pricePrior = candles4h.length > 2
      ? Number(candles4h[candles4h.length - 2].close)
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

    const newsResult = calculateNewsScore(symbol, news);
    const composite = aggregateAISignal(newsResult, tech, deriv);

    // Pivot points from prior completed daily candle (if available).
    let pivots: PivotPoints | null = null;
    let pivotsRounded: PivotPoints | null = null;
    if (candles1d.length >= 2) {
      const prev = candles1d[candles1d.length - 2];
      const prevHigh = Number(prev.high);
      const prevLow = Number(prev.low);
      const prevClose = Number(prev.close);
      if (prevHigh > 0 && prevLow > 0 && prevClose > 0) {
        pivots = calculatePivotPoints(prevHigh, prevLow, prevClose);
        pivotsRounded = {
          pivot: snapToRound(pivots.pivot),
          r1: snapToRound(pivots.r1),
          r2: snapToRound(pivots.r2),
          r3: snapToRound(pivots.r3),
          s1: snapToRound(pivots.s1),
          s2: snapToRound(pivots.s2),
          s3: snapToRound(pivots.s3),
        };
      }
    }

    // Things to Note — Groq-backed (with heuristic fallback inside module).
    let thingsToNote: ThingToNote[] = [];
    try {
      thingsToNote = await buildThingsToNote({
        composite,
        technical: tech,
        derivatives: deriv,
        news: newsResult,
        pcr,
        ls,
      });
    } catch (err) {
      console.error('thingsToNote failed:', err);
    }

    const response = {
      symbol,
      underlying,
      timestamp: Date.now(),
      composite,
      breakdown: {
        news: newsResult,
        technical: tech,
        derivatives: deriv,
      },
      options: {
        pcr,
        ls,
        supported: shouldFetchOptions,
      },
      pivots,
      pivotsRounded,
      thingsToNote,
      price: priceNow,
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
