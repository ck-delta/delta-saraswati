'use client';

import { useResearchStore } from '@/stores/research-store';
import { TOKEN_INFO } from '@/lib/constants';
import { formatPrice, formatPercent, formatCompact } from '@/lib/format';
import { cn } from '@/lib/utils';
import { MetricCard } from './MetricCard';
import {
  DollarSign,
  BarChart3,
  Activity,
  Target,
  Layers,
  TrendingUp,
  ExternalLink,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  RSI Gauge                                                         */
/* ------------------------------------------------------------------ */

function RSIGauge({ value }: { value: number }) {
  const isOversold = value < 30;
  const isOverbought = value > 70;
  const color = isOversold
    ? '#22c55e'
    : isOverbought
      ? '#ef4444'
      : '#f7931a';
  const label = isOversold
    ? 'Oversold'
    : isOverbought
      ? 'Overbought'
      : 'Neutral';

  const fillPercent = Math.min(Math.max(value, 0), 100);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#555a65]">RSI(14)</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono font-semibold text-[#eaedf3]">
            {value.toFixed(1)}
          </span>
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded"
            style={{
              color,
              backgroundColor: `${color}20`,
            }}
          >
            {label}
          </span>
        </div>
      </div>
      <div className="relative h-1.5 w-full rounded-full bg-[#1e2024] overflow-hidden">
        <div className="absolute left-[30%] top-0 bottom-0 w-px bg-[#555a65]/30" />
        <div className="absolute left-[70%] top-0 bottom-0 w-px bg-[#555a65]/30" />
        <div
          className="absolute left-0 top-0 bottom-0 rounded-full transition-all duration-500"
          style={{
            width: `${fillPercent}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-[#555a65]">
        <span>0</span>
        <span>30</span>
        <span>70</span>
        <span>100</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MACD Indicator                                                    */
/* ------------------------------------------------------------------ */

function MACDIndicator({
  macd,
  signal,
  histogram,
}: {
  macd: number;
  signal: number;
  histogram: number;
}) {
  const isBullish = histogram > 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#555a65]">MACD</span>
        <span
          className={cn(
            'text-[10px] font-medium px-1.5 py-0.5 rounded',
            isBullish
              ? 'text-[#22c55e] bg-[#22c55e]/10'
              : 'text-[#ef4444] bg-[#ef4444]/10',
          )}
        >
          {isBullish ? 'Bullish' : 'Bearish'}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col">
          <span className="text-[10px] text-[#555a65]">MACD</span>
          <span className="text-xs font-mono text-[#eaedf3]">{macd.toFixed(2)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-[#555a65]">Signal</span>
          <span className="text-xs font-mono text-[#eaedf3]">{signal.toFixed(2)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-[#555a65]">Histogram</span>
          <span
            className={cn(
              'text-xs font-mono',
              histogram >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]',
            )}
          >
            {histogram >= 0 ? '+' : ''}
            {histogram.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Bollinger Bands                                                   */
/* ------------------------------------------------------------------ */

function BollingerBands({
  upper,
  middle,
  lower,
}: {
  upper: number;
  middle: number;
  lower: number;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-[#555a65]">Bollinger Bands (20, 2)</span>
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col">
          <span className="text-[10px] text-[#555a65]">Upper</span>
          <span className="text-xs font-mono text-[#ef4444]">
            {formatPrice(upper)}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-[#555a65]">Middle</span>
          <span className="text-xs font-mono text-[#eaedf3]">
            {formatPrice(middle)}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-[#555a65]">Lower</span>
          <span className="text-xs font-mono text-[#22c55e]">
            {formatPrice(lower)}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Loading Skeletons                                                 */
/* ------------------------------------------------------------------ */

function MetricSkeleton() {
  return (
    <div className="bg-[#111214] border border-[#1e2024] rounded-xl p-4 flex flex-col gap-2">
      <div className="h-3 w-20 rounded bg-[#1e2024] animate-pulse" />
      <div className="h-6 w-28 rounded bg-[#1e2024] animate-pulse" />
      <div className="h-3 w-16 rounded bg-[#1e2024] animate-pulse" />
    </div>
  );
}

function IndicatorSkeleton() {
  return (
    <div className="bg-[#111214] border border-[#1e2024] rounded-xl p-4 flex flex-col gap-3">
      <div className="h-3 w-20 rounded bg-[#1e2024] animate-pulse" />
      <div className="h-4 w-full rounded bg-[#1e2024] animate-pulse" />
      <div className="h-3 w-32 rounded bg-[#1e2024] animate-pulse" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Panel                                                        */
/* ------------------------------------------------------------------ */

export function ResearchPanel() {
  const { selectedToken, ticker, indicators, loading } = useResearchStore();

  if (!selectedToken) {
    return (
      <div className="flex items-center justify-center h-48 text-[#555a65] text-sm">
        Select a token to begin research
      </div>
    );
  }

  if (loading || !ticker) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <MetricSkeleton key={i} />
          ))}
        </div>
        <div className="space-y-3">
          <IndicatorSkeleton />
          <IndicatorSkeleton />
          <IndicatorSkeleton />
        </div>
      </div>
    );
  }

  const tokenInfo = TOKEN_INFO[selectedToken];
  // ticker can be either DeltaTicker (string fields) or TokenCardData (number fields)
  // Handle both formats gracefully
  const t = ticker as unknown as Record<string, unknown>;
  const price = Number(t.price ?? t.close ?? 0);
  const change24h = Number(t.priceChange24h ?? 0) || (price - Number(t.open ?? price));
  const changePct24h = Number(t.priceChangePct24h ?? 0) || (Number(t.open) ? ((price - Number(t.open)) / Number(t.open)) * 100 : 0);
  const fundingRate = Number(t.fundingRate ?? t.funding_rate ?? 0);
  const oiUsd = Number(t.openInterestUsd ?? t.oi_value_usd ?? 0);
  const volume = Number(t.turnoverUsd ?? t.turnover_usd ?? 0);
  const markPrice = Number(t.markPrice ?? t.mark_price ?? 0);
  const spotPrice = Number(t.spotPrice ?? t.spot_price ?? 0);

  return (
    <div className="space-y-5">
      {/* Token header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-[#eaedf3]">
            {tokenInfo?.name ?? selectedToken}
          </h1>
          <span className="text-sm text-[#555a65]">{selectedToken}</span>
        </div>
      </div>

      {/* Metric cards grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <MetricCard
          title="Price"
          value={formatPrice(price)}
          subtitle={formatPercent(changePct24h)}
          trend={change24h >= 0 ? 'up' : 'down'}
          icon={<DollarSign className="h-3.5 w-3.5" />}
        />
        <MetricCard
          title="Funding Rate"
          value={`${fundingRate >= 0 ? '+' : ''}${(fundingRate * 100).toFixed(4)}%`}
          subtitle={fundingRate >= 0 ? 'Longs pay shorts' : 'Shorts pay longs'}
          trend={fundingRate >= 0 ? 'up' : 'down'}
          icon={<Activity className="h-3.5 w-3.5" />}
        />
        <MetricCard
          title="Open Interest"
          value={`$${formatCompact(oiUsd)}`}
          trend="neutral"
          icon={<Layers className="h-3.5 w-3.5" />}
        />
        <MetricCard
          title="24h Volume"
          value={`$${formatCompact(volume)}`}
          trend="neutral"
          icon={<BarChart3 className="h-3.5 w-3.5" />}
        />
        <MetricCard
          title="Mark Price"
          value={formatPrice(markPrice)}
          trend="neutral"
          icon={<Target className="h-3.5 w-3.5" />}
        />
        <MetricCard
          title="Spot Price"
          value={formatPrice(spotPrice)}
          trend="neutral"
          icon={<TrendingUp className="h-3.5 w-3.5" />}
        />
      </div>

      {/* Technical Analysis section */}
      <div className="space-y-4">
        <h2 className="text-xs font-semibold text-[#555a65] uppercase tracking-wider">
          Technical Analysis
        </h2>

        <div className="bg-[#111214] border border-[#1e2024] rounded-xl p-4 space-y-5">
          {indicators.rsi ? (
            <RSIGauge value={indicators.rsi.value} />
          ) : (
            <div className="text-xs text-[#555a65]">RSI: Insufficient data</div>
          )}

          <div className="border-t border-[#1e2024]" />

          {indicators.macd ? (
            <MACDIndicator
              macd={indicators.macd.macd}
              signal={indicators.macd.signal}
              histogram={indicators.macd.histogram}
            />
          ) : (
            <div className="text-xs text-[#555a65]">MACD: Insufficient data</div>
          )}

          <div className="border-t border-[#1e2024]" />

          {indicators.bollinger ? (
            <BollingerBands
              upper={indicators.bollinger.upper}
              middle={indicators.bollinger.middle}
              lower={indicators.bollinger.lower}
            />
          ) : (
            <div className="text-xs text-[#555a65]">
              Bollinger Bands: Insufficient data
            </div>
          )}
        </div>
      </div>

      {/* Trade Now button */}
      <a
        href={`https://www.delta.exchange/app/futures/trade/${selectedToken}`}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg',
          'bg-[#f7931a] hover:bg-[#ffaa3b] text-black font-semibold',
          'transition-colors duration-150',
        )}
      >
        Trade {selectedToken} on Delta Exchange
        <ExternalLink className="h-4 w-4" />
      </a>
    </div>
  );
}
