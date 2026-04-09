import { NextResponse } from 'next/server';
import {
  getTickers,
  filterPerpetuals,
  parseTickerToTokenCard,
} from '@/lib/api/delta';
import { getMarketData } from '@/lib/api/coingecko';
import { getFearGreedIndex } from '@/lib/api/feargreed';
import { TOP_TOKENS, TOKEN_INFO } from '@/lib/constants';
import type { TokenCardData } from '@/types/market';
import type { FearGreedData } from '@/types/market';

// Revalidate every 30 seconds (ISR)
export const revalidate = 30;

export async function GET() {
  try {
    // Build the list of CoinGecko IDs for our top tokens
    const coingeckoIds = TOP_TOKENS.map(
      (sym) => TOKEN_INFO[sym]?.coingeckoId,
    ).filter(Boolean) as string[];

    // Fetch all three data sources in parallel; partial failure is OK
    const [tickersResult, coingeckoResult, fearGreedResult] =
      await Promise.allSettled([
        getTickers(),
        getMarketData(coingeckoIds),
        getFearGreedIndex(),
      ]);

    // --- Tickers ---
    let allPerpetuals: TokenCardData[] = [];
    let topTokenCards: TokenCardData[] = [];

    if (tickersResult.status === 'fulfilled') {
      const perpetuals = filterPerpetuals(tickersResult.value);
      allPerpetuals = perpetuals.map(parseTickerToTokenCard);

      // Pick the top tokens that match TOP_TOKENS, preserving order
      const topSet = new Set<string>(TOP_TOKENS);
      topTokenCards = TOP_TOKENS.map((sym) =>
        allPerpetuals.find((t) => t.symbol === sym),
      ).filter(Boolean) as TokenCardData[];

      // If a top token wasn't found in tickers, skip it
    } else {
      console.error('Failed to fetch Delta tickers:', tickersResult.reason);
    }

    // --- CoinGecko market caps ---
    if (coingeckoResult.status === 'fulfilled') {
      const geckoData = coingeckoResult.value;

      // Build a reverse map: coingeckoId -> market cap
      const capByGeckoId: Record<string, number> = {};
      for (const entry of Object.values(geckoData)) {
        capByGeckoId[entry.id] = entry.marketCap;
      }

      // Merge market caps into token cards
      const mergeMarketCap = (card: TokenCardData): TokenCardData => {
        const geckoId = TOKEN_INFO[card.symbol]?.coingeckoId;
        if (geckoId && capByGeckoId[geckoId] != null) {
          return { ...card, marketCap: capByGeckoId[geckoId] };
        }
        return card;
      };

      topTokenCards = topTokenCards.map(mergeMarketCap);
      allPerpetuals = allPerpetuals.map(mergeMarketCap);
    } else {
      console.error(
        'Failed to fetch CoinGecko data:',
        coingeckoResult.reason,
      );
    }

    // --- Fear & Greed ---
    let fearGreed: FearGreedData | null = null;
    if (fearGreedResult.status === 'fulfilled') {
      fearGreed = fearGreedResult.value;
    } else {
      console.error(
        'Failed to fetch Fear & Greed index:',
        fearGreedResult.reason,
      );
    }

    return NextResponse.json({
      tokens: topTokenCards,
      fearGreed,
      allTickers: allPerpetuals,
      timestamp: Date.now(),
    });
  } catch (err) {
    console.error('Market data route error:', err);
    return NextResponse.json(
      {
        tokens: [],
        fearGreed: null,
        allTickers: [],
        timestamp: Date.now(),
        error: 'Failed to fetch market data',
      },
      { status: 500 },
    );
  }
}
