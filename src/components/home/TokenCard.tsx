'use client';

import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import FearGreedGauge from '@/components/home/FearGreedGauge';
import SentimentBadge from '@/components/home/SentimentBadge';
import { TOKEN_INFO } from '@/lib/constants';
import { formatPrice, formatPercent, formatCompact } from '@/lib/format';
import type { TokenCardData, FearGreedData } from '@/types/market';

interface TokenCardProps {
  token: TokenCardData;
  fearGreed: FearGreedData | null;
}

/** Gradient colors per symbol for the token circle. */
const TOKEN_GRADIENTS: Record<string, string> = {
  BTC: 'from-[#f7931a]/20 to-[#f7931a]/5',
  ETH: 'from-[#627eea]/20 to-[#627eea]/5',
  SOL: 'from-[#9945ff]/20 to-[#9945ff]/5',
};

/**
 * Premium token card for the home grid.
 * Displays price, 24h change, volume/high/low stats, Fear & Greed gauge,
 * AI sentiment, and action buttons. Designed for a trading terminal aesthetic.
 */
export default function TokenCard({ token, fearGreed }: TokenCardProps) {
  const isPositive = token.priceChangePct24h >= 0;
  const info = TOKEN_INFO[token.symbol];
  const displayName = info?.name ?? token.name;
  const underlying = token.underlying ?? token.symbol.replace(/USDT?$/, '');
  const tradeUrl = `https://www.delta.exchange/app/futures/trade/${token.symbol}`;

  const gradient =
    TOKEN_GRADIENTS[underlying] ?? 'from-[#8b8f99]/20 to-[#8b8f99]/5';

  return (
    <div className="group flex flex-col gap-4 rounded-xl border border-[#1e2024] bg-[#111214] p-5 transition-all duration-200 hover:border-[#2a2d33]">
      {/* ---- Header: icon + symbol + name + change badge ---- */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Token circle with gradient and first letter */}
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${gradient}`}
          >
            <span className="text-sm font-bold text-[#eaedf3]">
              {underlying.charAt(0)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-[#eaedf3]">
              {underlying}
            </span>
            <span className="text-xs text-[#555a65]">{displayName}</span>
          </div>
        </div>

        {/* Change badge */}
        <span
          className={`inline-flex items-center rounded-md px-2 py-0.5 font-mono text-xs font-semibold ${
            isPositive
              ? 'bg-[#22c55e]/10 text-[#22c55e]'
              : 'bg-[#ef4444]/10 text-[#ef4444]'
          }`}
        >
          {formatPercent(token.priceChangePct24h)}
        </span>
      </div>

      {/* ---- Price ---- */}
      <div>
        <span className="font-mono text-2xl font-semibold text-[#eaedf3]">
          {formatPrice(token.price)}
        </span>
      </div>

      {/* ---- Stats: Volume | High | Low ---- */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="flex flex-col gap-0.5">
          <span className="text-[#8b8f99]">Volume</span>
          <span className="font-mono text-[#eaedf3]">
            {formatCompact(token.volume24h)}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[#8b8f99]">High</span>
          <span className="font-mono text-[#eaedf3]">
            {formatPrice(token.high24h)}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[#8b8f99]">Low</span>
          <span className="font-mono text-[#eaedf3]">
            {formatPrice(token.low24h)}
          </span>
        </div>
      </div>

      {/* ---- Separator ---- */}
      <div className="border-t border-[#1e2024]" />

      {/* ---- Fear & Greed + Sentiment ---- */}
      <div className="flex items-center justify-between">
        {fearGreed ? (
          <FearGreedGauge
            value={fearGreed.value}
            classification={fearGreed.classification}
          />
        ) : (
          <div className="flex h-12 w-16 items-center justify-center">
            <Skeleton className="h-10 w-14 rounded-md" />
          </div>
        )}

        <div className="flex flex-col items-end gap-1">
          <span className="text-[10px] text-[#555a65]">AI Sentiment</span>
          <SentimentBadge
            score={token.sentimentScore}
            label={token.sentimentLabel}
          />
        </div>
      </div>

      {/* ---- Action buttons ---- */}
      <div className="flex gap-2 pt-1">
        <Link
          href={`/research?token=${underlying}`}
          className="flex h-8 flex-1 items-center justify-center rounded-lg border border-[#1e2024] text-xs font-medium text-[#8b8f99] transition-colors hover:border-[#2a2d33] hover:text-[#eaedf3]"
        >
          Research
        </Link>
        <a
          href={tradeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-8 flex-1 items-center justify-center rounded-lg bg-[#f7931a] text-xs font-medium text-black transition-colors hover:bg-[#ffaa3b]"
        >
          Trade
        </a>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton loading state — matches card dimensions
// ---------------------------------------------------------------------------

export function TokenCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-[#1e2024] bg-[#111214] p-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex flex-col gap-1">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <Skeleton className="h-5 w-16 rounded-md" />
      </div>

      {/* Price */}
      <Skeleton className="h-8 w-32" />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>

      <div className="border-t border-[#1e2024]" />

      {/* Gauge + sentiment */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-12 w-16" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>

      {/* Buttons */}
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-8 flex-1 rounded-lg" />
        <Skeleton className="h-8 flex-1 rounded-lg" />
      </div>
    </div>
  );
}
