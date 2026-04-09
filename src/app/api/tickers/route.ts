import { NextResponse } from 'next/server';
import {
  getTickers,
  filterPerpetuals,
  parseTickerToTokenCard,
} from '@/lib/api/delta';

export const revalidate = 30;

export async function GET() {
  try {
    const allTickers = await getTickers();
    const perpetuals = filterPerpetuals(allTickers);
    const tokenCards = perpetuals.map(parseTickerToTokenCard);

    // Sort by turnover (most liquid first)
    tokenCards.sort((a, b) => b.turnoverUsd - a.turnoverUsd);

    return NextResponse.json({
      tickers: tokenCards,
      count: tokenCards.length,
      timestamp: Date.now(),
    });
  } catch (err) {
    console.error('Tickers route error:', err);
    return NextResponse.json(
      { tickers: [], count: 0, timestamp: Date.now(), error: 'Failed to fetch tickers' },
      { status: 500 },
    );
  }
}
