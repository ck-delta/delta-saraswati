'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useMarketStore } from '@/stores/market-store';
import { CACHE_TTL } from '@/lib/constants';
import TokenCardGrid from '@/components/home/TokenCardGrid';
import DailyPulseSummary from '@/components/home/DailyPulseSummary';
import NewsSection from '@/components/home/NewsSection';

/**
 * Home / Daily Pulse page.
 * Fetches market data, news, and daily pulse on mount.
 * Auto-refreshes market data every 30 seconds.
 */
export default function Home() {
  const fetchMarketData = useMarketStore((s) => s.fetchMarketData);
  const fetchNews = useMarketStore((s) => s.fetchNews);
  const fetchDailyPulse = useMarketStore((s) => s.fetchDailyPulse);

  // Ref to track if initial fetch has fired (avoid double-fetch in StrictMode)
  const didFetch = useRef(false);

  // Initial data fetch
  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;

    fetchMarketData();
    fetchNews();
    fetchDailyPulse();
  }, [fetchMarketData, fetchNews, fetchDailyPulse]);

  // Auto-refresh market data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMarketData();
    }, CACHE_TTL.MARKET_DATA);

    return () => clearInterval(interval);
  }, [fetchMarketData]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 bg-grid">
      {/* ================================================================
          Welcome Banner
          ================================================================ */}
      <section className="mb-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-white sm:text-2xl text-gradient">
            Delta Saraswati
          </h1>
          <p className="text-sm text-[#9ca3af]">
            Your AI Crypto Research Assistant — real-time market intelligence at your fingertips.
          </p>
        </div>

        {/* Live indicator */}
        <div className="mt-3 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#00c076] animate-pulse-dot" />
          <span className="text-xs text-[#6b7280]">Live market data</span>
        </div>
      </section>

      {/* ================================================================
          Token Card Grid (BTC, ETH, SOL)
          ================================================================ */}
      <section className="mb-8">
        <TokenCardGrid />
      </section>

      {/* ================================================================
          Two-column layout: Daily Pulse + News
          ================================================================ */}
      <section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DailyPulseSummary />
        <NewsSection />
      </section>

      {/* ================================================================
          Bottom CTA
          ================================================================ */}
      <section className="mb-6">
        <div className="flex flex-col items-center gap-3 rounded-xl border border-[#2a2a32] bg-[#1a1a1f] px-6 py-8 text-center">
          <h2 className="text-lg font-semibold text-white">
            Ready to dive deeper?
          </h2>
          <p className="max-w-md text-sm text-[#9ca3af]">
            Ask Saraswati anything about the crypto markets — technical analysis, news summaries, whale activity, and more.
          </p>
          <Link
            href="/chat"
            className="mt-2 inline-flex h-10 items-center justify-center rounded-lg bg-[#fd7d02] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#e06d00]"
          >
            Start Exploring
          </Link>
        </div>
      </section>
    </div>
  );
}
