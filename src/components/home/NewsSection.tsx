'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useMarketStore } from '@/stores/market-store';
import { Skeleton } from '@/components/ui/skeleton';
import { formatRelativeTime } from '@/lib/format';
import type { NewsItem } from '@/types/news';

const INITIAL_COUNT = 8;
const LOAD_MORE_COUNT = 8;

type Filter = 'all' | 'bullish' | 'bearish' | 'neutral';

const SENT_STYLE: Record<'positive' | 'negative' | 'neutral', { bg: string; fg: string; border: string; label: string }> = {
  positive: { bg: 'rgba(34, 197, 94, 0.10)',  fg: '#4ADE80', border: 'rgba(34, 197, 94, 0.3)',  label: 'BULLISH' },
  negative: { bg: 'rgba(248, 113, 113, 0.10)', fg: '#F87171', border: 'rgba(248, 113, 113, 0.3)', label: 'BEARISH' },
  neutral:  { bg: 'rgba(148, 163, 184, 0.08)', fg: '#94A3B8', border: 'rgba(148, 163, 184, 0.3)', label: 'NEUTRAL' },
};

function faviconUrl(domain: string | undefined, size = 32): string | null {
  if (!domain) return null;
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;
}

function sentimentKey(item: NewsItem): 'positive' | 'negative' | 'neutral' {
  if (item.sentiment === 'positive' || item.sentiment === 'negative' || item.sentiment === 'neutral') {
    return item.sentiment;
  }
  return 'neutral';
}

function matchesFilter(item: NewsItem, filter: Filter): boolean {
  if (filter === 'all') return true;
  const s = sentimentKey(item);
  if (filter === 'bullish') return s === 'positive';
  if (filter === 'bearish') return s === 'negative';
  return s === 'neutral';
}

