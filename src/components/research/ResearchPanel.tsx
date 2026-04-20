'use client';

import { useResearchStore } from '@/stores/research-store';
import { TOKEN_INFO } from '@/lib/constants';
import { formatPrice, formatPercent, formatCompact } from '@/lib/format';
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
    ? 'var(--positive-text)'
    : isOverbought
      ? 'var(--negative-text)'
      : 'var(--brand-text)';
  const bg = isOversold
    ? 'var(--positive-bg-muted)'
    : isOverbought
      ? 'var(--negative-bg-muted)'
      : 'var(--brand-bg-muted)';
  const label = isOversold
    ? 'Oversold'
    : isOverbought
      ? 'Overbought'
      : 'Neutral';

  const fillPercent = Math.min(Math.max(value, 0), 100);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          RSI(14)
        </span>
        <div className="flex items-center gap-2">
          <span
            className="text-sm font-mono-num font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            {value.toFixed(1)}
          </span>
          <span
            className="text-[10px] font-medium"
            style={{
              padding: '2px 6px',
              borderRadius: 'var(--radius-sm)',
              color,
              background: bg,
            }}
          >
            {label}
          </span>
        </div>
      </div>
      <div
        className="relative h-1.5 w-full overflow-hidden"
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-pill)',
        }}
      >
        <div
          className="absolute left-[30%] top-0 bottom-0 w-px"
          style={{ background: 'var(--divider-strong)' }}
        />
        <div
          className="absolute left-[70%] top-0 bottom-0 w-px"
          style={{ background: 'var(--divider-strong)' }}
        />
        <div
          className="absolute left-0 top-0 bottom-0 transition-all duration-500"
          style={{
            width: `${fillPercent}%`,
            background: color,
            borderRadius: 'var(--radius-pill)',
          }}
        />
      </div>
      <div
        className="flex justify-between text-[10px]"
        style={{ color: 'var(--text-tertiary)' }}
      >
        <span>0</span>
        <span>30</span>
        <span>70</span>
        <span>100</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MACD                                                               */
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
        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
          MACD
        </span>
        <span
          className="text-[10px] font-medium"
          style={{
            padding: '2px 6px',
            borderRadius: 'var(--radius-sm)',
            color: isBullish
              ? 'var(--positive-text)'
              : 'var(--negative-text)',
            background: isBullish
              ? 'var(--positive-bg-muted)'
              : 'var(--negative-bg-muted)',
          }}
        >
          {isBullish ? 'Bullish' : 'Bearish'}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col">
          <span
            className="text-[10px]"
            style={{ color: 'var(--text-tertiary)' }}
          >
            MACD
          </span>
          <span
            className="text-xs font-mono-num"
            style={{ color: 'var(--text-primary)' }}
          >
            {macd.toFixed(2)}
          </span>
        </div>
        <div className="flex flex-col">
          <span
            className="text-[10px]"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Signal
          </span>
          <span
            className="text-xs font-mono-num"
            style={{ color: 'var(--text-primary)' }}
          >
            {signal.toFixed(2)}
          </span>
        </div>
        <div className="flex flex-col">
          <span
            className="text-[10px]"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Histogram
          </span>
          <span
            className="text-xs font-mono-num"
            style={{
              color:
                histogram >= 0
                  ? 'var(--positive-text)'
                  : 'var(--negative-text)',
            }}
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
/*  Bollinger                                                         */
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
      <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
        Bollinger Bands (20, 2)
      </span>
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col">
          <span
            className="text-[10px]"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Upper
          </span>
          <span
            className="text-xs font-mono-num"
            style={{ color: 'var(--negative-text)' }}
          >
            {formatPrice(upper)}
          </span>
        </div>
        <div className="flex flex-col">
          <span
            className="text-[10px]"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Middle
          </span>
          <span
            className="text-xs font-mono-num"
            style={{ color: 'var(--text-primary)' }}
          >
            {formatPrice(middle)}
          </span>
        </div>
        <div className="flex flex-col">
          <span
            className="text-[10px]"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Lower
          </span>
          <span
            className="text-xs font-mono-num"
            style={{ color: 'var(--positive-text)' }}
          >
            {formatPrice(lower)}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Skeletons                                                         */
