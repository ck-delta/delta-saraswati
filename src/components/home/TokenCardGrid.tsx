'use client';

import { useMarketStore } from '@/stores/market-store';
import TokenCard, { TokenCardSkeleton } from '@/components/home/TokenCard';

/**
 * Grid container for the 3 featured token cards (BTC, ETH, SOL).
 * Reads directly from the market store.
 */
export default function TokenCardGrid() {
  const tokens = useMarketStore((s) => s.tokens);
  const fearGreed = useMarketStore((s) => s.fearGreed);
  const loading = useMarketStore((s) => s.loadingMarket);
  const error = useMarketStore((s) => s.errorMarket);
  const fetchMarketData = useMarketStore((s) => s.fetchMarketData);

  // Error state
  if (error && tokens.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-[#2a2a32] bg-[#1a1a1f] p-8 text-center">
        <svg
          className="h-8 w-8 text-[#ff4d4f]"
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
        <p className="text-sm text-[#9ca3af]">Failed to load market data</p>
        <p className="text-xs text-[#6b7280]">{error}</p>
        <button
          onClick={() => fetchMarketData()}
          className="mt-1 rounded-lg bg-[#fd7d02] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#e06d00]"
        >
          Retry
        </button>
      </div>
    );
  }

  // Loading state
  if (loading && tokens.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 w-full">
        <TokenCardSkeleton />
        <TokenCardSkeleton />
        <TokenCardSkeleton />
      </div>
    );
  }

  // No data yet (shouldn't happen after loading completes, but handle it)
  if (tokens.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 w-full">
      {tokens.map((token, index) => (
        <div key={token.symbol} className={`stagger-${index + 1}`}>
          <TokenCard token={token} fearGreed={fearGreed} />
        </div>
      ))}
    </div>
  );
}
