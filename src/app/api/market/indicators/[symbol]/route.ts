import { NextRequest, NextResponse } from "next/server";
import { fetchDeltaCandles } from "@/lib/api/delta";
import {
  calculateRSI,
  calculateMACD,
  classifyMACD,
  calculateSMA,
  calculateADX,
  calculatePivotPoints,
  generateTrendSummary,
  generateOverallSignal,
} from "@/lib/indicators";
import { cached } from "@/lib/cache";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;

  try {
    const end = Math.floor(Date.now() / 1000);
    const start = end - 200 * 3600;

    const { data } = await cached(`delta:candles:${symbol}:1h`, 300, () => fetchDeltaCandles(symbol, "1h", start, end));
    const candles = data as any[];

    // Extract OHLC arrays
    const highs = candles.map((c: any) => Number(c.high));
    const lows = candles.map((c: any) => Number(c.low));
    const closes = candles.map((c: any) => Number(c.close));

    // Core indicators
    const rsi = calculateRSI(closes);
    const macd = calculateMACD(closes);
    const sma20 = calculateSMA(closes, 20);
    const sma50 = calculateSMA(closes, 50);
    const sma200 = calculateSMA(closes, 200);

    // MACD signal classification
    const macdSignal = macd ? classifyMACD(macd) : null;

    // ADX from OHLC
    const adx = calculateADX(highs, lows, closes);

    // Pivot points from previous day's OHLC (24-48h ago candles)
    let pivotPoints = null;
    if (candles.length >= 48) {
      const prevDayCandles = candles.slice(-48, -24);
      const prevHigh = Math.max(...prevDayCandles.map((c: any) => Number(c.high)));
      const prevLow = Math.min(...prevDayCandles.map((c: any) => Number(c.low)));
      const prevClose = Number(prevDayCandles[prevDayCandles.length - 1].close);
      pivotPoints = calculatePivotPoints(prevHigh, prevLow, prevClose);
    }

    // Trend summary
    const currentPrice = closes[closes.length - 1];
    const trendSummary = generateTrendSummary(currentPrice, sma20, sma50, sma200);

    // Sparkline: last 24 hourly close prices for mini charts
    const sparkline = closes.slice(-24);

    // Overall signal
    const overallSignal = generateOverallSignal(rsi, macdSignal, adx, currentPrice, sma20, sma50, sma200);

    const indicators = {
      rsi,
      macd: macd ? { value: macd.value, signal: macd.signal, histogram: macd.histogram } : null,
      macdSignal,
      sma20,
      sma50,
      sma200,
      adx,
      pivotPoints,
      trendSummary,
      sparkline,
      overallSignal,
    };

    return NextResponse.json({ success: true, data: indicators, timestamp: Date.now() });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, timestamp: Date.now() }, { status: 500 });
  }
}