export default function NewsSection() {
  const news = useMarketStore((s) => s.news);
  const loading = useMarketStore((s) => s.loadingNews);
  const error = useMarketStore((s) => s.errorNews);
  const fetchNews = useMarketStore((s) => s.fetchNews);

  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  const [filter, setFilter] = useState<Filter>('all');

  const safeNews = news ?? [];

  // Counts per filter (drives pill badges)
  const counts = useMemo(() => {
    let bullish = 0, bearish = 0, neutral = 0;
    for (const n of safeNews) {
      const s = sentimentKey(n);
      if (s === 'positive') bullish++;
      else if (s === 'negative') bearish++;
      else neutral++;
    }
    return { all: safeNews.length, bullish, bearish, neutral };
  }, [safeNews]);

  const filtered = useMemo(
    () => safeNews.filter((n) => matchesFilter(n, filter)),
    [safeNews, filter],
  );
  const visibleNews = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  return (
    <div className="rounded-xl border border-[#1e2024] bg-[#111214] p-5">
      {/* ---- Header ---- */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-[#8b8f99]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6V7.5Z" />
          </svg>
          <h2 className="text-sm font-semibold text-[#eaedf3]">Latest News</h2>
        </div>
        <span className="text-[10px] text-[#555a65]">
          {safeNews.length} {safeNews.length === 1 ? 'headline' : 'headlines'}
        </span>
      </div>

      {/* ---- Filter tabs ---- */}
      {safeNews.length > 0 && (
        <div className="mt-3 flex gap-1 rounded-lg bg-white/[0.02] border border-white/[0.04] p-1">
          <FilterTab label="All"      count={counts.all}      active={filter === 'all'}      onClick={() => { setFilter('all'); setVisibleCount(INITIAL_COUNT); }} />
          <FilterTab label="Bullish"  count={counts.bullish}  active={filter === 'bullish'}  onClick={() => { setFilter('bullish'); setVisibleCount(INITIAL_COUNT); }} color="#4ADE80" />
          <FilterTab label="Bearish"  count={counts.bearish}  active={filter === 'bearish'}  onClick={() => { setFilter('bearish'); setVisibleCount(INITIAL_COUNT); }} color="#F87171" />
          <FilterTab label="Neutral"  count={counts.neutral}  active={filter === 'neutral'}  onClick={() => { setFilter('neutral'); setVisibleCount(INITIAL_COUNT); }} color="#94A3B8" />
        </div>
      )}

      {/* ---- Content ---- */}
      <div className="mt-4 space-y-0.5">
        {loading && safeNews.length === 0 ? (
          <NewsLoadingSkeleton />
        ) : error && safeNews.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <p className="text-sm text-[#8b8f99]">Could not load news</p>
            <button onClick={() => fetchNews()} className="text-xs text-[#f7931a] hover:underline">
              Try again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-6 text-center text-xs text-[#8b8f99]">
            No {filter} headlines in current window.
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
// Filter tab
// ---------------------------------------------------------------------------

function FilterTab({
  label, count, active, onClick, color,
}: {
  label: string; count: number; active: boolean; onClick: () => void; color?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all"
      style={{
        background: active ? (color ? `${color}15` : 'rgba(255,255,255,0.05)') : 'transparent',
        color: active ? (color ?? '#eaedf3') : '#8b8f99',
        border: active && color ? `1px solid ${color}40` : '1px solid transparent',
      }}
    >
      <span>{label}</span>
      <span
        className="font-mono-num text-[9px] px-1 rounded"
        style={{
          background: active ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.04)',
          color: active ? (color ?? '#cbcfd7') : '#555a65',
        }}
      >
        {count}
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// News item row
// ---------------------------------------------------------------------------

function NewsItemRow({ item }: { item: NewsItem }) {
  const sentKey = sentimentKey(item);
  const sent = SENT_STYLE[sentKey];
  const favicon = faviconUrl(item.sourceDomain);

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-white/[0.02]"
    >
      {/* Favicon */}
      <div className="flex-shrink-0 pt-0.5">
        {favicon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={favicon}
            alt=""
            width={20}
            height={20}
            className="h-5 w-5 rounded-md"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-white/[0.04] text-[10px] font-bold text-[#8b8f99]">
            {item.source.charAt(0)}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1 flex flex-col gap-1.5">
        {/* Title */}
        <span className="text-sm leading-snug text-[#c0c4cc] group-hover:text-[#eaedf3] line-clamp-2">
          {item.title}
        </span>

        {/* Meta row: source + time + sentiment badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-[#8b8f99] font-medium">
            {item.source}
          </span>
          <span className="text-[10px] text-[#555a65]">·</span>
          <span className="text-[10px] text-[#555a65]">
            {formatRelativeTime(item.publishedAt)}
          </span>

          {/* Sentiment badge */}
          {item.sentiment && (
            <span
              className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{
                background: sent.bg,
                color: sent.fg,
                border: `1px solid ${sent.border}`,
              }}
            >
              {sent.label}
            </span>
          )}

          {/* Affected token chips */}
          {item.affectedTokens && item.affectedTokens.length > 0 && (
            <span className="flex items-center gap-1">
              {item.affectedTokens.slice(0, 3).map((sym) => (
                <Link
                  key={sym}
                  href={`/research?token=${sym}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-md transition-colors"
                  style={{
                    background: 'rgba(247, 147, 26, 0.08)',
                    color: '#F7931A',
                    border: '1px solid rgba(247, 147, 26, 0.2)',
                  }}
                >
                  {sym.replace(/USDT$/, '')}
                </Link>
              ))}
            </span>
          )}
        </div>
      </div>
    </a>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function NewsLoadingSkeleton() {
  return (
    <div className="space-y-0.5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 px-2 py-2.5">
          <Skeleton className="h-5 w-5 rounded-md" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-4 w-full" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-16 rounded" />
              <Skeleton className="h-3 w-10" />
              <Skeleton className="h-3 w-14 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
