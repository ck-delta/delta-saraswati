'use client';

import Link from 'next/link';
import Image from 'next/image';
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

/**
 * Hero token card — prominent display for a top token (BTC, ETH, SOL).
 * Shows price, 24h change, Fear & Greed gauge, AI sentiment, and action buttons.
 */
export default function TokenCard({ token, fearGreed }: TokenCardProps) {
  const isPositive = token.priceChangePct24h >= 0;
  const info = TOKEN_INFO[token.symbol];
  const iconSrc = info?.icon;
  const displayName = info?.name ?? token.name;

  // Extract base symbol (e.g. 'BTC' from 'BTCUSD')
  const underlying = token.underlying ?? token.symbol.replace(/USD$/, '');

  // Delta Exchange trade link uses the full symbol
  const tradeUrl = `https://www.delta.exchange/app/futures/trade/${token.symbol}`;

  return (
    <div className="card-glow group relative flex flex-col gap-4 rounded-xl border border-[#2a2a32] bg-[#1a1a1f] p-5 transition-colors hover:border-[#3a3a42] animate-fade-in-up hover-lift">
      {/* ---- Token header ---- */}
      <div className="flex items-center gap-3">
        <TokenIcon symbol={underlying} iconSrc={iconSrc} />
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-white">{underlying}</span>
          <span className="text-xs text-[#9ca3af]">{displayName}</span>
        </div>
      </div>

      {/* ---- Price + 24h change ---- */}
      <div className="flex items-end justify-between">
        <span className="font-mono text-2xl font-bold text-white">
          {formatPrice(token.price)}
        </span>
        <span
          className={`inline-flex items-center rounded-md px-2 py-0.5 font-mono text-xs font-semibold ${
            isPositive
              ? 'bg-[#00c076]/15 text-[#00c076]'
              : 'bg-[#ff4d4f]/15 text-[#ff4d4f]'
          }`}
        >
          {formatPercent(token.priceChangePct24h)}
        </span>
      </div>

      {/* ---- 24h stats row ---- */}
      <div className="grid grid-cols-3 gap-2 text-[11px] text-[#9ca3af]">
        <div className="flex flex-col">
          <span className="text-[#6b7280]">24h Vol</span>
          <span className="font-mono text-white">{formatCompact(token.volume24h)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[#6b7280]">High</span>
          <span className="font-mono text-white">{formatPrice(token.high24h)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[#6b7280]">Low</span>
          <span className="font-mono text-white">{formatPrice(token.low24h)}</span>
        </div>
      </div>

      {/* ---- Divider ---- */}
      <div className="h-px bg-[#2a2a32]" />

      {/* ---- Fear & Greed + Sentiment row ---- */}
      <div className="flex items-center justify-between">
        {fearGreed ? (
          <FearGreedGauge
            value={fearGreed.value}
            classification={fearGreed.classification}
          />
        ) : (
          <div className="flex h-12 w-20 items-center justify-center">
            <Skeleton className="h-10 w-16 rounded-md" />
          </div>
        )}

        <div className="flex flex-col items-end gap-1">
          <span className="text-[10px] text-[#6b7280]">AI Sentiment</span>
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
          className="flex h-9 flex-1 items-center justify-center rounded-lg border border-[#2a2a32] text-sm font-medium text-white transition-colors hover:bg-[#222228]"
        >
          More Info
        </Link>
        <a
          href={tradeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-9 flex-1 items-center justify-center rounded-lg bg-[#fd7d02] text-sm font-medium text-white transition-colors hover:bg-[#e06d00]"
        >
          Trade Now
        </a>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Token Icon — shows SVG icon with letter fallback
// ---------------------------------------------------------------------------

function TokenIcon({ symbol, iconSrc }: { symbol: string; iconSrc?: string }) {
  const letter = symbol.charAt(0).toUpperCase();

  if (iconSrc) {
    return (
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#222228] to-[#2a2a32] ring-1 ring-[#fd7d02]/20">
        <Image
          src={iconSrc}
          alt={symbol}
          width={24}
          height={24}
          className="h-6 w-6"
          onError={(e) => {
            // Hide broken image, fallback letter will show via parent bg
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        {/* Fallback letter behind the image */}
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-[#9ca3af]">
          {letter}
        </span>
      </div>
    );
  }

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#222228] to-[#2a2a32] ring-1 ring-[#fd7d02]/20">
      <span className="text-sm font-bold text-[#9ca3af]">{letter}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton loading state
// ---------------------------------------------------------------------------

export function TokenCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-[#2a2a32] bg-[#1a1a1f] p-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex flex-col gap-1">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>

      {/* Price */}
      <div className="flex items-end justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-5 w-16 rounded-md" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>

      <div className="h-px bg-[#2a2a32]" />

      {/* Gauge + sentiment */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-12 w-20" />
        <Skeleton className="h-6 w-24" />
      </div>

      {/* Buttons */}
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-9 flex-1 rounded-lg" />
        <Skeleton className="h-9 flex-1 rounded-lg" />
      </div>
    </div>
  );
}
