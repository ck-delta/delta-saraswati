import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getCandles } from '@/lib/api/delta';

export const revalidate = 60;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const symbol = searchParams.get('symbol');
    if (!symbol) {
      return NextResponse.json(
        { error: 'Missing required query parameter: symbol' },
        { status: 400 },
      );
    }

    const resolution = searchParams.get('resolution') || '1d';
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');

    // Default to last 30 days if start/end not provided
    const now = Math.floor(Date.now() / 1000);
    const start = startParam ? parseInt(startParam, 10) : now - 30 * 24 * 60 * 60;
    const end = endParam ? parseInt(endParam, 10) : now;

    if (isNaN(start) || isNaN(end)) {
      return NextResponse.json(
        { error: 'Invalid start or end timestamp (must be Unix seconds)' },
        { status: 400 },
      );
    }

    const candles = await getCandles(symbol, resolution, start, end);

    // Return normalized candle data
    const data = candles.map((c) => ({
      time: c.time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      volume: c.volume,
    }));

    return NextResponse.json({
      symbol,
      resolution,
      candles: data,
      count: data.length,
    });
  } catch (err) {
    console.error('Candles route error:', err);
    return NextResponse.json(
      { candles: [], count: 0, error: 'Failed to fetch candle data' },
      { status: 500 },
    );
  }
}
