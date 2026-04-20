'use client';

import { useMarketStore } from '@/stores/market-store';
import TokenCard, { TokenCardSkeleton } from '@/components/home/TokenCard';

/**
 * Responsive grid for the 3 featured token cards.
 */
export default function TokenCardGrid() {
  const tokens = useMarketStore((s) => s.tokens);
  const fearGreed = useMarketStore((s) => s.fearGreed);
  const loading = useMarketStore((s) => s.loadingMarket);
  const error = useMarketStore((s) => s.errorMarket);
  const fetchMarketData = useMarketStore((s) => s.fetchMarketData);

  if (error && tokens.length === 0) {
    return (
      <div
        className="flex flex-col items-center gap-3 p-8 text-center"
        style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--bg-secondary)',
          borderRadius: 'var(--radius-2xl)',
        }}
      >
        <svg
          className="h-6 w-6"
          style={{ color: 'var(--negative-text)' }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Failed to load market data
        </p>
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          {error}
        </p>
        <button
          onClick={() => fetchMarketData()}
          className="mt-1 px-4 py-2 text-sm font-medium transition-colors duration-150"
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
          Retry
        </button>
      </div>
    );
  }

  if (loading && tokens.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TokenCardSkeleton />
        <TokenCardSkeleton />
        <TokenCardSkeleton />
      </div>
    );
  }

  if (tokens.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {tokens.map((token, index) => (
        <div
          key={token.symbol}
          className="animate-fade-in"
          style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'both' }}
        >
          <TokenCard token={token} fearGreed={fearGreed} />
        </div>
      ))}
    </div>
  );
}
