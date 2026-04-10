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

    const chart = lc.createChart(containerRef.current, {
      layout: {
        background: { color: '#08090a' },
        textColor: '#8b8f99',
        fontFamily:
          'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: '#1e2024' },
        horzLines: { color: '#1e2024' },
      },
      crosshair: {
        mode: lc.CrosshairMode.Normal,
        vertLine: {
          color: '#f7931a',
          width: 1,
          style: lc.LineStyle.Dashed,
          labelBackgroundColor: '#f7931a',
        },
        horzLine: {
          color: '#f7931a',
          width: 1,
          style: lc.LineStyle.Dashed,
          labelBackgroundColor: '#f7931a',
        },
      },
      timeScale: {
        borderColor: '#1e2024',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: '#1e2024',
      },
      autoSize: true,
    });

    const candleSeries = chart.addSeries(lc.CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

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
    if (!chartReady || !candleSeriesRef.current || !volumeSeriesRef.current) return;
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
      color: c.close >= c.open ? 'rgba(34, 197, 94, 0.25)' : 'rgba(239, 68, 68, 0.25)',
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
      <div className="bg-[#111214] border border-[#1e2024] rounded-xl flex items-center justify-center h-[400px]">
        <p className="text-sm text-[#555a65]">Select a token to view chart</p>
      </div>
    );
  }

  return (
    <div className="bg-[#111214] border border-[#1e2024] rounded-xl overflow-hidden">
      {/* Time range selector */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1e2024]">
        <span className="text-xs text-[#555a65] uppercase tracking-wider">
          {symbol} Chart
        </span>
        <div className="flex gap-1">
          {TIME_RANGES.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => handleRangeChange(value)}
              className={cn(
                'px-3 py-1 text-xs rounded-full transition-colors duration-150 cursor-pointer',
                activeRange === value
                  ? 'bg-[#f7931a] text-black font-medium'
                  : 'text-[#8b8f99] hover:text-[#eaedf3] hover:bg-[#181a1d]',
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
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#08090a]/80">
            <div className="flex flex-col items-center gap-2">
              <div className="h-4 w-32 rounded bg-[#1e2024] animate-pulse" />
              <div className="h-3 w-24 rounded bg-[#1e2024] animate-pulse" />
            </div>
          </div>
        )}
        <div ref={containerRef} className="h-full w-full" />
      </div>
    </div>
  );
}
