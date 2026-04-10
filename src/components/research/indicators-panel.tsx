"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedList, AnimatedListItem } from "@/lib/motion/components";
import { formatPrice } from "@/lib/utils";
import { Activity, Layers, TrendingUp, TrendingDown, ArrowRight, Info, Percent, Clock, BarChart3, Crosshair, Tag } from "@/components/icons";
import { motion } from "framer-motion";

interface IndicatorsPanelProps {
  ticker: any | null;
  indicators: {
    rsi?: number;
    macd?: { value: number; signal: number; histogram: number };
    sma20?: number;
    sma50?: number;
    sma200?: number;
  } | null;
  isLoading: boolean;
}

function getRsiArc(value: number) {
  if (value > 70) return { label: "Overbought", color: "#F6465D", bg: "rgba(246,70,93,0.12)", icon: "↑" };
  if (value < 30) return { label: "Oversold", color: "#0ECB81", bg: "rgba(14,203,129,0.12)", icon: "↓" };
  return { label: "Neutral", color: "#8E8E93", bg: "rgba(142,142,147,0.12)", icon: "→" };
}

// Large circular RSI gauge (90px diameter)
function RsiGaugeCircular({ value }: { value: number }) {
  const info = getRsiArc(value);
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, value)) / 100;
  // Arc covers 270 degrees (3/4 of circle)
  const arcLength = circumference * 0.75;
  const dashOffset = arcLength * (1 - pct);

  return (
    <div className="relative flex items-center justify-center" style={{ width: 96, height: 96 }}>
      <svg width="96" height="96" viewBox="0 0 96 96" className="absolute">
        {/* Background track */}
        <circle
          cx="48" cy="48" r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${circumference - arcLength}`}
          transform="rotate(135 48 48)"
        />
        {/* Value arc */}
        <circle
          cx="48" cy="48" r={radius}
          fill="none"
          stroke={info.color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${circumference - arcLength}`}
          strokeDashoffset={dashOffset}
          transform="rotate(135 48 48)"
          style={{ filter: `drop-shadow(0 0 6px ${info.color}40)` }}
        />
      </svg>
      {/* Center value */}
      <div className="flex flex-col items-center z-10">
        <span className="font-mono tabular-nums text-xl font-bold text-text-primary leading-none">
          {value.toFixed(1)}
        </span>
      </div>
    </div>
  );
}

// Mini histogram bars for MACD
function MacdHistogramBars({ histogram }: { histogram: number }) {
  const isPositive = histogram >= 0;
  const color = isPositive ? "#0ECB81" : "#F6465D";
  // Show 4 bars of varying height
  const heights = isPositive ? [40, 60, 80, 100] : [100, 80, 60, 40];
  const absVal = Math.min(Math.abs(histogram), 500);
  const scale = Math.max(absVal / 500, 0.3);

  return (
    <div className="flex items-end gap-[2px] h-4">
      {heights.map((h, i) => (
        <div
          key={i}
          className="w-[3px] rounded-sm"
          style={{
            height: `${h * scale * 0.16}px`,
            backgroundColor: color,
            opacity: 0.3 + (i * 0.2),
            minHeight: 2,
          }}
        />
      ))}
    </div>
  );
}

