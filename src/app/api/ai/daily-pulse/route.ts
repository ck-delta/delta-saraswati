import { NextResponse } from 'next/server';
import {
  getTickers,
  filterPerpetuals,
  parseTickerToTokenCard,
  getCandles,
  getTicker,
} from '@/lib/api/delta';
import { getFearGreedIndex, getFearGreedHistory } from '@/lib/api/feargreed';
import { getClassifiedNews } from '@/lib/api/news';
import { getGlobalMarketData } from '@/lib/api/coingecko';
import { generateJSON, SCHEMAS } from '@/lib/ai/llm';
import { cache } from '@/lib/cache';
import { calculateTechScore } from '@/lib/signals/tech-score';
import { calculateDerivScore } from '@/lib/signals/deriv-score';
import { calculateNewsScore } from '@/lib/signals/news-score';
import { aggregateAISignal } from '@/lib/signals/composite';
import {
  buildCallouts,
  curateItems,
  buildGroqPrompt,
  mergeIntoSummary,
  type PulseInputs,
} from '@/lib/ai/pulse-builder';
import type { PulseResponse } from '@/types/pulse';
import type { AISignalResult } from '@/lib/signals/composite';

export const runtime = 'nodejs';

const CACHE_KEY = 'api:daily-pulse-v2';
const CACHE_TTL_MS = 10 * 60 * 1000;

const FALLBACK_RESPONSE: PulseResponse = {
  summary: {
    marketPulse: [],
    bigMovers: [],
    macroWatch: [],
    derivativesInsight: [],
    fundingExtremes: [],
    volumeAnomalies: [],
    oiChanges: [],
  },
  callouts: {
    fearGreed: null,
    btcDominance: null,
    nextMacroEvents: [],
    alerts: [],
  },
  timestamp: Date.now(),
  stale: true,
};

// Fetch 24h OI snapshot (now vs 24h ago) for up to N symbols. Used by the OI
// Change Leaders section. Failures are swallowed per-symbol.
async function fetchOiSnapshots(symbols: string[]): Promise<Record<string, { oiNow: number; oiPrior: number }>> {
  const out: Record<string, { oiNow: number; oiPrior: number }> = {};
  const now = Math.floor(Date.now() / 1000);
  const start = now - 48 * 3600;
  await Promise.all(
    symbols.map(async (sym) => {
      try {
        const candles = await getCandles(`OI:${sym}`, '1h', start, now);
        if (candles.length < 2) return;
        const oiNow = Number(candles[candles.length - 1].close);
        // 24h ago ≈ index length-25
        const priorIdx = Math.max(0, candles.length - 25);
        const oiPrior = Number(candles[priorIdx].close);
        if (!isNaN(oiNow) && !isNaN(oiPrior) && oiPrior > 0) {
          out[sym] = { oiNow, oiPrior };
        }
      } catch {
        // silent per-symbol
      }
    }),
  );
  return out;
}

// Compute AI Signal for a single top token. Uses lighter lookbacks than
// /api/ai-signal/[symbol] to stay within a single route-handler budget.
async function computeTopSignal(symbol: string, news: Awaited<ReturnType<typeof getClassifiedNews>>) {
  try {
    const now = Math.floor(Date.now() / 1000);
    const [ticker, candles, oiCandles] = await Promise.all([
      getTicker(symbol),
      getCandles(symbol, '4h', now - 34 * 86400, now),
      getCandles(`OI:${symbol}`, '1h', now - 48 * 3600, now).catch(() => []),
    ]);
    const tech = calculateTechScore(candles);
    if (!tech) return null;
    const oiNow = oiCandles.length > 0 ? Number(oiCandles[oiCandles.length - 1].close) : 0;
    const oiPrior = oiCandles.length > 6 ? Number(oiCandles[oiCandles.length - 7].close) : oiNow;
    const priceNow = parseFloat(ticker.close);
    const pricePrior = candles.length > 2 ? Number(candles[candles.length - 2].close) : priceNow;
    const deriv = calculateDerivScore({
      priceNow,
      pricePrior,
      oiNow,
      oiPrior,
      fundingRate: parseFloat(ticker.funding_rate) || 0,
      spotPrice: parseFloat(ticker.spot_price) || 0,
      markPrice: parseFloat(ticker.mark_price) || 0,
    });
    const newsRes = calculateNewsScore(symbol, news);
    return aggregateAISignal(newsRes, tech, deriv);
  } catch (err) {
    console.error(`computeTopSignal error for ${symbol}:`, err);
    return null;
  }
}

