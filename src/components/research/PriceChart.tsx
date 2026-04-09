'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { DeltaCandle } from '@/types/delta';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

// lightweight-charts types (loaded dynamically)
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

  // Initialize chart (runs once)
  const initChart = useCallback(async () => {
    if (!containerRef.current) return;

    const lc = await import('lightweight-charts');

    // Dispose previous chart if any
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = lc.createChart(containerRef.current, {
      layout: {
        background: { color: '#101013' },
        textColor: '#9ca3af',
        fontFamily:
          'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: '#2a2a32' },
        horzLines: { color: '#2a2a32' },
      },
      crosshair: {
        mode: lc.CrosshairMode.Normal,
        vertLine: {
          color: '#fd7d02',
          width: 1,
          style: lc.LineStyle.Dashed,
          labelBackgroundColor: '#fd7d02',
        },
        horzLine: {
          color: '#fd7d02',
          width: 1,
          style: lc.LineStyle.Dashed,
          labelBackgroundColor: '#fd7d02',
        },
      },
      timeScale: {
        borderColor: '#2a2a32',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: '#2a2a32',
      },
      autoSize: true,
    });

    // Candlestick series
    const candleSeries = chart.addSeries(lc.CandlestickSeries, {
      upColor: '#00c076',
      downColor: '#ff4d4f',
      borderUpColor: '#00c076',
      borderDownColor: '#ff4d4f',
      wickUpColor: '#00c076',
      wickDownColor: '#ff4d4f',
    });

    // Volume histogram series
    const volumeSeries = chart.addSeries(lc.HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });

    chart.priceScale('volume').applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;
    setChartReady(true);
  }, []);

  // Initialize chart on mount
  useEffect(() => {
    initChart();

    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [initChart]);

  // Update data when candles change
  useEffect(() => {
    if (!chartReady || !candleSeriesRef.current || !volumeSeriesRef.current) return;
    if (candles.length === 0) return;

    // Sort candles by time ascending
    const sorted = [...candles].sort((a, b) => a.time - b.time);

    // Transform for lightweight-charts
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
      color: c.close >= c.open ? 'rgba(0, 192, 118, 0.3)' : 'rgba(255, 77, 79, 0.3)',
    }));

    candleSeriesRef.current.setData(candleData);
    volumeSeriesRef.current.setData(volumeData);

    // Fit content
    chartRef.current?.timeScale().fitContent();
  }, [candles, chartReady]);

  function handleRangeChange(range: string) {
    setActiveRange(range);
    onTimeRangeChange?.(range);
  }

  // Empty state
  if (!symbol && candles.length === 0) {
    return (
      <div className="bg-[#1a1a1f] border border-[#2a2a32] rounded-lg flex items-center justify-center h-[400px]">
        <p className="text-sm text-[#6b7280]">
          Select a token to view chart
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1f] border border-[#2a2a32] rounded-lg overflow-hidden">
      {/* Time range selector */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#2a2a32]">
        <span className="text-xs text-[#6b7280] uppercase tracking-wider">
          {symbol} Chart
        </span>
        <div className="flex gap-1">
          {TIME_RANGES.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => handleRangeChange(value)}
              className={cn(
                'px-3 py-1 text-xs rounded-md transition-colors cursor-pointer',
                activeRange === value
                  ? 'bg-[#fd7d02] text-white'
                  : 'text-[#9ca3af] hover:text-white hover:bg-[#2a2a32]',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart container */}
      <div className="relative h-[400px]">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#101013]/80">
            <div className="flex flex-col items-center gap-2">
              <Skeleton className="h-4 w-32 bg-[#2a2a32]" />
              <Skeleton className="h-3 w-24 bg-[#2a2a32]" />
            </div>
          </div>
        )}
        <div ref={containerRef} className="h-full w-full" />
      </div>
    </div>
  );
}
