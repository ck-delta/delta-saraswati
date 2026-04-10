"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

interface PriceChartProps {
  symbol: string;
  resolution: string;
  onResolutionChange: (res: string) => void;
}

const RESOLUTIONS = ["1h", "4h", "1d", "1w"];

export default function PriceChart({ symbol, resolution, onResolutionChange }: PriceChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCandles = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch(`/api/delta/candles?symbol=${symbol}&resolution=${resolution}`);
      const json = await res.json();
      if (json.success && json.data) {
        return json.data
          .map((c: any) => ({
            time: c.time,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
          }))
          .sort((a: any, b: any) => a.time - b.time); // defensive: ensure ascending
      }
      console.error("[PriceChart] API error:", json.error);
      setError("Failed to load chart data");
    } catch (err) {
      console.error("[PriceChart] Fetch failed:", err);
      setError("Failed to load chart data");
    }
    return [];
  }, [symbol, resolution]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!chartContainerRef.current) return;
      setLoading(true);

      const { createChart } = await import("lightweight-charts");

      // Dispose previous chart
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
      }

      if (cancelled) return;

      // Ensure container has width (may be 0 during animation)
      const containerWidth = chartContainerRef.current.clientWidth || chartContainerRef.current.offsetWidth || 800;

      const chart = createChart(chartContainerRef.current, {
        width: containerWidth,
        height: 400,
        autoSize: true,
        layout: {
          background: { color: "#12141c" },
          textColor: "rgba(255,255,255,0.35)",
          fontFamily: "'Inter', system-ui, sans-serif",
        },
        grid: {
          vertLines: { color: "rgba(255,255,255,0.04)" },
          horzLines: { color: "rgba(255,255,255,0.04)" },
        },
        crosshair: {
          vertLine: { color: "rgba(245,158,11,0.3)", width: 1, style: 2 },
          horzLine: { color: "rgba(245,158,11,0.3)", width: 1, style: 2 },
        },
        rightPriceScale: {
          borderColor: "rgba(255,255,255,0.08)",
        },
        timeScale: {
          borderColor: "rgba(255,255,255,0.08)",
          timeVisible: true,
          secondsVisible: false,
        },
      });

      const { CandlestickSeries } = await import("lightweight-charts");

      const series = chart.addSeries(CandlestickSeries, {
        upColor: "#0ECB81",
        downColor: "#F6465D",
        borderUpColor: "#0ECB81",
        borderDownColor: "#F6465D",
        wickUpColor: "#0ECB81",
        wickDownColor: "#F6465D",
      });

      chartRef.current = chart;
      seriesRef.current = series;

      const candles = await fetchCandles();
      if (cancelled) return;

      if (candles.length > 0) {
        series.setData(candles);
        chart.timeScale().fitContent();
      }

      setLoading(false);

      // ResizeObserver
      const ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width } = entry.contentRect;
          chart.applyOptions({ width });
        }
      });
      ro.observe(chartContainerRef.current);

      return () => {
        ro.disconnect();
      };
    }

    const cleanup = init();

    return () => {
      cancelled = true;
      cleanup?.then((fn) => fn?.());
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
      }
    };
  }, [symbol, resolution, fetchCandles]);

  return (
    <div className="space-y-3">
      {/* Resolution buttons */}
      <div className="flex items-center gap-1">
        {RESOLUTIONS.map((res) => (
          <button
            key={res}
            onClick={() => onResolutionChange(res)}
            className="relative rounded-md px-3 py-1 text-xs font-medium transition-colors"
          >
            {resolution === res && (
              <motion.div
                layoutId="resolution-active"
                className="absolute inset-0 rounded-md bg-primary"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
            <span
              className={`relative z-10 ${
                resolution === res ? "text-primary-foreground" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {res.toUpperCase()}
            </span>
          </button>
        ))}
      </div>

      {/* Chart container */}
      <div className="relative overflow-hidden rounded-lg border border-border bg-card">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-card">
            <Skeleton className="h-[400px] w-full" />
          </div>
        )}
        {error && !loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-card">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
        <div ref={chartContainerRef} className="h-[400px] w-full" />
      </div>
    </div>
  );
}
