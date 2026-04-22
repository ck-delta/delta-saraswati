import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  getTickers,
  filterPerpetuals,
  parseTickerToTokenCard,
} from '@/lib/api/delta';
import { fetchAllNews } from '@/lib/api/news';
import { generateJSON, SCHEMAS } from '@/lib/ai/llm';
import { getSentimentPrompt } from '@/lib/ai/prompts';
import { cache } from '@/lib/cache';
import { CACHE_TTL } from '@/lib/constants';
import type { SentimentScore } from '@/types/news';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const symbols: string[] = body?.symbols;

    if (!Array.isArray(symbols) || symbols.length === 0) {
      return NextResponse.json(
        { error: 'Request body must include a non-empty "symbols" array' },
        { status: 400 },
      );
    }

    // Normalize and deduplicate
    const normalizedSymbols = [...new Set(symbols.map((s) => s.toUpperCase()))];

    // Cache key is based on sorted symbols so order doesn't matter
    const cacheKey = `api:sentiment:${[...normalizedSymbols].sort().join(',')}`;
    const cached = cache.get<{ scores: SentimentScore[] }>(cacheKey);
    if (cached?.fresh) {
      return NextResponse.json(cached.data);
    }

    // Fetch tickers + news in parallel
    const [tickersResult, newsResult] = await Promise.allSettled([
      getTickers(),
      fetchAllNews(),
    ]);

    // Build token cards for requested symbols
    let tokenCards = [];
    if (tickersResult.status === 'fulfilled') {
      const perpetuals = filterPerpetuals(tickersResult.value);
      const allCards = perpetuals.map(parseTickerToTokenCard);
      const symbolSet = new Set(normalizedSymbols);
      tokenCards = allCards.filter((t) => symbolSet.has(t.symbol));
    } else {
      console.error('Failed to fetch tickers for sentiment:', tickersResult.reason);
      return NextResponse.json(
        { error: 'Failed to fetch ticker data needed for sentiment analysis' },
        { status: 502 },
      );
    }

    if (tokenCards.length === 0) {
      return NextResponse.json(
        { error: `No matching tickers found for symbols: ${normalizedSymbols.join(', ')}` },
        { status: 404 },
      );
    }

    // Gather news headlines
    const headlines: string[] = [];
    if (newsResult.status === 'fulfilled') {
      newsResult.value.slice(0, 10).forEach((item) => {
        headlines.push(item.title);
      });
    }

    // Build prompt and call Groq
    const prompt = getSentimentPrompt(tokenCards, headlines);

    let aiResult: { scores?: SentimentScore[] };
    try {
      aiResult = await generateJSON(prompt, {
        task: 'sentiment',
        schema: SCHEMAS.tokenSentiment,
        temperature: 0.3,
      });
    } catch (aiErr) {
      console.error('AI generation failed for sentiment:', aiErr);
      return NextResponse.json(
        { error: 'AI sentiment analysis failed. Please try again.' },
        { status: 502 },
      );
    }

    // Validate and normalize scores
    const scores: SentimentScore[] = [];
    if (Array.isArray(aiResult.scores)) {
      for (const entry of aiResult.scores) {
        if (
          typeof entry.symbol === 'string' &&
          typeof entry.score === 'number' &&
          typeof entry.label === 'string'
        ) {
          scores.push({
            symbol: entry.symbol,
            score: Math.max(0, Math.min(100, Math.round(entry.score))),
            label: entry.label,
            reasoning: typeof entry.reasoning === 'string' ? entry.reasoning : '',
          });
        }
      }
    }

    const response = { scores, timestamp: Date.now() };

    // Cache for 5 minutes
    cache.set(cacheKey, response, CACHE_TTL.SENTIMENT);

    return NextResponse.json(response);
  } catch (err) {
    console.error('Sentiment route error:', err);
    return NextResponse.json(
      { error: 'Internal server error during sentiment analysis' },
      { status: 500 },
    );
  }
}
