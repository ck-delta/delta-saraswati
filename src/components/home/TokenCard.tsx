'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import AISignalPill from '@/components/shared/AISignalPill';
import AISignalBreakdown from '@/components/shared/AISignalBreakdown';
import { TOKEN_INFO } from '@/lib/constants';
import { formatPrice, formatPercent } from '@/lib/format';
import type { TokenCardData, FearGreedData } from '@/types/market';
import type { AISignalResult } from '@/lib/signals/composite';

interface TokenCardProps {
  token: TokenCardData;
  // Kept in signature for TokenCardGrid backwards compatibility; not rendered.
  fearGreed?: FearGreedData | null;
}

interface AISignalPayload {
  composite: AISignalResult;
}

const TOKEN_GRADIENTS: Record<string, string> = {
  BTC: 'from-[#f7931a]/20 to-[#f7931a]/5',
  ETH: 'from-[#627eea]/20 to-[#627eea]/5',
  SOL: 'from-[#9945ff]/20 to-[#9945ff]/5',
};

export default function TokenCard({ token }: TokenCardProps) {
  const isPositive = token.priceChangePct24h >= 0;
  const info = TOKEN_INFO[token.symbol];
  const displayName = info?.name ?? token.name;
  const underlying = token.underlying ?? token.symbol.replace(/USDT?$/, '');
  const tradeUrl = `https://www.delta.exchange/app/futures/trade/${token.symbol}`;
  const gradient = TOKEN_GRADIENTS[underlying] ?? 'from-[#8b8f99]/20 to-[#8b8f99]/5';

  const [signal, setSignal] = useState<AISignalResult | null>(null);
  const [signalError, setSignalError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`/api/ai-signal/${token.symbol}`);
        if (!res.ok) throw new Error(`AI signal ${res.status}`);
        const json: AISignalPayload = await res.json();
        if (!cancelled) {
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
    <div className="group flex flex-col gap-4 rounded-xl border border-[#1e2024] bg-[#111214] p-5 transition-all duration-200 hover:border-[#2a2d33]">
      {/* ---- Header: icon + symbol/name + AI Signal pill (top-right) ---- */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
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

        {signal ? (
          <AISignalPill
            tier={signal.label}
            score={signal.score}
            divergent={signal.divergent}
            size="sm"
          />
        ) : (
          <div
            className="h-7 w-28 animate-pulse rounded-full"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          />
        )}
      </div>

      {/* ---- Price + 24h % change ---- */}
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-2xl font-semibold text-[#eaedf3]">
          {formatPrice(token.price)}
        </span>
        <span
          className={`font-mono text-sm font-semibold ${
            isPositive ? 'text-[#22c55e]' : 'text-[#ef4444]'
          }`}
        >
          {formatPercent(token.priceChangePct24h)}
        </span>
      </div>

      <div className="border-t border-[#1e2024]" />

      {/* ---- AI Signal breakdown ---- */}
      {signal ? (
        <AISignalBreakdown signal={signal} compact />
      ) : signalError ? (
        <div className="py-4 text-center text-xs text-[#8b8f99]">
          AI Signal temporarily unavailable
        </div>
      ) : (
        <div className="flex flex-col gap-3 py-1">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
        </div>
      )}

      {/* ---- Action buttons ---- */}
      <div className="flex gap-2 pt-1">
        <Link
          href={`/research?token=${token.symbol}`}
          className="flex h-9 flex-1 items-center justify-center rounded-lg border border-[#1e2024] text-xs font-medium text-[#8b8f99] transition-colors hover:border-[#2a2d33] hover:text-[#eaedf3]"
        >
          More Info
        </Link>
        <a
          href={tradeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-9 flex-1 items-center justify-center rounded-lg bg-[#f7931a] text-xs font-semibold text-black transition-colors hover:bg-[#ffaa3b]"
        >
          Trade Now
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
    <div className="flex flex-col gap-4 rounded-xl border border-[#1e2024] bg-[#111214] p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex flex-col gap-1">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <Skeleton className="h-7 w-28 rounded-full" />
      </div>
      <Skeleton className="h-8 w-40" />
      <div className="border-t border-[#1e2024]" />
      <Skeleton className="h-14 w-full rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
      </div>
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-9 flex-1 rounded-lg" />
        <Skeleton className="h-9 flex-1 rounded-lg" />
      </div>
    </div>
  );
}
