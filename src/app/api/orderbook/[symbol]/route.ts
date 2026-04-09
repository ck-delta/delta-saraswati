import { NextResponse } from 'next/server';
import { getOrderBook } from '@/lib/api/delta';

export const revalidate = 10;

interface RouteContext {
  params: Promise<{ symbol: string }>;
}

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const { symbol } = await context.params;

    if (!symbol) {
      return NextResponse.json(
        { error: 'Missing symbol parameter' },
        { status: 400 },
      );
    }

    const orderBook = await getOrderBook(symbol);

    return NextResponse.json({
      symbol,
      buy: orderBook.buy ?? [],
      sell: orderBook.sell ?? [],
      timestamp: Date.now(),
    });
  } catch (err) {
    console.error(`Orderbook route error [${(await context.params).symbol}]:`, err);
    return NextResponse.json(
      { buy: [], sell: [], error: 'Failed to fetch order book' },
      { status: 500 },
    );
  }
}
