// Market Mood Bar data source.
// Returns everything the sticky top-of-page bar needs:
// - Fear & Greed (current + 7d series)
// - BTC dominance (current + 24h delta)
// - ETH/BTC ratio (current + 7d series)
// - Next macro events (FOMC, CPI, ...)
//
// 5-minute cache. Falls back to stale on upstream failure.

import { NextResponse } from 'next/server';
import { getFearGreedIndex, getFearGreedHistory } from '@/lib/api/feargreed';
import { getGlobalMarketData } from '@/lib/api/coingecko';
import { getCandles } from '@/lib/api/delta';
import { fetchAllNews } from '@/lib/api/news';
import { detectStorms } from '@/lib/ai/news-classifier';
import { cache } from '@/lib/cache';
import { nextEvents, upcomingEvents, countdownLabel } from '@/lib/macro/calendar';

export const runtime = 'nodejs';
export const revalidate = 300;

const CACHE_KEY = 'market-mood:v1';
const CACHE_TTL = 5 * 60 * 1000;

export interface MarketMood {
  fearGreed: {
    value: number;
    label: string;
    prevValue: number | null;
    direction: 'up' | 'down' | 'flat';
    history: number[];      // oldest→newest, 7 points
    lastUpdatedMs: number;
  } | null;
  btcDominance: {
    value: number;
    marketCapPctChange24h: number;
    totalMarketCapUsdT: number;
    lastUpdatedMs: number;
  } | null;
  ethBtc: {
    ratio: number;
    pctChange7d: number;
    history: number[];      // oldest→newest hourly ETH/BTC ratios, 168 points
    lastUpdatedMs: number;
  } | null;
  nextMacroEvents: {
    kind: string;
    label: string;
    countdown: string;
    datetime: string;
  }[];
  /** Top 10 upcoming macro events (chronological) for the expandable modal. */
  upcomingMacroEvents: {
    kind: string;
    label: string;
    countdown: string;
    datetime: string;
  }[];
  /** Tokens currently experiencing a news storm (≥5 headlines in 60min). */
  newsStormTokens: { symbol: string; count: number }[];
  timestamp: number;
  stale?: boolean;
}

async function computeEthBtcSeries() {
  try {
    const now = Math.floor(Date.now() / 1000);
    const start = now - 7 * 86400;
    const [btc, eth] = await Promise.all([
      getCandles('BTCUSDT', '1h', start, now),
      getCandles('ETHUSDT', '1h', start, now),
    ]);
    // Align by timestamp; use BTC's length as baseline
    const btcByTime = new Map<number, number>();
    for (const c of btc) btcByTime.set(c.time, Number(c.close));
    const series: number[] = [];
    for (const c of eth) {
      const bPrice = btcByTime.get(c.time);
      const ePrice = Number(c.close);
      if (bPrice && bPrice > 0 && ePrice > 0) series.push(ePrice / bPrice);
    }
    if (series.length < 2) return null;
    const ratio = series[series.length - 1];
    const pctChange7d = ((ratio - series[0]) / series[0]) * 100;
    return { ratio, pctChange7d, history: series };
  } catch (err) {
    console.error('ETH/BTC series failed:', err);
    return null;
  }
}

export async function GET() {
  const cached = cache.get<MarketMood>(CACHE_KEY);
  if (cached?.fresh) {
    return NextResponse.json(cached.data);
  }

  try {
    const [fgNow, fgHist, global, ethBtc, news] = await Promise.allSettled([
      getFearGreedIndex(),
      getFearGreedHistory(7),
      getGlobalMarketData(),
      computeEthBtcSeries(),
      fetchAllNews(),
    ]);

    // Storm detection uses keyword fallback inside detectStorms — no Groq call
    // required. Ensures /api/market-mood and /api/news stay in sync and
    // independently cheap to compute.
    let stormEntries: { symbol: string; count: number }[] = [];
    if (news.status === 'fulfilled' && news.value.length > 0) {
      try {
        const storms = detectStorms(news.value);
        stormEntries = Array.from(storms.stormTokens).map((sym) => ({
          symbol: sym,
          count: storms.perTokenCount[sym] ?? 0,
        }));
      } catch (err) {
        console.error('storm detection failed:', err);
      }
    }

    const fearGreed =
      fgNow.status === 'fulfilled' && fgHist.status === 'fulfilled'
        ? {
            value: fgNow.value.value,
            label: fgNow.value.classification,
            prevValue: fgHist.value.length >= 2 ? fgHist.value[1].value : null,
            direction:
              fgHist.value.length >= 2
                ? fgNow.value.value > fgHist.value[1].value
                  ? 'up' as const
                  : fgNow.value.value < fgHist.value[1].value
                    ? 'down' as const
                    : 'flat' as const
                : 'flat' as const,
            // history oldest→newest
            history: [...fgHist.value].reverse().map((h) => h.value),
            lastUpdatedMs: fgNow.value.timestamp,
          }
        : null;

    const btcDominance =
      global.status === 'fulfilled' && global.value
        ? {
            value: global.value.btcDominance,
            marketCapPctChange24h: global.value.marketCapPctChange24h,
            totalMarketCapUsdT: global.value.totalMarketCapUsd / 1e12,
            lastUpdatedMs: Date.now(),
          }
        : null;

    const ethBtcData =
      ethBtc.status === 'fulfilled' && ethBtc.value
        ? { ...ethBtc.value, lastUpdatedMs: Date.now() }
        : null;

    const now = new Date();
    const events = nextEvents(now).slice(0, 2);
    const nextMacroEvents = events.map((e) => ({
      kind: e.kind,
      label: e.label,
      countdown: countdownLabel(e.datetime, now),
      datetime: e.datetime,
    }));
    const upcoming = upcomingEvents(10, now).map((e) => ({
      kind: e.kind,
      label: e.label,
      countdown: countdownLabel(e.datetime, now),
      datetime: e.datetime,
    }));

    const payload: MarketMood = {
      fearGreed,
      btcDominance,
      ethBtc: ethBtcData,
      nextMacroEvents,
      upcomingMacroEvents: upcoming,
      newsStormTokens: stormEntries,
      timestamp: Date.now(),
    };

    cache.set(CACHE_KEY, payload, CACHE_TTL);
    return NextResponse.json(payload);
  } catch (err) {
    console.error('market-mood route error:', err);
    if (cached) return NextResponse.json({ ...cached.data, stale: true });
    return NextResponse.json(
      {
        fearGreed: null,
        btcDominance: null,
        ethBtc: null,
        nextMacroEvents: [],
        upcomingMacroEvents: [],
        newsStormTokens: [],
        timestamp: Date.now(),
        stale: true,
      } satisfies MarketMood,
      { status: 500 },
    );
  }
}
