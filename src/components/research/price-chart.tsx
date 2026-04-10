"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from "@/components/icons";

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
  const [dateRange, setDateRange] = useState<string>("");

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
        const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
        setDateRange(`${fmt(new Date(candles[0].time * 1000))} – ${fmt(new Date(candles[candles.length - 1].time * 1000))}`);
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
    <div className="space-y-0">
      {/* Chart header — inside the kpi-card wrapper from parent */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-sm font-bold text-text-primary">{symbol}</span>
          <span className="text-[10px] text-text-tertiary">Perpetual</span>
          {dateRange && (
            <>
              <span className="text-[10px] text-text-tertiary/40">·</span>
              <span className="text-[10px] text-text-tertiary">{resolution.toUpperCase()}</span>
              <span className="text-[10px] text-text-tertiary/40">·</span>
              <span className="text-[10px] text-text-tertiary">{dateRange}</span>
            </>
          )}
        </div>

        {/* Resolution buttons — premium 3D pills */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-white/[0.03] border border-white/[0.04]">
          {RESOLUTIONS.map((res) => (
            <motion.button
              key={res}
              onClick={() => onResolutionChange(res)}
              className="relative rounded-md px-3 py-1.5 text-[11px] font-semibold transition-colors"
              whileHover={resolution !== res ? { scale: 1.05, backgroundColor: "rgba(255,255,255,0.04)" } : undefined}
              whileTap={resolution !== res ? { scale: 0.95 } : undefined}
            >
              {resolution === res && (
                <motion.div
                  layoutId="resolution-active"
                  className="absolute inset-0 rounded-md bg-primary shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <span
                className={`relative z-10 ${
                  resolution === res ? "text-primary-foreground" : "text-text-tertiary hover:text-text-primary"
                }`}
              >
                {res.toUpperCase()}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Chart container */}
      <div className="relative overflow-hidden bg-card">
        <AnimatePresence>
          {loading && (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 z-10 flex items-center justify-center bg-card"
            >
              <Skeleton className="h-[400px] w-full" />
            </motion.div>
          )}
          {error && !loading && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 flex items-center justify-center bg-card"
            >
              <div className="flex flex-col items-center">
                <AlertTriangle className="size-5 text-red-400 mb-2" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={chartContainerRef} className="h-[400px] w-full" />
      </div>
    </div>
  );
}
