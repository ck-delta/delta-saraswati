import { NextRequest, NextResponse } from "next/server";
import { fetchDeltaCandles } from "@/lib/api/delta";
import { cached } from "@/lib/cache";

const RESOLUTION_SECONDS: Record<string, number> = {
  "1m": 60, "3m": 180, "5m": 300, "15m": 900, "30m": 1800,
  "1h": 3600, "2h": 7200, "4h": 14400, "6h": 21600,
  "1d": 86400, "1w": 604800, "7d": 604800, "2w": 1209600, "30d": 2592000,
};

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const symbol = searchParams.get("symbol") || "BTCUSD";
  const resolution = searchParams.get("resolution") || "1h";
  const end = Math.floor(Date.now() / 1000);
  const candleSeconds = RESOLUTION_SECONDS[resolution] || 3600;
  const start = end - 200 * candleSeconds;

  try {
    const { data, fromCache } = await cached(
      `delta:candles:${symbol}:${resolution}`,
      300,
      () => fetchDeltaCandles(symbol, resolution, start, end)
    );
    // Delta API returns candles newest-first; sort ascending for lightweight-charts
    const sorted = Array.isArray(data) ? (data as any[]).sort((a, b) => a.time - b.time) : data;
    return NextResponse.json({ success: true, data: sorted, cached: fromCache, timestamp: Date.now() });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, timestamp: Date.now() }, { status: 500 });
  }
}
