'use client';

import { useState } from 'react';
import { useMarketStore } from '@/stores/market-store';
import { Skeleton } from '@/components/ui/skeleton';
import { formatRelativeTime } from '@/lib/format';
import type { NewsItem } from '@/types/news';

const INITIAL_COUNT = 8;
const LOAD_MORE_COUNT = 8;

/**
 * Latest news card — Delta tokens only.
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
    <div
      className="p-5"
      style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--bg-secondary)',
        borderRadius: 'var(--radius-2xl)',
      }}
    >
      <div className="flex items-center gap-2">
        <h2
          className="text-sm font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          Latest News
        </h2>
      </div>

      <div className="mt-4">
        {loading && safeNews.length === 0 ? (
          <NewsLoadingSkeleton />
        ) : error && safeNews.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Could not load news
            </p>
            <button
              onClick={() => fetchNews()}
              className="text-xs hover:underline"
              style={{ color: 'var(--brand-text)' }}
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            <ul>
              {visibleNews.map((item, idx) => (
                <li
                  key={item.id}
                  style={{
                    borderTop:
                      idx === 0
                        ? 'none'
                        : '1px solid var(--divider-primary)',
                  }}
                >
                  <NewsItemRow item={item} />
                </li>
              ))}
            </ul>

            {hasMore && (
              <button
                onClick={() => setVisibleCount((c) => c + LOAD_MORE_COUNT)}
                className="mt-3 w-full py-2 text-xs font-medium transition-colors duration-150"
                style={{
                  border: '1px solid var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-secondary)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--bg-tertiary)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--bg-secondary)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
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

function NewsItemRow({ item }: { item: NewsItem }) {
  const sentimentColor = getSentimentColor(item.sentiment);

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-2.5 transition-colors"
      style={{
        padding: '12px 8px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--bg-surface-alt)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      <span
        className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ background: sentimentColor }}
      />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span
          className="text-sm leading-snug line-clamp-2"
          style={{ color: 'var(--text-primary)' }}
        >
          {item.title}
        </span>
        <div className="flex items-center gap-2">
          <span
            className="inline-flex shrink-0 text-[10px] font-medium"
            style={{
              padding: '1px 6px',
              background: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            {item.source}
          </span>
          <span
            className="text-[11px]"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {formatRelativeTime(item.publishedAt)}
          </span>
        </div>
      </div>
    </a>
  );
}

function getSentimentColor(sentiment?: string): string {
  switch (sentiment) {
    case 'positive':
      return 'var(--positive-text)';
    case 'negative':
      return 'var(--negative-text)';
    case 'neutral':
    default:
      return 'var(--text-tertiary)';
  }
}

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
