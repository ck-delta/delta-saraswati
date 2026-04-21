'use client';

// Premium token card.
// Layout: [logo + symbol + name] LEFT | [price + %change + sparkline] RIGHT
//          "AI SIGNAL" label → big tier pill (w/ score delta)
//          3 sub-score rows with icons
//          Trade Now button (card itself is clickable → /research)

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import AISignalBreakdown from '@/components/shared/AISignalBreakdown';
import TokenLogo, { getBrand } from '@/components/shared/TokenLogo';
import Sparkline from '@/components/shared/Sparkline';
import { TOKEN_INFO } from '@/lib/constants';
import { formatPrice, formatPercent } from '@/lib/format';
import type { TokenCardData, FearGreedData } from '@/types/market';
import type { AISignalResult } from '@/lib/signals/composite';

interface TokenCardProps {
  token: TokenCardData;
  fearGreed?: FearGreedData | null;
}

interface AISignalPayload {
  composite: AISignalResult;
}

export default function TokenCard({ token }: TokenCardProps) {
  const isPositive = token.priceChangePct24h >= 0;
  const info = TOKEN_INFO[token.symbol];
  const displayName = info?.name ?? token.name;
  const underlying = token.underlying ?? token.symbol.replace(/USDT?$/, '');
  const tradeUrl = `https://www.delta.exchange/app/futures/trade/${token.symbol}`;
  const brand = getBrand(underlying);

  const [signal, setSignal] = useState<AISignalResult | null>(null);
  const [signalError, setSignalError] = useState<string | null>(null);
  const prevScoreRef = useRef<number | null>(null);
  const [prevScore, setPrevScore] = useState<number | null>(null);

  // Fetch AI Signal on mount and every 60s.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`/api/ai-signal/${token.symbol}`);
        if (!res.ok) throw new Error(`AI signal ${res.status}`);
        const json: AISignalPayload = await res.json();
        if (!cancelled) {
          // Track delta from last fetch
          if (prevScoreRef.current != null) {
            setPrevScore(prevScoreRef.current);
          }
          prevScoreRef.current = json.composite.score;
          setSignal(json.composite);
          setSignalError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setSignalError(err instanceof Error ? err.message : 'Signal unavailable');
        }
      }
    }

    load();
    const id = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [token.symbol]);

  return (
    <div
      className="group relative overflow-hidden rounded-2xl transition-all duration-300 will-change-transform"
      style={{
        background: 'linear-gradient(180deg, #121317 0%, #0E0F12 100%)',
        border: '1px solid rgba(255,255,255,0.04)',
        boxShadow: `0 1px 0 rgba(255,255,255,0.02) inset, 0 24px 48px -24px rgba(0,0,0,0.5)`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = `${brand.color}33`;
        e.currentTarget.style.boxShadow = `0 1px 0 rgba(255,255,255,0.03) inset, 0 24px 60px -18px ${brand.glow}, 0 0 0 1px ${brand.color}10`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.04)';
        e.currentTarget.style.boxShadow = `0 1px 0 rgba(255,255,255,0.02) inset, 0 24px 48px -24px rgba(0,0,0,0.5)`;
      }}
    >
      {/* ---- Brand-colored top accent line ---- */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] transition-opacity"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${brand.color} 50%, transparent 100%)`,
          opacity: 0.6,
          boxShadow: `0 0 12px ${brand.glow}`,
        }}
      />

      {/* ---- Corner halo (brand-tinted ambient glow) ---- */}
      <div
        className="absolute top-0 right-0 w-40 h-40 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 100% 0%, ${brand.glow} 0%, transparent 65%)`,
        }}
      />

      {/* Whole-card click: takes to /research. Wrapped via a transparent Link */}
      <Link
        href={`/research?token=${token.symbol}`}
        className="absolute inset-0 z-10"
        aria-label={`Open ${underlying} research page`}
      />

      <div className="relative z-20 flex flex-col gap-5 p-5">
        {/* ---- Header: logo+symbol LEFT | price+% RIGHT ---- */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <TokenLogo underlying={underlying} size={40} />
            <div className="flex flex-col min-w-0">
              <span className="text-base font-bold text-[#eaedf3] leading-tight">
                {underlying}
              </span>
              <span className="text-[11px] text-[#8b8f99] truncate">{displayName}</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 flex-shrink-0 relative">
            {/* Sparkline behind price */}
            <div className="absolute right-0 top-0 w-[120px] h-[40px]" aria-hidden>
              <Sparkline symbol={token.symbol} width={120} height={40} color={brand.color} />
            </div>
            <span className="relative font-mono-num text-[22px] font-black text-[#eaedf3] leading-none tracking-tight">
              {formatPrice(token.price)}
            </span>
            <span
              className={`relative font-mono-num text-[11px] font-bold ${
                isPositive ? 'text-[#4ADE80]' : 'text-[#F87171]'
              }`}
            >
              {formatPercent(token.priceChangePct24h)}
            </span>
          </div>
        </div>

        {/* ---- Divider ---- */}
        <div className="h-px" style={{ background: 'rgba(255,255,255,0.04)' }} />

        {/* ---- AI Signal block ---- */}
        {signal ? (
          <AISignalBreakdown signal={signal} compact prevScore={prevScore} />
        ) : signalError ? (
          <div className="py-4 text-center text-xs text-[#8b8f99]">
            AI Signal temporarily unavailable
          </div>
        ) : (
          <div className="flex flex-col gap-3 py-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
          </div>
        )}

        {/* ---- Trade button (opens Delta Exchange) ---- */}
        <a
          href={tradeUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="relative z-30 flex h-10 items-center justify-center gap-1.5 rounded-xl text-sm font-bold transition-all"
          style={{
            background: `linear-gradient(135deg, ${brand.color} 0%, ${brand.color}CC 100%)`,
            color: '#000',
            boxShadow: `0 6px 18px -6px ${brand.glow}, inset 0 1px 0 rgba(255,255,255,0.25)`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.01)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <span>Trade Now</span>
          <span aria-hidden className="text-xs">↗</span>
        </a>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

export function TokenCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/[0.04] p-5"
      style={{ background: 'linear-gradient(180deg, #121317 0%, #0E0F12 100%)' }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-11 w-11 rounded-xl" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-3 w-14" />
        </div>
      </div>
      <div className="h-px bg-white/[0.04] my-5" />
      <Skeleton className="h-3 w-16 mb-3" />
      <Skeleton className="h-14 w-full rounded-xl" />
      <div className="space-y-2 mt-4">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
      </div>
      <Skeleton className="h-10 w-full rounded-xl mt-5" />
    </div>
  );
}