export async function GET() {
  try {
    const cached = cache.get<PulseResponse>(CACHE_KEY);
    if (cached?.fresh) {
      return NextResponse.json(cached.data);
    }

    // Parallel fetches
    const [tickersResult, fgResult, fgHistResult, newsResult, globalResult] =
      await Promise.allSettled([
        getTickers(),
        getFearGreedIndex(),
        getFearGreedHistory(2),
        getClassifiedNews(),
        getGlobalMarketData(),
      ]);

    const tickers = tickersResult.status === 'fulfilled' ? tickersResult.value : [];
    const fearGreed = fgResult.status === 'fulfilled' ? fgResult.value : null;
    const fgHist = fgHistResult.status === 'fulfilled' ? fgHistResult.value : [];
    const prevFG = fgHist.length >= 2 ? fgHist[1].value : null;
    const news = newsResult.status === 'fulfilled' ? newsResult.value : [];
    const global = globalResult.status === 'fulfilled' ? globalResult.value : null;

    const perpetuals = filterPerpetuals(tickers).map(parseTickerToTokenCard);

    // Top 3 AI signals (used in Market Pulse, Derivatives Insight, divergence alerts)
    const topSymbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];

    // Pick candidate symbols for OI snapshot: top 6 by volume → enough coverage
    // for OI Change Leaders without blowing fetch budget on every perpetual.
    const oiCandidates = [...perpetuals]
      .sort((a, b) => b.turnoverUsd - a.turnoverUsd)
      .slice(0, 6)
      .map((p) => p.symbol);

    const [aiSignalsArr, oiSnapshots] = await Promise.all([
      Promise.all(topSymbols.map((s) => computeTopSignal(s, news))),
      fetchOiSnapshots(oiCandidates),
    ]);

    const aiSignals: Record<string, AISignalResult | null> = {};
    topSymbols.forEach((s, i) => { aiSignals[s] = aiSignalsArr[i]; });

    const inputs: PulseInputs = {
      perpetuals,
      rawTickers: tickers,
      fearGreed,
      prevFearGreed: prevFG,
      news,
      global,
      aiSignals,
      oiSnapshots,
    };

    const callouts = buildCallouts(inputs);
    const items = curateItems(inputs);
    const prompt = buildGroqPrompt(items);

    let groqOutput: { items: { index: number; reason: string; sentiment: string }[] } = { items: [] };
    try {
      groqOutput = await generateJSON(prompt, {
        task: 'market-summary',
        schema: SCHEMAS.marketSummaryReasons,
        temperature: 0.5,
        maxTokens: 2000,
      });
    } catch (err) {
      console.error('Daily Pulse LLM failed:', err);
      // Fall back: use hint sentiment + a minimal reason per item
      groqOutput = {
        items: items.map((it, idx) => ({
          index: idx + 1,
          reason: it.context.split('.')[0] + '.',
          sentiment: (it.hintSentiment ?? 'NEUTRAL'),
        })),
      };
    }

    const summary = mergeIntoSummary(items, groqOutput);

    const response: PulseResponse = {
      summary,
      callouts,
      timestamp: Date.now(),
    };

    cache.set(CACHE_KEY, response, CACHE_TTL_MS);
    return NextResponse.json(response);
  } catch (err) {
    console.error('Daily pulse route error:', err);
    const stale = cache.get<PulseResponse>(CACHE_KEY);
    if (stale) return NextResponse.json({ ...stale.data, stale: true });
    return NextResponse.json({ ...FALLBACK_RESPONSE, timestamp: Date.now() }, { status: 500 });
  }
}
