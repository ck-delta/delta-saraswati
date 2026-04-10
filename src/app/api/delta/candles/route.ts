import { NextRequest, NextResponse } from "next/server";
import { fetchDeltaCandles } from "@/lib/api/delta";
import { cached } from "@/lib/cache";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const symbol = searchParams.get("symbol") || "BTCUSD";
  const resolution = searchParams.get("resolution") || "1h";
  const end = Math.floor(Date.now() / 1000);
  const start = end - 200 * 3600; // 200 hours for indicator calculation

  try {
    const { data, fromCache } = await cached(
      `delta:candles:${symbol}:${resolution}`,
      300,
      () => fetchDeltaCandles(symbol, resolution, start, end)
    );
    return NextResponse.json({ success: true, data, cached: fromCache, timestamp: Date.now() });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, timestamp: Date.now() }, { status: 500 });
  }
}
