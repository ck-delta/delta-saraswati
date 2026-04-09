'use client';

import { useState } from 'react';
import { useMarketStore } from '@/stores/market-store';
import { Skeleton } from '@/components/ui/skeleton';
import { formatRelativeTime } from '@/lib/format';
import type { NewsItem } from '@/types/news';

const INITIAL_COUNT = 10;
const LOAD_MORE_COUNT = 10;

/**
 * News headlines section.
 * Displays a list of news items with source, timestamp, and sentiment indicator.
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
    <div className="rounded-xl border border-[#2a2a32] bg-[#1a1a1f] p-5 animate-fade-in">
      {/* ---- Header ---- */}
      <div className="flex items-center gap-2">
        {/* Newspaper icon */}
        <svg
          className="h-5 w-5 text-[#9ca3af]"
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
        <h2 className="text-base font-semibold text-white">Latest News</h2>
      </div>

      {/* ---- Content ---- */}
      <div className="mt-4 space-y-1">
        {loading && safeNews.length === 0 ? (
          <NewsLoadingSkeleton />
        ) : error && safeNews.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <p className="text-sm text-[#9ca3af]">Could not load news</p>
            <button
              onClick={() => fetchNews()}
              className="text-xs text-[#fd7d02] hover:underline"
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
                className="mt-3 w-full rounded-lg border border-[#2a2a32] py-2 text-sm font-medium text-[#9ca3af] transition-colors hover:bg-[#222228] hover:text-white"
              >
                Load more
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single news item row
// ---------------------------------------------------------------------------

function NewsItemRow({ item }: { item: NewsItem }) {
  const sentimentColor = getSentimentDotColor(item.sentiment);

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-[#222228] animate-slide-in-left"
    >
      {/* Sentiment dot */}
      {sentimentColor && (
        <span
          className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: sentimentColor }}
          title={`Sentiment: ${item.sentiment}`}
        />
      )}
      {!sentimentColor && <span className="mt-1.5 h-2 w-2 shrink-0" />}

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {/* Title */}
        <span className="text-sm leading-snug text-[#d1d5db] group-hover:text-white line-clamp-2">
          {item.title}
        </span>

        {/* Source + timestamp */}
        <div className="flex items-center gap-2">
          <span className="inline-flex shrink-0 rounded bg-[#222228] px-1.5 py-0.5 text-[10px] font-medium text-[#9ca3af] group-hover:bg-[#2a2a32]">
            {item.source}
          </span>
          <span className="text-[10px] text-[#6b7280]">
            {formatRelativeTime(item.publishedAt)}
          </span>
        </div>
      </div>

      {/* External link indicator */}
      <svg
        className="mt-1 h-3.5 w-3.5 shrink-0 text-[#6b7280] opacity-0 transition-opacity group-hover:opacity-100"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
        />
      </svg>
    </a>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getSentimentDotColor(sentiment?: string): string | null {
  switch (sentiment) {
    case 'positive':
      return '#00c076';
    case 'negative':
      return '#ff4d4f';
    case 'neutral':
      return '#6b7280';
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function NewsLoadingSkeleton() {
  return (
    <div className="space-y-1">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 px-2 py-2.5">
          <Skeleton className="mt-1.5 h-2 w-2 rounded-full" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-4 w-full" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-20 rounded" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