// SMA row with Above/Below indicator
function SmaRow({
  label,
  smaPrice,
  currentPrice,
  isClosest,
  tooltip,
}: {
  label: string;
  smaPrice: number;
  currentPrice: number;
  isClosest?: boolean;
  tooltip: string;
}) {
  const isAbove = currentPrice > smaPrice;
  const diff = ((currentPrice - smaPrice) / smaPrice) * 100;

  return (
    <div
      className={`flex items-center justify-between py-3 group/row rounded-lg px-3 -mx-3 transition-all ${
        isClosest ? "bg-primary/[0.04] border border-primary/10" : "hover:bg-white/[0.02]"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="text-[12px] text-text-tertiary group-hover/row:text-text-secondary transition-colors">
          {label}
        </span>
        <div className="relative group/tip">
          <Info className="size-3 text-text-tertiary/40 hover:text-text-tertiary cursor-help transition-colors" />
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-elevated rounded text-[10px] text-text-secondary whitespace-nowrap opacity-0 pointer-events-none group-hover/tip:opacity-100 transition-opacity z-20 shadow-lg border border-white/5">
            {tooltip}
          </div>
        </div>
        {isClosest && (
          <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary">
            Closest
          </span>
        )}
      </div>
      <div className="flex items-center gap-2.5">
        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold rounded-full px-2 py-0.5 ${
          isAbove ? "bg-gain/10 text-gain" : "bg-loss/10 text-loss"
        }`}>
          {isAbove ? <TrendingUp className="size-2.5" /> : <TrendingDown className="size-2.5" />}
          {isAbove ? "Above" : "Below"} {Math.abs(diff).toFixed(1)}%
        </span>
        <span className={`font-mono tabular-nums text-[13px] font-semibold ${
          isAbove ? "text-gain" : "text-loss"
        }`}>
          ${formatPrice(smaPrice)}
        </span>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="kpi-card rounded-2xl p-7">
      <Skeleton className="h-5 w-32 mb-6" />
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function IndicatorsPanel({ ticker, indicators, isLoading }: IndicatorsPanelProps) {
  if (isLoading) {
    return (
      <div className="grid gap-5 md:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  const markPrice = Number(ticker?.mark_price || 0);
  const spotPrice = Number(ticker?.spot_price || 0);
  const fundingRate = Number(ticker?.funding_rate || 0);
  const oiChange6h = Number(ticker?.oi_change_usd_6h || 0);
  const basis = spotPrice > 0 ? ((markPrice - spotPrice) / spotPrice) * 100 : 0;

  const rsiInfo = indicators?.rsi != null ? getRsiArc(indicators.rsi) : null;

  // Determine which SMA is closest to current price
  const smas = [
    { key: "sma20", label: "SMA 20", value: indicators?.sma20, tooltip: "20-period simple moving average" },
    { key: "sma50", label: "SMA 50", value: indicators?.sma50, tooltip: "50-period simple moving average" },
    { key: "sma200", label: "SMA 200", value: indicators?.sma200, tooltip: "200-period simple moving average — key long-term trend" },
  ].filter(s => s.value != null);

  const closestSma = smas.length > 0
    ? smas.reduce((closest, s) =>
        Math.abs(markPrice - (s.value ?? 0)) < Math.abs(markPrice - (closest.value ?? 0)) ? s : closest
      ).key
    : null;

  return (
    <AnimatedList fast className="grid gap-5 md:grid-cols-2">
      {/* Technical Indicators — Premium Card */}
      <AnimatedListItem>
        <motion.div
          className="kpi-card rounded-2xl h-full"
          whileHover={{ y: -2, transition: { duration: 0.2 } }}
        >
          <div className="p-7">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center size-9 rounded-xl bg-[#3B82F6]/12 shadow-[0_0_12px_rgba(59,130,246,0.10)]">
                  <Activity className="size-4 text-[#3B82F6]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary tracking-tight">Technical</h3>
                  <p className="text-[10px] text-text-tertiary mt-0.5">Live Indicators</p>
                </div>
              </div>
            </div>

            {!indicators ? (
              <p className="py-8 text-center text-xs text-text-tertiary">
                No indicator data available
              </p>
            ) : (
              <div className="space-y-6">
                {/* === MOMENTUM OSCILLATORS === */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-text-tertiary/60 mb-4">
                    Momentum Oscillators
                  </p>

                  {/* RSI — Circular gauge */}
                  {indicators.rsi != null && rsiInfo && (
                    <div className="flex items-center gap-5 mb-4">
                      <RsiGaugeCircular value={indicators.rsi} />
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] text-text-tertiary">RSI (14)</span>
                          <div className="relative group/tip">
                            <Info className="size-3 text-text-tertiary/40 hover:text-text-tertiary cursor-help transition-colors" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-elevated rounded text-[10px] text-text-secondary whitespace-nowrap opacity-0 pointer-events-none group-hover/tip:opacity-100 transition-opacity z-20 shadow-lg border border-white/5">
                              RSI &gt; 70 = Overbought, RSI &lt; 30 = Oversold
                            </div>
                          </div>
                        </div>
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold"
                          style={{ backgroundColor: rsiInfo.bg, color: rsiInfo.color }}
                        >
                          {rsiInfo.icon} {rsiInfo.label}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* MACD section */}
                  {indicators.macd && (
                    <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-4 space-y-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-text-secondary">MACD (12,26,9)</span>
                          <div className="relative group/tip">
                            <Info className="size-3 text-text-tertiary/40 hover:text-text-tertiary cursor-help transition-colors" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-elevated rounded text-[10px] text-text-secondary whitespace-nowrap opacity-0 pointer-events-none group-hover/tip:opacity-100 transition-opacity z-20 shadow-lg border border-white/5">
                              Moving Average Convergence Divergence
                            </div>
                          </div>
                        </div>
                        <MacdHistogramBars histogram={indicators.macd.histogram} />
                      </div>
                      <div className="flex items-center justify-between py-1 group/row hover:bg-white/[0.02] rounded px-1 -mx-1 transition-colors">
                        <span className="text-[11px] text-text-tertiary">Value</span>
                        <span className={`font-mono tabular-nums text-[13px] font-semibold ${indicators.macd.value >= 0 ? "text-gain" : "text-loss"}`}>
                          {indicators.macd.value >= 0 ? "+" : ""}{indicators.macd.value.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-1 group/row hover:bg-white/[0.02] rounded px-1 -mx-1 transition-colors">
                        <span className="text-[11px] text-text-tertiary">Signal</span>
                        <span className="font-mono tabular-nums text-[13px] font-semibold text-text-secondary">
                          {indicators.macd.signal.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-1 group/row hover:bg-white/[0.02] rounded px-1 -mx-1 transition-colors">
                        <span className="text-[11px] text-text-tertiary">Histogram</span>
                        <div className="flex items-center gap-1.5">
                          {indicators.macd.histogram >= 0
                            ? <TrendingUp className="size-3 text-gain" />
                            : <TrendingDown className="size-3 text-loss" />
                          }
                          <span className={`font-mono tabular-nums text-[13px] font-bold ${indicators.macd.histogram >= 0 ? "text-gain" : "text-loss"}`}>
                            {indicators.macd.histogram >= 0 ? "+" : ""}{indicators.macd.histogram.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="gradient-separator" />

                {/* === TREND AVERAGES === */}
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-text-tertiary/60 mb-3">
                    Trend Averages
                  </p>
                  <div className="space-y-1">
                    {smas.map(sma => (
                      <SmaRow
                        key={sma.key}
                        label={sma.label}
                        smaPrice={sma.value!}
                        currentPrice={markPrice}
                        isClosest={sma.key === closestSma}
                        tooltip={sma.tooltip}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatedListItem>

      {/* Derivatives Data — Premium Card */}
      <AnimatedListItem>
        <motion.div
          className="derivatives-card h-full"
          whileHover={{ y: -3, transition: { duration: 0.25 } }}
        >
          <div className="p-7">
            {/* Header */}
            <div className="flex items-center justify-between mb-7">
              <div className="flex items-center gap-3.5">
                <div className="flex items-center justify-center size-11 rounded-2xl shadow-[0_0_16px_rgba(245,158,11,0.15)]"
                  style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.18) 0%, rgba(234,88,12,0.12) 100%)" }}
                >
                  <Layers className="size-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-text-primary tracking-tight">Derivatives</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <p className="text-[10px] text-text-tertiary/80">Perpetual Contract Data</p>
                    <span className="flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-gain animate-pulse" />
                      <span className="text-[9px] font-semibold text-gain/80 uppercase tracking-wider">Live</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* === FUNDING & INTEREST === */}
            <div className="mb-1.5">
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-text-tertiary/50 mb-3 px-3">
                Funding & Interest
              </p>

              {/* Funding Rate */}
              <div className="deriv-row flex items-center justify-between py-3 px-3 -mx-0 group/row">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center size-6 rounded-lg bg-white/[0.04]">
                    <Percent className="size-3 text-text-tertiary group-hover/row:text-primary transition-colors" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] text-text-tertiary group-hover/row:text-text-secondary transition-colors">Funding Rate</span>
                    <div className="relative group/tip">
                      <Info className="size-3 text-text-tertiary/30 hover:text-text-tertiary cursor-help transition-colors" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-elevated rounded text-[10px] text-text-secondary whitespace-nowrap opacity-0 pointer-events-none group-hover/tip:opacity-100 transition-opacity z-20 shadow-lg border border-white/5">
                        Rate paid between longs and shorts every 8h
                      </div>
                    </div>
                  </div>
                </div>
                <span className={`deriv-value font-mono tabular-nums text-[14px] font-bold ${fundingRate >= 0 ? "text-gain glow-green" : "text-loss glow-red"}`}>
                  {fundingRate >= 0 ? "+" : ""}{fundingRate.toFixed(4)}%
                </span>
              </div>

              {/* OI Change */}
              <div className="deriv-row flex items-center justify-between py-3 px-3 -mx-0 group/row">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center size-6 rounded-lg bg-white/[0.04]">
                    <BarChart3 className="size-3 text-text-tertiary group-hover/row:text-primary transition-colors" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] text-text-tertiary group-hover/row:text-text-secondary transition-colors">OI Change 6h</span>
                    <div className="relative group/tip">
                      <Info className="size-3 text-text-tertiary/30 hover:text-text-tertiary cursor-help transition-colors" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-elevated rounded text-[10px] text-text-secondary whitespace-nowrap opacity-0 pointer-events-none group-hover/tip:opacity-100 transition-opacity z-20 shadow-lg border border-white/5">
                        Open interest change in last 6 hours
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Mini sparkline for OI */}
                  <svg width="32" height="14" viewBox="0 0 32 14" className="opacity-40">
                    <polyline
                      points={oiChange6h >= 0 ? "0,12 8,10 16,8 24,5 32,2" : "0,2 8,5 16,8 24,10 32,12"}
                      fill="none"
                      stroke={oiChange6h >= 0 ? "#0ECB81" : "#F6465D"}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className={`deriv-value font-mono tabular-nums text-[14px] font-bold ${oiChange6h >= 0 ? "text-gain glow-green" : "text-loss glow-red"}`}>
                    {oiChange6h >= 0 ? "+" : ""}${Math.abs(oiChange6h) >= 1e6 ? (oiChange6h / 1e6).toFixed(2) + "M" : Math.abs(oiChange6h) >= 1e3 ? (oiChange6h / 1e3).toFixed(1) + "K" : oiChange6h.toFixed(0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="gradient-separator my-2" />

            {/* === PRICING === */}
            <div className="mb-1.5 mt-3">
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-text-tertiary/50 mb-3 px-3">
                Pricing
              </p>

              {/* Mark Price */}
              <div className="deriv-row flex items-center justify-between py-3 px-3 -mx-0 group/row">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center size-6 rounded-lg bg-white/[0.04]">
                    <Crosshair className="size-3 text-text-tertiary group-hover/row:text-primary transition-colors" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] text-text-tertiary group-hover/row:text-text-secondary transition-colors">Mark Price</span>
                    <div className="relative group/tip">
                      <Info className="size-3 text-text-tertiary/30 hover:text-text-tertiary cursor-help transition-colors" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-elevated rounded text-[10px] text-text-secondary whitespace-nowrap opacity-0 pointer-events-none group-hover/tip:opacity-100 transition-opacity z-20 shadow-lg border border-white/5">
                        Fair price used for liquidation calculations
                      </div>
                    </div>
                  </div>
                </div>
                <span className="deriv-value font-mono tabular-nums text-[14px] font-bold text-text-primary">
                  ${formatPrice(markPrice)}
                </span>
              </div>

              {/* Spot Price */}
              <div className="deriv-row flex items-center justify-between py-3 px-3 -mx-0 group/row">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center size-6 rounded-lg bg-white/[0.04]">
                    <Tag className="size-3 text-text-tertiary group-hover/row:text-primary transition-colors" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] text-text-tertiary group-hover/row:text-text-secondary transition-colors">Spot Price</span>
                    <div className="relative group/tip">
                      <Info className="size-3 text-text-tertiary/30 hover:text-text-tertiary cursor-help transition-colors" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-elevated rounded text-[10px] text-text-secondary whitespace-nowrap opacity-0 pointer-events-none group-hover/tip:opacity-100 transition-opacity z-20 shadow-lg border border-white/5">
                        Underlying spot market price
                      </div>
                    </div>
                  </div>
                </div>
                <span className="deriv-value font-mono tabular-nums text-[14px] font-bold text-text-primary">
                  {spotPrice > 0 ? `$${formatPrice(spotPrice)}` : "--"}
                </span>
              </div>

              {/* Basis */}
              <div className="deriv-row flex items-center justify-between py-3 px-3 -mx-0 group/row">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center size-6 rounded-lg bg-white/[0.04]">
                    <ArrowRight className="size-3 text-text-tertiary group-hover/row:text-primary transition-colors" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] text-text-tertiary group-hover/row:text-text-secondary transition-colors">Basis</span>
                    <div className="relative group/tip">
                      <Info className="size-3 text-text-tertiary/30 hover:text-text-tertiary cursor-help transition-colors" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-elevated rounded text-[10px] text-text-secondary whitespace-nowrap opacity-0 pointer-events-none group-hover/tip:opacity-100 transition-opacity z-20 shadow-lg border border-white/5">
                        Difference between mark and spot price
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Mini sparkline for Basis */}
                  {spotPrice > 0 && (
                    <svg width="32" height="14" viewBox="0 0 32 14" className="opacity-40">
                      <polyline
                        points={basis >= 0 ? "0,10 8,8 16,7 24,5 32,4" : "0,4 8,5 16,7 24,8 32,10"}
                        fill="none"
                        stroke={basis >= 0 ? "#0ECB81" : "#F6465D"}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                  <span className={`deriv-value font-mono tabular-nums text-[14px] font-bold ${
                    spotPrice > 0 ? (basis >= 0 ? "text-gain glow-green" : "text-loss glow-red") : "text-text-tertiary"
                  }`}>
                    {spotPrice > 0 ? `${basis >= 0 ? "+" : ""}${basis.toFixed(3)}%` : "--"}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer timestamp */}
            <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-white/[0.04]">
              <Clock className="size-3 text-text-tertiary/40" />
              <span className="text-[9px] text-text-tertiary/50 font-medium">Updated just now</span>
            </div>
          </div>
        </motion.div>
      </AnimatedListItem>
    </AnimatedList>
  );
}
