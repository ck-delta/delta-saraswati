'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useMarketStore } from '@/stores/market-store';
import { CACHE_TTL } from '@/lib/constants';
import TokenCardGrid from '@/components/home/TokenCardGrid';
import DailyPulseSummary from '@/components/home/DailyPulseSummary';
import NewsSection from '@/components/home/NewsSection';
import MarketMoodBar from '@/components/home/MarketMoodBar';

/**
 * Home page.
 * Premium layout: Markets grid, two-column AI pulse + news, subtle CTA.
 * Auto-fetches on mount, refreshes market data every 30s.
 */
export default function Home() {
  const fetchMarketData = useMarketStore((s) => s.fetchMarketData);
  const fetchNews = useMarketStore((s) => s.fetchNews);

  const didFetch = useRef(false);

  // Initial fetch. DailyPulseSummary manages its own data via /api/ai/daily-pulse.
  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;

    fetchMarketData();
    fetchNews();
  }, [fetchMarketData, fetchNews]);

  // 30s market data refresh
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMarketData();
    }, CACHE_TTL.MARKET_DATA);

    return () => clearInterval(interval);
  }, [fetchMarketData]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6 animate-fade-in">
      {/* ================================================================
          Market Mood Bar — sticky ribbon at top
          ================================================================ */}
      <MarketMoodBar />

      {/* ================================================================
          Markets Section
          ================================================================ */}
      <section className="mb-8 mt-6">
        <div className="mb-4 flex items-center gap-3">
          <h2 className="text-sm font-semibold text-[#eaedf3]">Markets</h2>
          <div className="h-px flex-1 bg-[#1e2024]" />
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e] animate-pulse" />
            <span className="text-[10px] text-[#555a65]">Live</span>
          </div>
        </div>
        <TokenCardGrid />
      </section>

      {/* ================================================================
          Two-column: Market Summary (3/5) + News (2/5)
          ================================================================ */}
      <section className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <DailyPulseSummary />
        </div>
        <div className="lg:col-span-2">
          <NewsSection />
        </div>
      </section>

      {/* ================================================================
          Bottom CTA
          ================================================================ */}
      <section className="mb-6">
        <div className="flex flex-col items-center gap-3 rounded-xl border border-[#1e2024] bg-[#111214] px-6 py-8 text-center">
          <h2 className="text-base font-semibold text-[#eaedf3]">
            Ready to dive deeper?
          </h2>
          <p className="max-w-md text-sm text-[#8b8f99]">
            Ask Saraswati anything about the crypto markets — technical
            analysis, news summaries, whale activity, and more.
          </p>
          <Link
            href="/chat"
            className="mt-2 inline-flex h-9 items-center justify-center rounded-lg bg-[#f7931a] px-6 text-sm font-medium text-black transition-colors hover:bg-[#ffaa3b]"
          >
            Start Exploring
          </Link>
        </div>
      </section>
    </div>
  );
}
