import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  getTickers,
  filterPerpetuals,
  parseTickerToTokenCard,
  getTopGainers,
  getTopLosers,
  getTicker,
} from '@/lib/api/delta';
import { getFearGreedIndex } from '@/lib/api/feargreed';
import { fetchAllNews } from '@/lib/api/news';
import { streamChat } from '@/lib/ai/llm';
import {
  getChatSystemPrompt,
  getTokenResearchPrompt,
} from '@/lib/ai/prompts';
import type { ChatRequest } from '@/types/chat';
import type { TokenCardData } from '@/types/market';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { messages, context } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Request body must include a non-empty "messages" array' },
        { status: 400 },
      );
    }

    // Validate message format
    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        return NextResponse.json(
          { error: 'Each message must have "role" and "content" fields' },
          { status: 400 },
        );
      }
    }

    const contextType = context?.type ?? 'general';

    // -----------------------------------------------------------------------
    // Pre-fetch relevant data based on context type
    // -----------------------------------------------------------------------
    let contextTokens: TokenCardData[] = [];
    let contextFearGreed: { value: number; classification: string } | null = null;
    let contextHeadlines: string[] = [];

    try {
      switch (contextType) {
        case 'market_overview': {
          const [tickersRes, fgRes] = await Promise.allSettled([
            getTickers(),
            getFearGreedIndex(),
          ]);

          if (tickersRes.status === 'fulfilled') {
            const perps = filterPerpetuals(tickersRes.value);
            contextTokens = perps.map(parseTickerToTokenCard);
          }
          if (fgRes.status === 'fulfilled') {
            contextFearGreed = {
              value: fgRes.value.value,
              classification: fgRes.value.classification,
            };
          }
          break;
        }

        case 'gainers_losers': {
          const tickers = await getTickers();
          const perps = filterPerpetuals(tickers);
          const gainers = getTopGainers(perps, 5).map(parseTickerToTokenCard);
          const losers = getTopLosers(perps, 5).map(parseTickerToTokenCard);
          contextTokens = [...gainers, ...losers];
          break;
        }

        case 'news': {
          const news = await fetchAllNews();
          contextHeadlines = news.slice(0, 10).map((n) => n.title);
          break;
        }

        case 'funding': {
          const tickers = await getTickers();
          const perps = filterPerpetuals(tickers);
          // Sort by absolute funding rate to surface the most interesting
          const sorted = [...perps].sort(
            (a, b) =>
              Math.abs(parseFloat(b.funding_rate) || 0) -
              Math.abs(parseFloat(a.funding_rate) || 0),
          );
          contextTokens = sorted.slice(0, 15).map(parseTickerToTokenCard);
          break;
        }

        case 'whale':
        case 'liquidation': {
          // Use news as a proxy for whale / liquidation data
          const news = await fetchAllNews();
          contextHeadlines = news.slice(0, 10).map((n) => n.title);
          // Also fetch basic market data for context
          const tickers = await getTickers();
          const perps = filterPerpetuals(tickers);
          contextTokens = perps.slice(0, 10).map(parseTickerToTokenCard);
          break;
        }

        default: {
          // General chat: fetch basic market data
          const [tickersRes, fgRes] = await Promise.allSettled([
            getTickers(),
            getFearGreedIndex(),
          ]);

          if (tickersRes.status === 'fulfilled') {
            const perps = filterPerpetuals(tickersRes.value);
            contextTokens = perps
              .map(parseTickerToTokenCard)
              .sort((a, b) => b.turnoverUsd - a.turnoverUsd)
              .slice(0, 10);
          }
          if (fgRes.status === 'fulfilled') {
            contextFearGreed = {
              value: fgRes.value.value,
              classification: fgRes.value.classification,
            };
          }
          break;
        }
      }
    } catch (dataErr) {
      // Non-fatal: continue with whatever context we have
      console.error('Failed to fetch context data for chat:', dataErr);
    }

    // -----------------------------------------------------------------------
    // Build system prompt
    // -----------------------------------------------------------------------
    let systemPrompt = getChatSystemPrompt({
      tokens: contextTokens.length > 0 ? contextTokens : undefined,
      fearGreed: contextFearGreed,
      headlines: contextHeadlines.length > 0 ? contextHeadlines : undefined,
    });

    // If a specific token is being researched, add token-specific prompt
    if (context?.tokenSymbol) {
      try {
        const ticker = await getTicker(context.tokenSymbol);
        const tokenCard = parseTickerToTokenCard(ticker);
        const tokenPrompt = getTokenResearchPrompt(tokenCard);
        systemPrompt = tokenPrompt + '\n\n' + systemPrompt;
      } catch (tokenErr) {
        console.error(
          `Failed to fetch token data for ${context.tokenSymbol}:`,
          tokenErr,
        );
        // Continue without token-specific context
      }
    }

    // -----------------------------------------------------------------------
    // Stream response
    // -----------------------------------------------------------------------
    const groqMessages = messages.map((m) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    }));

    const stream = await streamChat(groqMessages, systemPrompt);

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    console.error('Chat route error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
