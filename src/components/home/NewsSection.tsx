'use client';

import { useState } from 'react';
import { useMarketStore } from '@/stores/market-store';
import { Skeleton } from '@/components/ui/skeleton';
import { formatRelativeTime } from '@/lib/format';
import type { NewsItem } from '@/types/news';

const INITIAL_COUNT = 8;
const LOAD_MORE_COUNT = 8;

/**
 * Premium news list card.
 * Shows news headlines with sentiment dots, source badges, and timestamps.
 */
export default function NewsSection() {
  const news = useMarketStore((s) => s.news);
  const loading = useMarketStore((s) => s.loadingNews);
  const error = useMarketStore((s) => s.errorNews);
  const fetchNews = useMarketStore((s) => s.fetchNews);

  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);

  const safeNews = news ?? [];
  const visibleNews = safeNews.slice(0, visibleCount);
  const hasMore = safeNews.length > visibleCount;

  return (
    <div className="rounded-xl border border-[#1e2024] bg-[#111214] p-5">
      {/* ---- Header ---- */}
      <div className="flex items-center gap-2">
        <svg
          className="h-4 w-4 text-[#8b8f99]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6V7.5Z"
          />
        </svg>
        <h2 className="text-sm font-semibold text-[#eaedf3]">Latest News</h2>
      </div>

      {/* ---- Content ---- */}
      <div className="mt-4 space-y-0.5">
        {loading && safeNews.length === 0 ? (
          <NewsLoadingSkeleton />
        ) : error && safeNews.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <p className="text-sm text-[#8b8f99]">Could not load news</p>
            <button
              onClick={() => fetchNews()}
              className="text-xs text-[#f7931a] hover:underline"
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            {visibleNews.map((item) => (
              <NewsItemRow key={item.id} item={item} />
            ))}

            {hasMore && (
              <button
                onClick={() => setVisibleCount((c) => c + LOAD_MORE_COUNT)}
                className="mt-3 w-full rounded-lg border border-[#1e2024] py-2 text-xs font-medium text-[#8b8f99] transition-colors hover:border-[#2a2d33] hover:text-[#eaedf3]"
              >
                Show more
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single news item
// ---------------------------------------------------------------------------

function NewsItemRow({ item }: { item: NewsItem }) {
  const dotColor = getSentimentDotColor(item.sentiment);

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-[#181a1d]/50"
    >
      {/* Sentiment dot — 6px */}
      <span
        className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: dotColor }}
      />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {/* Title */}
        <span className="text-sm leading-snug text-[#c0c4cc] group-hover:text-[#eaedf3] line-clamp-2">
          {item.title}
        </span>

        {/* Source + time */}
        <div className="flex items-center gap-2">
          <span className="inline-flex shrink-0 rounded bg-[#181a1d] px-1.5 py-0.5 text-[10px] font-medium text-[#8b8f99]">
            {item.source}
          </span>
          <span className="text-[10px] text-[#555a65]">
            {formatRelativeTime(item.publishedAt)}
          </span>
        </div>
      </div>
    </a>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getSentimentDotColor(sentiment?: string): string {
  switch (sentiment) {
    case 'positive':
      return '#22c55e';
    case 'negative':
      return '#ef4444';
    case 'neutral':
    default:
      return '#555a65';
  }
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function NewsLoadingSkeleton() {
  return (
    <div className="space-y-0.5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-start gap-2.5 px-2 py-2">
          <Skeleton className="mt-[7px] h-1.5 w-1.5 rounded-full" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-4 w-full" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-16 rounded" />
              <Skeleton className="h-3 w-10" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
