import { NextRequest, NextResponse } from "next/server";
import { fetchDeltaCandles } from "@/lib/api/delta";
import { calculateRSI, calculateMACD, calculateSMA } from "@/lib/indicators";
import { cached } from "@/lib/cache";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;

  try {
    const end = Math.floor(Date.now() / 1000);
    const start = end - 200 * 3600;

    const { data } = await cached(`delta:candles:${symbol}:1h`, 300, () => fetchDeltaCandles(symbol, "1h", start, end));
    const candles = data as any[];
    const closes = candles.map((c: any) => c.close);

    const indicators = {
      rsi: calculateRSI(closes),
      macd: calculateMACD(closes),
      sma20: calculateSMA(closes, 20),
      sma50: calculateSMA(closes, 50),
      sma200: calculateSMA(closes, 200),
    };

    return NextResponse.json({ success: true, data: indicators, timestamp: Date.now() });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, timestamp: Date.now() }, { status: 500 });
  }
}
