'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { DeltaCandle } from '@/types/delta';
import { cn } from '@/lib/utils';

type IChartApi = import('lightweight-charts').IChartApi;
type ISeriesApi<T extends import('lightweight-charts').SeriesType> =
  import('lightweight-charts').ISeriesApi<T>;

interface PriceChartProps {
  candles: DeltaCandle[];
  symbol: string;
  loading?: boolean;
  onTimeRangeChange?: (range: string) => void;
}

const TIME_RANGES = [
  { label: '7D', value: '7d' },
  { label: '1M', value: '1m' },
  { label: '3M', value: '3m' },
] as const;

// ── Delta primitive hex (for lightweight-charts which needs literal strings) ──
const GREEN_500 = '#00A876';
const RED_500 = '#EB5454';
const ORANGE_500 = '#FE6C02';

// Resolves a CSS var against the given element to a literal string.
function readCssVar(el: HTMLElement, name: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  return (
    getComputedStyle(el).getPropertyValue(name).trim() || fallback
  );
}

export function PriceChart({
  candles,
  symbol,
  loading,
  onTimeRangeChange,
}: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const [activeRange, setActiveRange] = useState<string>('1m');
  const [chartReady, setChartReady] = useState(false);

  const initChart = useCallback(async () => {
    if (!containerRef.current) return;

    const lc = await import('lightweight-charts');

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const el = containerRef.current;
    const bgSurface = readCssVar(el, '--bg-surface', '#18191E');
    const bgTertiary = readCssVar(el, '--bg-tertiary', '#353845');
    const textTertiary = readCssVar(el, '--text-tertiary', '#71747A');

    const chart = lc.createChart(el, {
      layout: {
        background: { color: bgSurface },
        textColor: textTertiary,
        fontFamily:
          'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: bgTertiary },
        horzLines: { color: bgTertiary },
      },
      crosshair: {
        mode: lc.CrosshairMode.Normal,
        vertLine: {
          color: ORANGE_500,
          width: 1,
          style: lc.LineStyle.Dashed,
          labelBackgroundColor: ORANGE_500,
        },
        horzLine: {
          color: ORANGE_500,
          width: 1,
          style: lc.LineStyle.Dashed,
          labelBackgroundColor: ORANGE_500,
        },
      },
      timeScale: {
        borderColor: bgTertiary,
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: bgTertiary,
      },
      autoSize: true,
    });

    const candleSeries = chart.addSeries(lc.CandlestickSeries, {
      upColor: GREEN_500,
      downColor: RED_500,
      borderUpColor: GREEN_500,
      borderDownColor: RED_500,
      wickUpColor: GREEN_500,
      wickDownColor: RED_500,
    });

    const volumeSeries = chart.addSeries(lc.HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });

    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;
    setChartReady(true);
  }, []);

  useEffect(() => {
    initChart();
    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [initChart]);

  useEffect(() => {
    if (!chartReady || !candleSeriesRef.current || !volumeSeriesRef.current)
      return;
    if (candles.length === 0) return;

    const sorted = [...candles].sort((a, b) => a.time - b.time);

    const candleData = sorted.map((c) => ({
      time: c.time as import('lightweight-charts').UTCTimestamp,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    const volumeData = sorted.map((c) => ({
      time: c.time as import('lightweight-charts').UTCTimestamp,
      value: c.volume,
      color:
        c.close >= c.open
          ? 'rgba(0, 168, 118, 0.25)'
          : 'rgba(235, 84, 84, 0.25)',
    }));

    candleSeriesRef.current.setData(candleData);
    volumeSeriesRef.current.setData(volumeData);
    chartRef.current?.timeScale().fitContent();
  }, [candles, chartReady]);

  function handleRangeChange(range: string) {
    setActiveRange(range);
    onTimeRangeChange?.(range);
  }

  if (!symbol && candles.length === 0) {
    return (
      <div
        className="flex items-center justify-center h-[400px]"
        style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--bg-secondary)',
          borderRadius: 'var(--radius-2xl)',
        }}
      >
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          Select a token to view chart
        </p>
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden"
      style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--bg-secondary)',
        borderRadius: 'var(--radius-2xl)',
      }}
    >
      {/* Time range selector */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ borderBottom: '1px solid var(--divider-primary)' }}
      >
        <span
          className="text-xs uppercase tracking-wider"
          style={{ color: 'var(--text-tertiary)' }}
        >
          {symbol} Chart
        </span>
        <div className="flex gap-1">
          {TIME_RANGES.map(({ label, value }) => {
            const active = activeRange === value;
            return (
              <button
                key={value}
                onClick={() => handleRangeChange(value)}
                className={cn(
                  'px-3 py-1 text-xs transition-colors duration-150 cursor-pointer',
                )}
                style={{
                  borderRadius: 'var(--radius-pill)',
                  background: active ? 'var(--brand-bg)' : 'transparent',
                  color: active
                    ? 'var(--text-on-bg)'
                    : 'var(--text-secondary)',
                  fontWeight: active ? 500 : 400,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart container */}
      <div className="relative h-[400px]">
        {loading && (
          <div
            className="absolute inset-0 z-10 flex items-center justify-center"
            style={{ background: 'rgba(12,12,15,0.6)' }}
          >
            <div className="flex flex-col items-center gap-2">
              <div
                className="h-4 w-32 rounded animate-pulse"
                style={{ background: 'var(--bg-secondary)' }}
              />
              <div
                className="h-3 w-24 rounded animate-pulse"
                style={{ background: 'var(--bg-secondary)' }}
              />
            </div>
          </div>
        )}
        <div ref={containerRef} className="h-full w-full" />
      </div>
    </div>
  );
}
