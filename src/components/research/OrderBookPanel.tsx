'use client';

import { useMemo } from 'react';
import { useResearchStore } from '@/stores/research-store';
import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/utils';

const MAX_LEVELS = 8;

export function OrderBookPanel() {
  const { orderBook, loadingOrderBook, selectedToken } = useResearchStore();

  const { bids, asks, maxSize, spread, spreadPct } = useMemo(() => {
    if (!orderBook) {
      return { bids: [], asks: [], maxSize: 0, spread: 0, spreadPct: 0 };
    }

    const rawBids = (orderBook.buy ?? [])
      .slice(0, MAX_LEVELS)
      .map((entry) => ({
        price: parseFloat(entry.price),
        size: entry.size,
      }));

    const rawAsks = (orderBook.sell ?? [])
      .slice(0, MAX_LEVELS)
      .map((entry) => ({
        price: parseFloat(entry.price),
        size: entry.size,
      }));

    const allSizes = [...rawBids.map((b) => b.size), ...rawAsks.map((a) => a.size)];
    const max = Math.max(...allSizes, 1);

    const bestBid = rawBids[0]?.price ?? 0;
    const bestAsk = rawAsks[0]?.price ?? 0;
    const sp = bestAsk - bestBid;
    const mid = (bestAsk + bestBid) / 2;
    const spPct = mid > 0 ? (sp / mid) * 100 : 0;

    return {
      bids: rawBids,
      asks: rawAsks,
      maxSize: max,
      spread: sp,
      spreadPct: spPct,
    };
  }, [orderBook]);

  if (!selectedToken) {
    return null;
  }

  if (loadingOrderBook || !orderBook) {
    return (
      <div className="bg-[#111214] border border-[#1e2024] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 w-24 rounded bg-[#1e2024] animate-pulse" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={`bid-${i}`} className="h-5 w-full rounded bg-[#1e2024] animate-pulse" />
            ))}
          </div>
          <div className="space-y-1.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={`ask-${i}`} className="h-5 w-full rounded bg-[#1e2024] animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#111214] border border-[#1e2024] rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs uppercase tracking-wider text-[#555a65]">
          Order Book
        </h3>
        <span className="text-[10px] text-[#555a65]">Top {MAX_LEVELS} levels</span>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-2 gap-4 mb-2">
        <div className="flex justify-between text-[10px] text-[#555a65] px-1">
          <span>Size</span>
          <span>Bid Price</span>
        </div>
        <div className="flex justify-between text-[10px] text-[#555a65] px-1">
          <span>Ask Price</span>
          <span>Size</span>
        </div>
      </div>

      {/* Order book levels */}
      <div className="grid grid-cols-2 gap-4">
        {/* Bids (green, left) */}
        <div className="space-y-0.5">
          {bids.map((bid, i) => {
            const depthPercent = (bid.size / maxSize) * 100;
            return (
              <div
                key={`bid-${i}`}
                className="relative flex items-center justify-between px-1 py-0.5 rounded-sm"
              >
                <div
                  className="absolute right-0 top-0 bottom-0 rounded-sm bg-[#22c55e]/8"
                  style={{ width: `${depthPercent}%` }}
                />
                <span className="relative text-[11px] font-mono text-[#8b8f99]">
                  {bid.size.toLocaleString()}
                </span>
                <span className="relative text-[11px] font-mono text-[#22c55e]">
                  {formatPrice(bid.price)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Asks (red, right) */}
        <div className="space-y-0.5">
          {asks.map((ask, i) => {
            const depthPercent = (ask.size / maxSize) * 100;
            return (
              <div
                key={`ask-${i}`}
                className="relative flex items-center justify-between px-1 py-0.5 rounded-sm"
              >
                <div
                  className="absolute left-0 top-0 bottom-0 rounded-sm bg-[#ef4444]/8"
                  style={{ width: `${depthPercent}%` }}
                />
                <span className="relative text-[11px] font-mono text-[#ef4444]">
                  {formatPrice(ask.price)}
                </span>
                <span className="relative text-[11px] font-mono text-[#8b8f99]">
                  {ask.size.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Spread indicator */}
      <div className="mt-3 pt-3 border-t border-[#1e2024] flex items-center justify-center gap-3">
        <span className="text-[10px] text-[#555a65]">Spread</span>
        <span className="text-xs font-mono text-[#eaedf3]">
          {formatPrice(spread)}
        </span>
        <span className="text-[10px] font-mono text-[#555a65]">
          ({spreadPct.toFixed(3)}%)
        </span>
      </div>
    </div>
  );
}
