'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useMarketStore } from '@/stores/market-store';
import { CACHE_TTL } from '@/lib/constants';
import TokenCardGrid from '@/components/home/TokenCardGrid';
import DailyPulseSummary from '@/components/home/DailyPulseSummary';
import NewsSection from '@/components/home/NewsSection';

/**
 * Home page — hero, token grid, AI pulse, news.
 * Auto-fetches on mount, refreshes market data every 30s.
 */
export default function Home() {
  const fetchMarketData = useMarketStore((s) => s.fetchMarketData);
  const fetchNews = useMarketStore((s) => s.fetchNews);
  const fetchDailyPulse = useMarketStore((s) => s.fetchDailyPulse);

  const didFetch = useRef(false);

  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;
    fetchMarketData();
    fetchNews();
    fetchDailyPulse();
  }, [fetchMarketData, fetchNews, fetchDailyPulse]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchMarketData();
    }, CACHE_TTL.MARKET_DATA);
    return () => clearInterval(interval);
  }, [fetchMarketData]);

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-8 space-y-8 animate-fade-in">
      {/* ---- Hero ---- */}
      <section className="flex flex-col gap-3">
        <h1
          className="text-3xl md:text-5xl font-bold tracking-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          Your AI co-pilot for crypto
        </h1>
        <p
          className="max-w-2xl text-base md:text-lg"
          style={{ color: 'var(--text-secondary)' }}
        >
          Live market data, AI-powered research, and conversational insights —
          built on Delta Exchange.
        </p>
      </section>

      {/* ---- Markets ---- */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <h2
            className="text-sm font-semibold uppercase tracking-wider"
            style={{ color: 'var(--text-secondary)' }}
          >
            Markets
          </h2>
          <div
            className="h-px flex-1"
            style={{ background: 'var(--divider-primary)' }}
          />
          <div className="flex items-center gap-1.5">
            <span
              className="h-1.5 w-1.5 rounded-full animate-pulse-dot"
              style={{ background: 'var(--positive-text)' }}
            />
            <span
              className="text-[10px]"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Live
            </span>
          </div>
        </div>
        <TokenCardGrid />
      </section>

      {/* ---- Two-col: AI Pulse + News ---- */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <DailyPulseSummary />
        </div>
        <div className="lg:col-span-2">
          <NewsSection />
        </div>
      </section>

      {/* ---- Bottom CTA ---- */}
      <section>
        <div
          className="flex flex-col items-center gap-3 px-6 py-8 text-center"
          style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--bg-secondary)',
            borderRadius: 'var(--radius-2xl)',
          }}
        >
          <h2
            className="text-base font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            Ready to dive deeper?
          </h2>
          <p
            className="max-w-md text-sm"
            style={{ color: 'var(--text-secondary)' }}
          >
            Ask Saraswati anything about the crypto markets — technical
            analysis, news summaries, whale activity, and more.
          </p>
          <Link
            href="/chat"
            className="mt-2 inline-flex h-9 items-center justify-center px-6 text-sm font-medium transition-colors duration-150"
            style={{
              background: 'var(--brand-bg)',
              color: 'var(--text-on-bg)',
              borderRadius: 'var(--radius-md)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--brand-bg-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--brand-bg)';
            }}
          >
            Start Exploring
          </Link>
        </div>
      </section>
    </div>
  );
}
