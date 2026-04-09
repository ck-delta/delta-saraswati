'use client';

import { useResearchStore } from '@/stores/research-store';
import { TOKEN_INFO } from '@/lib/constants';
import { formatPrice, formatPercent, formatCompact } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
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

// ---------- RSI Gauge ----------

function RSIGauge({ value }: { value: number }) {
  const isOversold = value < 30;
  const isOverbought = value > 70;
  const color = isOversold
    ? '#00c076'
    : isOverbought
      ? '#ff4d4f'
      : '#fd7d02';
  const label = isOversold
    ? 'Oversold'
    : isOverbought
      ? 'Overbought'
      : 'Neutral';

  // Percentage fill for the bar (0-100 scale)
  const fillPercent = Math.min(Math.max(value, 0), 100);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#6b7280]">RSI(14)</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono font-semibold text-white">
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
      {/* Gauge bar */}
      <div className="relative h-2 w-full rounded-full bg-[#2a2a32] overflow-hidden">
        {/* Zone markers */}
        <div className="absolute left-[30%] top-0 bottom-0 w-px bg-[#6b7280]/30" />
        <div className="absolute left-[70%] top-0 bottom-0 w-px bg-[#6b7280]/30" />
        {/* Fill */}
        <div
          className="absolute left-0 top-0 bottom-0 rounded-full transition-all duration-500"
          style={{
            width: `${fillPercent}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-[#6b7280]">
        <span>0</span>
        <span>30</span>
        <span>70</span>
        <span>100</span>
      </div>
    </div>
  );
}

// ---------- MACD Indicator ----------

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
        <span className="text-xs text-[#6b7280]">MACD</span>
        <span
          className={cn(
            'text-[10px] font-medium px-1.5 py-0.5 rounded',
            isBullish
              ? 'text-[#00c076] bg-[#00c076]/10'
              : 'text-[#ff4d4f] bg-[#ff4d4f]/10',
          )}
        >
          {isBullish ? 'Bullish' : 'Bearish'}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col">
          <span className="text-[10px] text-[#6b7280]">MACD</span>
          <span className="text-xs font-mono text-white">{macd.toFixed(2)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-[#6b7280]">Signal</span>
          <span className="text-xs font-mono text-white">{signal.toFixed(2)}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-[#6b7280]">Histogram</span>
          <span
            className={cn(
              'text-xs font-mono',
              histogram >= 0 ? 'text-[#00c076]' : 'text-[#ff4d4f]',
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

// ---------- Bollinger Bands ----------

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
      <span className="text-xs text-[#6b7280]">Bollinger Bands (20, 2)</span>
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col">
          <span className="text-[10px] text-[#6b7280]">Upper</span>
          <span className="text-xs font-mono text-[#ff4d4f]">
            {formatPrice(upper)}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-[#6b7280]">Middle</span>
          <span className="text-xs font-mono text-white">
            {formatPrice(middle)}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-[#6b7280]">Lower</span>
          <span className="text-xs font-mono text-[#00c076]">
            {formatPrice(lower)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------- Loading Skeletons ----------

function MetricSkeleton() {
  return (
    <div className="bg-[#1a1a1f] border border-[#2a2a32] rounded-lg p-4 flex flex-col gap-2">
      <Skeleton className="h-3 w-20 bg-[#2a2a32]" />
      <Skeleton className="h-6 w-28 bg-[#2a2a32]" />
      <Skeleton className="h-3 w-16 bg-[#2a2a32]" />
    </div>
  );
}

function IndicatorSkeleton() {
  return (
    <div className="bg-[#1a1a1f] border border-[#2a2a32] rounded-lg p-4 flex flex-col gap-3">
      <Skeleton className="h-3 w-20 bg-[#2a2a32]" />
      <Skeleton className="h-4 w-full bg-[#2a2a32]" />
      <Skeleton className="h-3 w-32 bg-[#2a2a32]" />
    </div>
  );
}

// ---------- Main Panel ----------

export function ResearchPanel() {
  const { selectedToken, ticker, indicators, loading } = useResearchStore();

  if (!selectedToken) {
    return (
      <div className="flex items-center justify-center h-48 text-[#6b7280] text-sm">
        Select a token to begin research
      </div>
    );
  }

  if (loading || !ticker) {
    return (
      <div className="space-y-6">
        {/* Metric skeletons */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <MetricSkeleton key={i} />
          ))}
        </div>
        {/* Indicator skeletons */}
        <div className="space-y-3">
          <IndicatorSkeleton />
          <IndicatorSkeleton />
          <IndicatorSkeleton />
        </div>
      </div>
    );
  }

  const tokenInfo = TOKEN_INFO[selectedToken];
  const price = parseFloat(ticker.close);
  const open = parseFloat(ticker.open);
  const change24h = price - open;
  const changePct24h = open !== 0 ? (change24h / open) * 100 : 0;
  const fundingRate = parseFloat(ticker.funding_rate);
  const oiUsd = parseFloat(ticker.oi_value_usd);
  const volume = parseFloat(ticker.turnover_usd);
  const markPrice = parseFloat(ticker.mark_price);
  const spotPrice = parseFloat(ticker.spot_price);

  return (
    <div className="space-y-6">
      {/* Token header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-white">
            {tokenInfo?.name ?? selectedToken}
          </h1>
          <span className="text-sm text-[#6b7280]">{selectedToken}</span>
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
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
          Technical Analysis
        </h2>

        <div className="bg-[#1a1a1f] border border-[#2a2a32] rounded-lg p-4 space-y-5">
          {/* RSI */}
          {indicators.rsi ? (
            <RSIGauge value={indicators.rsi.value} />
          ) : (
            <div className="text-xs text-[#6b7280]">
              RSI: Insufficient data
            </div>
          )}

          <div className="border-t border-[#2a2a32]" />

          {/* MACD */}
          {indicators.macd ? (
            <MACDIndicator
              macd={indicators.macd.macd}
              signal={indicators.macd.signal}
              histogram={indicators.macd.histogram}
            />
          ) : (
            <div className="text-xs text-[#6b7280]">
              MACD: Insufficient data
            </div>
          )}

          <div className="border-t border-[#2a2a32]" />

          {/* Bollinger Bands */}
          {indicators.bollinger ? (
            <BollingerBands
              upper={indicators.bollinger.upper}
              middle={indicators.bollinger.middle}
              lower={indicators.bollinger.lower}
            />
          ) : (
            <div className="text-xs text-[#6b7280]">
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
          'bg-[#fd7d02] hover:bg-[#fd7d02]/90 text-white font-semibold',
          'transition-colors',
        )}
      >
        Trade {selectedToken} on Delta Exchange
        <ExternalLink className="h-4 w-4" />
      </a>
    </div>
  );
}
