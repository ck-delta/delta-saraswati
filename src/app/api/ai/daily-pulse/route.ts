import { NextResponse } from 'next/server';
import {
  getTickers,
  filterPerpetuals,
  parseTickerToTokenCard,
} from '@/lib/api/delta';
import { getFearGreedIndex } from '@/lib/api/feargreed';
import { fetchAllNews } from '@/lib/api/news';
import { generateJSON } from '@/lib/ai/groq';
import { getDailyPulsePrompt } from '@/lib/ai/prompts';
import { cache } from '@/lib/cache';
import { TOP_TOKENS, CACHE_TTL } from '@/lib/constants';
import type { TokenCardData } from '@/types/market';
import type { DailyPulseResponse } from '@/types/news';

export const runtime = 'nodejs';

const CACHE_KEY = 'api:daily-pulse';

const FALLBACK_RESPONSE: DailyPulseResponse = {
  summary:
    'Market data is temporarily unavailable. The AI daily pulse could not be generated at this time. ' +
    'Please check back shortly for the latest market overview.',
  highlights: [
    'Market analysis will resume once data feeds are restored.',
    'Check individual token pages for the latest prices.',
    'Visit Delta Exchange for real-time derivatives data.',
  ],
  timestamp: Date.now(),
  stale: true,
};

export async function GET() {
  try {
    // Check cache first (15-minute TTL)
    const cached = cache.get<DailyPulseResponse>(CACHE_KEY);
    if (cached?.fresh) {
      return NextResponse.json(cached.data);
    }

    // Fetch market data + news in parallel
    const [tickersResult, fearGreedResult, newsResult] =
      await Promise.allSettled([
        getTickers(),
        getFearGreedIndex(),
        fetchAllNews(),
      ]);

    // Build token data for the prompt
    let topTokenCards: TokenCardData[] = [];
    let totalVolume24h = 0;

    if (tickersResult.status === 'fulfilled') {
      const perpetuals = filterPerpetuals(tickersResult.value);
      const allCards = perpetuals.map(parseTickerToTokenCard);

      const topSet = new Set<string>(TOP_TOKENS);
      topTokenCards = allCards.filter((t) => topSet.has(t.symbol));

      totalVolume24h = allCards.reduce((sum, t) => sum + t.turnoverUsd, 0);
    }

    const fearGreed =
      fearGreedResult.status === 'fulfilled' ? fearGreedResult.value : null;

    const newsHeadlines: string[] = [];
    if (newsResult.status === 'fulfilled') {
      newsResult.value.slice(0, 10).forEach((item) => {
        newsHeadlines.push(item.title);
      });
    }

    // Build prompt and call Groq
    const prompt = getDailyPulsePrompt(
      {
        topTokens: topTokenCards,
        fearGreedValue: fearGreed?.value,
        fearGreedLabel: fearGreed?.classification,
        totalVolume24h,
      },
      newsHeadlines,
    );

    let aiResult: { summary?: string; highlights?: string[] };

    try {
      aiResult = await generateJSON<{ summary?: string; highlights?: string[] }>(prompt);
    } catch (aiErr) {
      console.error('AI generation failed for daily pulse:', aiErr);
      // Return fallback if AI fails
      return NextResponse.json({ ...FALLBACK_RESPONSE, timestamp: Date.now() });
    }

    const response: DailyPulseResponse = {
      summary: aiResult.summary || FALLBACK_RESPONSE.summary,
      highlights: Array.isArray(aiResult.highlights) && aiResult.highlights.length > 0
        ? aiResult.highlights
        : FALLBACK_RESPONSE.highlights,
      timestamp: Date.now(),
    };

    // Cache the successful result
    cache.set(CACHE_KEY, response, CACHE_TTL.DAILY_PULSE);

    return NextResponse.json(response);
  } catch (err) {
    console.error('Daily pulse route error:', err);
    return NextResponse.json(
      { ...FALLBACK_RESPONSE, timestamp: Date.now() },
      { status: 500 },
    );
  }
}
