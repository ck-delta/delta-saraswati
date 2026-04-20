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

/**
 * Delta-styled token card.
 * Hover lifts and brightens the border. All tokens/semantic variables.
 */
export default function TokenCard({ token, fearGreed }: TokenCardProps) {
  const isPositive = token.priceChangePct24h >= 0;
  const info = TOKEN_INFO[token.symbol];
  const displayName = info?.name ?? token.name;
  const underlying = token.underlying ?? token.symbol.replace(/USDT?$/, '');
  const tradeUrl = `https://www.delta.exchange/app/futures/trade/${token.symbol}`;

  return (
    <div
      className="group flex flex-col gap-4 p-5 transition-all duration-200"
      style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--bg-secondary)',
        borderRadius: 'var(--radius-2xl)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = 'var(--bg-tertiary)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'var(--bg-secondary)';
      }}
    >
      {/* ---- Header: icon + symbol + name + change badge ---- */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center"
            style={{
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-pill)',
            }}
          >
            <span
              className="text-sm font-bold"
              style={{ color: 'var(--text-primary)' }}
            >
              {underlying.charAt(0)}
            </span>
          </div>
          <div className="flex flex-col">
            <span
              className="text-lg font-bold"
              style={{ color: 'var(--text-primary)' }}
            >
              {underlying}
            </span>
            <span
              className="text-xs"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {displayName}
            </span>
          </div>
        </div>

        {/* Change badge */}
        <span
          className="inline-flex items-center font-mono-num text-xs font-semibold"
          style={{
            padding: '2px 8px',
            borderRadius: 'var(--radius-md)',
            background: isPositive
              ? 'var(--positive-bg-muted)'
              : 'var(--negative-bg-muted)',
            color: isPositive
              ? 'var(--positive-text)'
              : 'var(--negative-text)',
          }}
        >
          {formatPercent(token.priceChangePct24h)}
        </span>
      </div>

      {/* ---- Price ---- */}
      <div>
        <span
          className="font-mono-num text-3xl font-bold"
          style={{
            color: isPositive
              ? 'var(--text-primary)'
              : 'var(--text-primary)',
          }}
        >
          {formatPrice(token.price)}
        </span>
      </div>

      {/* ---- Stats ---- */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="flex flex-col gap-0.5">
          <span style={{ color: 'var(--text-tertiary)' }}>Volume</span>
          <span
            className="font-mono-num"
            style={{ color: 'var(--text-primary)' }}
          >
            {formatCompact(token.volume24h)}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span style={{ color: 'var(--text-tertiary)' }}>High</span>
          <span
            className="font-mono-num"
            style={{ color: 'var(--text-primary)' }}
          >
            {formatPrice(token.high24h)}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span style={{ color: 'var(--text-tertiary)' }}>Low</span>
          <span
            className="font-mono-num"
            style={{ color: 'var(--text-primary)' }}
          >
            {formatPrice(token.low24h)}
          </span>
        </div>
      </div>

      {/* ---- Separator ---- */}
      <div
        className="h-px"
        style={{ background: 'var(--divider-primary)' }}
      />

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
          <span
            className="text-[10px]"
            style={{ color: 'var(--text-tertiary)' }}
          >
            AI Sentiment
          </span>
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
          className="flex h-8 flex-1 items-center justify-center text-xs font-medium transition-colors duration-150"
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
          Research
        </Link>
        <a
          href={tradeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-8 flex-1 items-center justify-center text-xs font-medium transition-colors duration-150"
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
          Trade
        </a>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton loading state
// ---------------------------------------------------------------------------

export function TokenCardSkeleton() {
  return (
    <div
      className="flex flex-col gap-4 p-5"
      style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--bg-secondary)',
        borderRadius: 'var(--radius-2xl)',
      }}
    >
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
      <Skeleton className="h-8 w-32" />
      <div className="grid grid-cols-3 gap-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
      <div
        className="h-px"
        style={{ background: 'var(--divider-primary)' }}
      />
      <div className="flex items-center justify-between">
        <Skeleton className="h-12 w-16" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-8 flex-1 rounded-md" />
        <Skeleton className="h-8 flex-1 rounded-md" />
      </div>
    </div>
  );
}
