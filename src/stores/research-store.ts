import { create } from 'zustand';
import type { DeltaTicker, DeltaCandle, DeltaOrderBook } from '@/types/delta';

// ---------------------------------------------------------------------------
// Research Store — token analysis, candles, indicators, order book
// ---------------------------------------------------------------------------

// Technical indicator types
export interface RSIData {
  value: number;
  period: number;
}

export interface MACDData {
  macd: number;
  signal: number;
  histogram: number;
}

export interface BollingerData {
  upper: number;
  middle: number;
  lower: number;
}

export interface Indicators {
  rsi: RSIData | null;
  macd: MACDData | null;
  bollinger: BollingerData | null;
}

interface ResearchState {
  // Selected token
  selectedToken: string | null;

  // Market data for selected token
  ticker: DeltaTicker | null;
  candles: DeltaCandle[];
  orderBook: DeltaOrderBook | null;

  // Computed technical indicators
  indicators: Indicators;

  // Loading / error
  loading: boolean;
  loadingCandles: boolean;
  loadingOrderBook: boolean;
  error: string | null;
}

interface ResearchActions {
  selectToken: (symbol: string) => Promise<void>;
  fetchTokenData: (symbol: string) => Promise<void>;
  fetchCandles: (symbol: string, resolution?: string) => Promise<void>;
  fetchOrderBook: (symbol: string) => Promise<void>;
  clearSelection: () => void;
}

// ---- Technical Indicator Computation ----

function computeRSI(closes: number[], period = 14): RSIData | null {
  if (closes.length < period + 1) return null;

  let gains = 0;
  let losses = 0;

  // Initial average gain/loss
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  // Smooth with Wilder's method
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    avgGain = (avgGain * (period - 1) + (diff >= 0 ? diff : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (diff < 0 ? Math.abs(diff) : 0)) / period;
  }

  if (avgLoss === 0) return { value: 100, period };

  const rs = avgGain / avgLoss;
  const rsi = 100 - 100 / (1 + rs);

  return { value: Math.round(rsi * 100) / 100, period };
}

function computeMACD(
  closes: number[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9,
): MACDData | null {
  if (closes.length < slowPeriod + signalPeriod) return null;

  const ema = (data: number[], period: number): number[] => {
    const k = 2 / (period + 1);
    const result: number[] = [data[0]];
    for (let i = 1; i < data.length; i++) {
      result.push(data[i] * k + result[i - 1] * (1 - k));
    }
    return result;
  };

  const fastEMA = ema(closes, fastPeriod);
  const slowEMA = ema(closes, slowPeriod);

  const macdLine = fastEMA.map((v, i) => v - slowEMA[i]);
  const signalLine = ema(macdLine.slice(slowPeriod - 1), signalPeriod);

  const macdValue = macdLine[macdLine.length - 1];
  const signalValue = signalLine[signalLine.length - 1];

  return {
    macd: Math.round(macdValue * 100) / 100,
    signal: Math.round(signalValue * 100) / 100,
    histogram: Math.round((macdValue - signalValue) * 100) / 100,
  };
}

function computeBollinger(closes: number[], period = 20, stdDevMultiplier = 2): BollingerData | null {
  if (closes.length < period) return null;

  const recent = closes.slice(-period);
  const mean = recent.reduce((a, b) => a + b, 0) / period;
  const variance = recent.reduce((sum, val) => sum + (val - mean) ** 2, 0) / period;
  const stdDev = Math.sqrt(variance);

  return {
    upper: Math.round((mean + stdDevMultiplier * stdDev) * 100) / 100,
    middle: Math.round(mean * 100) / 100,
    lower: Math.round((mean - stdDevMultiplier * stdDev) * 100) / 100,
  };
}

function computeIndicators(candles: DeltaCandle[]): Indicators {
  if (candles.length === 0) {
    return { rsi: null, macd: null, bollinger: null };
  }

  const closes = candles.map((c) => c.close);

  return {
    rsi: computeRSI(closes),
    macd: computeMACD(closes),
    bollinger: computeBollinger(closes),
  };
}

// ---- Store ----

export const useResearchStore = create<ResearchState & ResearchActions>((set, get) => ({
  // ---------- State ----------
  selectedToken: null,
  ticker: null,
  candles: [],
  orderBook: null,
  indicators: { rsi: null, macd: null, bollinger: null },
  loading: false,
  loadingCandles: false,
  loadingOrderBook: false,
  error: null,

  // ---------- Actions ----------

  selectToken: async (symbol) => {
    set({ selectedToken: symbol, error: null });
    await get().fetchTokenData(symbol);
  },

  fetchTokenData: async (symbol) => {
    set({ loading: true, error: null });

    try {
      // Fetch ticker, candles, and order book in parallel
      await Promise.all([
        get().fetchCandles(symbol),
        get().fetchOrderBook(symbol),
        // Fetch ticker inline
        (async () => {
          const res = await fetch(`/api/tickers`);
          if (!res.ok) throw new Error(`Ticker request failed: ${res.status}`);
          const data = await res.json();
          // Find the matching ticker from the all-tickers response
          const tickers = data.tickers ?? data.result ?? data;
          const match = Array.isArray(tickers)
            ? tickers.find((t: Record<string, unknown>) => t.symbol === symbol)
            : null;
          if (match) set({ ticker: match });
        })(),
      ]);

      set({ loading: false });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch token data',
      });
    }
  },

  fetchCandles: async (symbol, resolution = '1h') => {
    set({ loadingCandles: true });

    try {
      const res = await fetch(
        `/api/candles?symbol=${encodeURIComponent(symbol)}&resolution=${resolution}`,
      );

      if (!res.ok) throw new Error(`Candles request failed: ${res.status}`);

      const data = await res.json();
      const candles: DeltaCandle[] = data.result ?? data.candles ?? data;

      // Compute indicators from the fresh candles
      const indicators = computeIndicators(candles);

      set({ candles, indicators, loadingCandles: false });
    } catch (err) {
      set({
        loadingCandles: false,
        error: err instanceof Error ? err.message : 'Failed to fetch candles',
      });
    }
  },

  fetchOrderBook: async (symbol) => {
    set({ loadingOrderBook: true });

    try {
      const res = await fetch(
        `/api/orderbook/${encodeURIComponent(symbol)}`,
      );

      if (!res.ok) throw new Error(`Order book request failed: ${res.status}`);

      const data = await res.json();
      set({ orderBook: data.result ?? data, loadingOrderBook: false });
    } catch (err) {
      set({
        loadingOrderBook: false,
        error: err instanceof Error ? err.message : 'Failed to fetch order book',
      });
    }
  },

  clearSelection: () => {
    set({
      selectedToken: null,
      ticker: null,
      candles: [],
      orderBook: null,
      indicators: { rsi: null, macd: null, bollinger: null },
      loading: false,
      error: null,
    });
  },
}));
