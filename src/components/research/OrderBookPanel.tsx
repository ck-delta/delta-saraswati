'use client';

import { useMemo } from 'react';
import { useResearchStore } from '@/stores/research-store';
import { formatPrice } from '@/lib/format';

const MAX_LEVELS = 8;

export function OrderBookPanel() {
  const { orderBook, loadingOrderBook, selectedToken } = useResearchStore();

  const { bids, asks, maxSize, spread, spreadPct } = useMemo(() => {
    if (!orderBook) {
      return { bids: [], asks: [], maxSize: 0, spread: 0, spreadPct: 0 };
    }

    const rawBids = (orderBook.buy ?? [])
      .slice(0, MAX_LEVELS)
      .map((entry) => ({ price: parseFloat(entry.price), size: entry.size }));

    const rawAsks = (orderBook.sell ?? [])
      .slice(0, MAX_LEVELS)
      .map((entry) => ({ price: parseFloat(entry.price), size: entry.size }));

    const allSizes = [
      ...rawBids.map((b) => b.size),
      ...rawAsks.map((a) => a.size),
    ];
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

  if (!selectedToken) return null;

  if (loadingOrderBook || !orderBook) {
    return (
      <div
        className="p-4"
        style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--bg-secondary)',
          borderRadius: 'var(--radius-2xl)',
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div
            className="h-4 w-24 rounded animate-pulse"
            style={{ background: 'var(--bg-secondary)' }}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={`bid-${i}`}
                className="h-5 w-full rounded animate-pulse"
                style={{ background: 'var(--bg-secondary)' }}
              />
            ))}
          </div>
          <div className="space-y-1.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={`ask-${i}`}
                className="h-5 w-full rounded animate-pulse"
                style={{ background: 'var(--bg-secondary)' }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="p-4"
      style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--bg-secondary)',
        borderRadius: 'var(--radius-2xl)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3
          className="text-xs uppercase tracking-wider"
          style={{ color: 'var(--text-secondary)' }}
        >
          Order Book
        </h3>
        <span
          className="text-[10px]"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Top {MAX_LEVELS} levels
        </span>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-2 gap-4 mb-2">
        <div
          className="flex justify-between text-[10px] px-1"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <span>Size</span>
          <span>Bid Price</span>
        </div>
        <div
          className="flex justify-between text-[10px] px-1"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <span>Ask Price</span>
          <span>Size</span>
        </div>
      </div>

      {/* Levels */}
      <div className="grid grid-cols-2 gap-4">
        {/* Bids */}
        <div className="space-y-0.5">
          {bids.map((bid, i) => {
            const depthPercent = (bid.size / maxSize) * 100;
            return (
              <div
                key={`bid-${i}`}
                className="relative flex items-center justify-between px-1 py-0.5"
                style={{ borderRadius: 'var(--radius-sm)' }}
              >
                <div
                  className="absolute right-0 top-0 bottom-0"
                  style={{
                    width: `${depthPercent}%`,
                    background: 'var(--chart-bg-positive)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                />
                <span
                  className="relative text-[11px] font-mono-num"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {bid.size.toLocaleString()}
                </span>
                <span
                  className="relative text-[11px] font-mono-num"
                  style={{ color: 'var(--positive-text)' }}
                >
                  {formatPrice(bid.price)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Asks */}
        <div className="space-y-0.5">
          {asks.map((ask, i) => {
            const depthPercent = (ask.size / maxSize) * 100;
            return (
              <div
                key={`ask-${i}`}
                className="relative flex items-center justify-between px-1 py-0.5"
                style={{ borderRadius: 'var(--radius-sm)' }}
              >
                <div
                  className="absolute left-0 top-0 bottom-0"
                  style={{
                    width: `${depthPercent}%`,
                    background: 'var(--chart-bg-negative)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                />
                <span
                  className="relative text-[11px] font-mono-num"
                  style={{ color: 'var(--negative-text)' }}
                >
                  {formatPrice(ask.price)}
                </span>
                <span
                  className="relative text-[11px] font-mono-num"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {ask.size.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Spread */}
      <div
        className="mt-3 pt-3 flex items-center justify-center gap-3"
        style={{ borderTop: '1px solid var(--divider-primary)' }}
      >
        <span
          className="text-[10px]"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Spread
        </span>
        <span
          className="text-xs font-mono-num"
          style={{ color: 'var(--text-primary)' }}
        >
          {formatPrice(spread)}
        </span>
        <span
          className="text-[10px] font-mono-num"
          style={{ color: 'var(--text-tertiary)' }}
        >
          ({spreadPct.toFixed(3)}%)
        </span>
      </div>
    </div>
  );
}
