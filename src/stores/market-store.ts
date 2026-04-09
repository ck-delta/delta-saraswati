import { create } from 'zustand';
import type { TokenCardData, FearGreedData, MarketDataResponse } from '@/types/market';
import type { NewsItem, DailyPulseResponse } from '@/types/news';

// ---------------------------------------------------------------------------
// Market Store — aggregated market data, news, daily pulse
// ---------------------------------------------------------------------------

interface MarketState {
  // Data
  tokens: TokenCardData[];
  allTickers: TokenCardData[];
  fearGreed: FearGreedData | null;
  news: NewsItem[];
  dailyPulse: DailyPulseResponse | null;

  // Loading flags
  loadingMarket: boolean;
  loadingNews: boolean;
  loadingDailyPulse: boolean;

  // Error messages
  errorMarket: string | null;
  errorNews: string | null;
  errorDailyPulse: string | null;

  // Last-fetched timestamps for stale detection
  lastFetchedMarket: number | null;
  lastFetchedNews: number | null;
  lastFetchedDailyPulse: number | null;
}

interface MarketActions {
  fetchMarketData: () => Promise<void>;
  fetchNews: () => Promise<void>;
  fetchDailyPulse: () => Promise<void>;
  /** Convenience: fetch market data + news in parallel */
  fetchAll: () => Promise<void>;
}

export const useMarketStore = create<MarketState & MarketActions>((set, get) => ({
  // ---------- State ----------
  tokens: [],
  allTickers: [],
  fearGreed: null,
  news: [],
  dailyPulse: null,

  loadingMarket: false,
  loadingNews: false,
  loadingDailyPulse: false,

  errorMarket: null,
  errorNews: null,
  errorDailyPulse: null,

  lastFetchedMarket: null,
  lastFetchedNews: null,
  lastFetchedDailyPulse: null,

  // ---------- Actions ----------

  fetchMarketData: async () => {
    // Prevent concurrent requests
    if (get().loadingMarket) return;

    set({ loadingMarket: true, errorMarket: null });

    try {
      const res = await fetch('/api/market-data', { cache: 'no-store' });

      if (!res.ok) {
        throw new Error(`Market data request failed: ${res.status}`);
      }

      const data: MarketDataResponse = await res.json();

      set({
        tokens: data.tokens,
        allTickers: data.allTickers,
        fearGreed: data.fearGreed,
        loadingMarket: false,
        lastFetchedMarket: Date.now(),
      });
    } catch (err) {
      set({
        loadingMarket: false,
        errorMarket: err instanceof Error ? err.message : 'Failed to fetch market data',
      });
    }
  },

  fetchNews: async () => {
    if (get().loadingNews) return;

    set({ loadingNews: true, errorNews: null });

    try {
      const res = await fetch('/api/news', { cache: 'no-store' });

      if (!res.ok) {
        throw new Error(`News request failed: ${res.status}`);
      }

      const data: { news: NewsItem[] } = await res.json();

      set({
        news: data.news ?? [],
        loadingNews: false,
        lastFetchedNews: Date.now(),
      });
    } catch (err) {
      set({
        loadingNews: false,
        errorNews: err instanceof Error ? err.message : 'Failed to fetch news',
      });
    }
  },

  fetchDailyPulse: async () => {
    if (get().loadingDailyPulse) return;

    set({ loadingDailyPulse: true, errorDailyPulse: null });

    try {
      const res = await fetch('/api/ai/daily-pulse', { cache: 'no-store' });

      if (!res.ok) {
        throw new Error(`Daily pulse request failed: ${res.status}`);
      }

      const data: DailyPulseResponse = await res.json();

      set({
        dailyPulse: data,
        loadingDailyPulse: false,
        lastFetchedDailyPulse: Date.now(),
      });
    } catch (err) {
      set({
        loadingDailyPulse: false,
        errorDailyPulse: err instanceof Error ? err.message : 'Failed to fetch daily pulse',
      });
    }
  },

  fetchAll: async () => {
    const { fetchMarketData, fetchNews } = get();
    await Promise.allSettled([fetchMarketData(), fetchNews()]);
  },
}));