/* ------------------------------------------------------------------ */

function MetricSkeleton() {
  return (
    <div
      className="flex flex-col gap-2 p-4"
      style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--bg-secondary)',
        borderRadius: 'var(--radius-2xl)',
      }}
    >
      <div
        className="h-3 w-20 rounded animate-pulse"
        style={{ background: 'var(--bg-secondary)' }}
      />
      <div
        className="h-6 w-28 rounded animate-pulse"
        style={{ background: 'var(--bg-secondary)' }}
      />
      <div
        className="h-3 w-16 rounded animate-pulse"
        style={{ background: 'var(--bg-secondary)' }}
      />
    </div>
  );
}

function IndicatorSkeleton() {
  return (
    <div
      className="flex flex-col gap-3 p-4"
      style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--bg-secondary)',
        borderRadius: 'var(--radius-2xl)',
      }}
    >
      <div
        className="h-3 w-20 rounded animate-pulse"
        style={{ background: 'var(--bg-secondary)' }}
      />
      <div
        className="h-4 w-full rounded animate-pulse"
        style={{ background: 'var(--bg-secondary)' }}
      />
      <div
        className="h-3 w-32 rounded animate-pulse"
        style={{ background: 'var(--bg-secondary)' }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Panel                                                             */
/* ------------------------------------------------------------------ */

export function ResearchPanel() {
  const { selectedToken, ticker, indicators, loading } = useResearchStore();

  if (!selectedToken) {
    return (
      <div
        className="flex items-center justify-center h-48 text-sm"
        style={{ color: 'var(--text-tertiary)' }}
      >
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
  const t = ticker as unknown as Record<string, unknown>;
  const price = Number(t.price ?? t.close ?? 0);
  const change24h =
    Number(t.priceChange24h ?? 0) || price - Number(t.open ?? price);
  const changePct24h =
    Number(t.priceChangePct24h ?? 0) ||
    (Number(t.open)
      ? ((price - Number(t.open)) / Number(t.open)) * 100
      : 0);
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
          <h1
            className="text-xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            {tokenInfo?.name ?? selectedToken}
          </h1>
          <span
            className="text-sm"
            style={{ color: 'var(--text-tertiary)' }}
          >
            {selectedToken}
          </span>
        </div>
      </div>

      {/* Metrics */}
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
          subtitle={
            fundingRate >= 0 ? 'Longs pay shorts' : 'Shorts pay longs'
          }
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

      {/* Technical Analysis */}
      <div className="space-y-4">
        <h2
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--text-secondary)' }}
        >
          Technical Analysis
        </h2>

        <div
          className="p-4 space-y-5"
          style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--bg-secondary)',
            borderRadius: 'var(--radius-2xl)',
          }}
        >
          {indicators.rsi ? (
            <RSIGauge value={indicators.rsi.value} />
          ) : (
            <div
              className="text-xs"
              style={{ color: 'var(--text-tertiary)' }}
            >
              RSI: Insufficient data
            </div>
          )}

          <div style={{ borderTop: '1px solid var(--divider-primary)' }} />

          {indicators.macd ? (
            <MACDIndicator
              macd={indicators.macd.macd}
              signal={indicators.macd.signal}
              histogram={indicators.macd.histogram}
            />
          ) : (
            <div
              className="text-xs"
              style={{ color: 'var(--text-tertiary)' }}
            >
              MACD: Insufficient data
            </div>
          )}

          <div style={{ borderTop: '1px solid var(--divider-primary)' }} />

          {indicators.bollinger ? (
            <BollingerBands
              upper={indicators.bollinger.upper}
              middle={indicators.bollinger.middle}
              lower={indicators.bollinger.lower}
            />
          ) : (
            <div
              className="text-xs"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Bollinger Bands: Insufficient data
            </div>
          )}
        </div>
      </div>

      {/* Trade button */}
      <a
        href={`https://www.delta.exchange/app/futures/trade/${selectedToken}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-3 px-4 font-semibold transition-colors duration-150"
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
        Trade {selectedToken} on Delta Exchange
        <ExternalLink className="h-4 w-4" />
      </a>
    </div>
  );
}
