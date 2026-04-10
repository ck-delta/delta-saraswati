"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedList, AnimatedListItem } from "@/lib/motion/components";
import { formatPrice } from "@/lib/utils";
import { Activity, Layers, TrendingUp, TrendingDown, Info, Shield, Zap } from "lucide-react";
import { motion } from "framer-motion";

interface IndicatorsPanelProps {
  ticker: any | null;
  indicators: {
    rsi?: number;
    macd?: { value: number; signal: number; histogram: number };
    macdSignal?: string;
    sma20?: number;
    sma50?: number;
    sma200?: number;
    adx?: { adx: number; plusDI: number; minusDI: number };
    pivotPoints?: { pivot: number; r1: number; r2: number; s1: number; s2: number };
    trendSummary?: string;
  } | null;
  isLoading: boolean;
}

function getRsiArc(value: number) {
  if (value > 70) return { label: "Overbought", color: "#F6465D", bg: "rgba(246,70,93,0.12)", icon: "↑" };
  if (value < 30) return { label: "Oversold", color: "#0ECB81", bg: "rgba(14,203,129,0.12)", icon: "↓" };
  return { label: "Neutral", color: "#8E8E93", bg: "rgba(142,142,147,0.12)", icon: "→" };
}

function RsiGaugeCircular({ value }: { value: number }) {
  const info = getRsiArc(value);
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, value)) / 100;
  const arcLength = circumference * 0.75;
  const dashOffset = arcLength * (1 - pct);

  return (
    <div className="relative flex items-center justify-center" style={{ width: 96, height: 96 }}>
      <svg width="96" height="96" viewBox="0 0 96 96" className="absolute">
        <circle cx="48" cy="48" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${arcLength} ${circumference - arcLength}`} transform="rotate(135 48 48)" />
        <circle cx="48" cy="48" r={radius} fill="none" stroke={info.color} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${arcLength} ${circumference - arcLength}`} strokeDashoffset={dashOffset} transform="rotate(135 48 48)" style={{ filter: `drop-shadow(0 0 6px ${info.color}40)` }} />
      </svg>
      <span className="font-mono tabular-nums text-xl font-bold text-text-primary leading-none z-10">{value.toFixed(1)}</span>
    </div>
  );
}

function Tooltip({ text }: { text: string }) {
  return (
    <div className="relative group/tip inline-flex">
      <Info className="size-3 text-text-tertiary/40 hover:text-text-tertiary cursor-help transition-colors" />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-elevated rounded text-[10px] text-text-secondary whitespace-nowrap opacity-0 pointer-events-none group-hover/tip:opacity-100 transition-opacity z-20 shadow-lg border border-white/5">
        {text}
      </div>
    </div>
  );
}

function SmaRow({ label, smaPrice, currentPrice, isClosest, tooltip }: {
  label: string; smaPrice: number; currentPrice: number; isClosest?: boolean; tooltip: string;
}) {
  const isAbove = currentPrice > smaPrice;
  const diff = ((currentPrice - smaPrice) / smaPrice) * 100;

  return (
    <div className={`flex items-center justify-between py-3 group/row rounded-lg px-3 -mx-3 transition-all ${isClosest ? "bg-primary/[0.04] border border-primary/10" : "hover:bg-white/[0.02]"}`}>
      <div className="flex items-center gap-2">
        <span className="text-[12px] text-text-tertiary group-hover/row:text-text-secondary transition-colors">{label}</span>
        <Tooltip text={tooltip} />
        {isClosest && <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary">Closest</span>}
      </div>
      <div className="flex items-center gap-2.5">
        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold rounded-full px-2 py-0.5 ${isAbove ? "bg-gain/10 text-gain" : "bg-loss/10 text-loss"}`}>
          {isAbove ? <TrendingUp className="size-2.5" /> : <TrendingDown className="size-2.5" />}
          {isAbove ? "Above" : "Below"} {Math.abs(diff).toFixed(1)}%
        </span>
        <span className={`font-mono tabular-nums text-[13px] font-semibold ${isAbove ? "text-gain" : "text-loss"}`}>${formatPrice(smaPrice)}</span>
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

function getMacdSignalStyle(signal: string) {
  switch (signal) {
    case "Strong Buy": return { bg: "bg-gain/20", text: "text-gain", border: "border-gain/30" };
    case "Buy": return { bg: "bg-gain/10", text: "text-gain/80", border: "border-gain/20" };
    case "Strong Sell": return { bg: "bg-loss/20", text: "text-loss", border: "border-loss/30" };
    case "Sell": return { bg: "bg-loss/10", text: "text-loss/80", border: "border-loss/20" };
    default: return { bg: "bg-white/5", text: "text-text-secondary", border: "border-white/10" };
  }
}

function getAdxLabel(adx: number) {
  if (adx >= 25) return { label: "Strong Trend", color: "text-primary" };
  if (adx >= 20) return { label: "Moderate", color: "text-text-secondary" };
  return { label: "Weak / Ranging", color: "text-text-tertiary" };
}

export function IndicatorsPanel({ ticker, indicators, isLoading }: IndicatorsPanelProps) {
  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="grid gap-5 md:grid-cols-2"><SkeletonCard /><SkeletonCard /></div>
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
  const macdStyle = indicators?.macdSignal ? getMacdSignalStyle(indicators.macdSignal) : null;
  const adxInfo = indicators?.adx ? getAdxLabel(indicators.adx.adx) : null;

  const smas = [
    { key: "sma20", label: "SMA 20", value: indicators?.sma20, tooltip: "20-period simple moving average" },
    { key: "sma50", label: "SMA 50", value: indicators?.sma50, tooltip: "50-period simple moving average" },
    { key: "sma200", label: "SMA 200", value: indicators?.sma200, tooltip: "200-period — key long-term trend" },
  ].filter(s => s.value != null);

  const closestSma = smas.length > 0
    ? smas.reduce((c, s) => Math.abs(markPrice - (s.value ?? 0)) < Math.abs(markPrice - (c.value ?? 0)) ? s : c).key
    : null;

  const pp = indicators?.pivotPoints;
  let priceZone = "";
  if (pp && markPrice > 0) {
    if (markPrice > pp.r2) priceZone = "Above R2 — extended";
    else if (markPrice > pp.r1) priceZone = "Between R1 and R2";
    else if (markPrice > pp.pivot) priceZone = "Between Pivot and R1";
    else if (markPrice > pp.s1) priceZone = "Between S1 and Pivot";
    else if (markPrice > pp.s2) priceZone = "Between S1 and S2";
    else priceZone = "Below S2 — oversold zone";
  }

  return (
    <div className="space-y-5">
      <AnimatedList fast className="grid gap-5 md:grid-cols-2">
        {/* TECHNICAL CARD */}
        <AnimatedListItem>
          <motion.div className="kpi-card rounded-2xl h-full" whileHover={{ y: -4, transition: { duration: 0.3 } }}>
            <div className="p-7">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center size-9 rounded-xl bg-[#3B82F6]/12 shadow-[0_0_12px_rgba(59,130,246,0.10)]">
                  <Activity className="size-4 text-[#3B82F6]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary tracking-tight">Technical</h3>
                  <p className="text-[10px] text-text-tertiary mt-0.5 flex items-center gap-1.5"><span className="live-dot" />Live Indicators</p>
                </div>
              </div>

              {!indicators ? (
                <p className="py-8 text-center text-xs text-text-tertiary">No indicator data available</p>
              ) : (
                <div className="space-y-5">
                  {/* MOMENTUM */}
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-text-tertiary/60 mb-4">Momentum Oscillators</p>
                    {indicators.rsi != null && rsiInfo && (
                      <div className="flex items-center gap-5 mb-4">
                        <RsiGaugeCircular value={indicators.rsi} />
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] text-text-tertiary">RSI (14)</span>
                            <Tooltip text="RSI > 70 = Overbought, RSI < 30 = Oversold" />
                          </div>
                          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold" style={{ backgroundColor: rsiInfo.bg, color: rsiInfo.color }}>
                            {rsiInfo.icon} {rsiInfo.label}
                          </span>
                        </div>
                      </div>
                    )}
                    {indicators.macdSignal && macdStyle && (
                      <div className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] text-text-tertiary">MACD (12,26,9)</span>
                          <Tooltip text="Moving Average Convergence Divergence crossover signal" />
                        </div>
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold border ${macdStyle.bg} ${macdStyle.text} ${macdStyle.border}`}>
                          <Zap className="size-3" />
                          {indicators.macdSignal}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* ADX */}
                  {indicators.adx && adxInfo && (
                    <>
                      <div className="gradient-separator" />
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-text-tertiary/60 mb-3">Trend Strength</p>
                        <div className="flex items-center justify-between py-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] text-text-tertiary">ADX (14)</span>
                            <Tooltip text="ADX > 25 = strong trend, < 20 = ranging/weak" />
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-[11px] font-semibold ${indicators.adx.plusDI > indicators.adx.minusDI ? "text-gain" : "text-loss"}`}>
                              {indicators.adx.plusDI > indicators.adx.minusDI ? "▲ Bullish" : "▼ Bearish"}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className={`font-mono tabular-nums text-lg font-bold ${adxInfo.color}`}>{indicators.adx.adx.toFixed(1)}</span>
                              <span className={`text-[10px] font-medium ${adxInfo.color}`}>{adxInfo.label}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="gradient-separator" />

                  {/* TREND AVERAGES */}
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-text-tertiary/60 mb-3">Trend Averages</p>
                    {indicators.trendSummary && (
                      <div className={`rounded-xl px-4 py-3 mb-4 text-[12px] leading-relaxed border ${
                        indicators.trendSummary.toLowerCase().includes("uptrend") || indicators.trendSummary.toLowerCase().includes("bullish") || indicators.trendSummary.toLowerCase().includes("golden")
                          ? "bg-gain/[0.06] border-gain/15 text-gain"
                          : indicators.trendSummary.toLowerCase().includes("downtrend") || indicators.trendSummary.toLowerCase().includes("bearish") || indicators.trendSummary.toLowerCase().includes("death")
                            ? "bg-loss/[0.06] border-loss/15 text-loss"
                            : "bg-white/[0.03] border-white/[0.06] text-text-secondary"
                      }`}>
                        {indicators.trendSummary}
                      </div>
                    )}
                    <div className="space-y-1">
                      {smas.map(sma => (
                        <SmaRow key={sma.key} label={sma.label} smaPrice={sma.value!} currentPrice={markPrice} isClosest={sma.key === closestSma} tooltip={sma.tooltip} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatedListItem>

        {/* DERIVATIVES CARD */}
        <AnimatedListItem>
          <motion.div className="kpi-card rounded-2xl h-full" whileHover={{ y: -4, transition: { duration: 0.3 } }}>
            <div className="p-7">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center size-9 rounded-xl bg-primary/12 shadow-[0_0_12px_rgba(245,158,11,0.10)]">
                  <Layers className="size-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary tracking-tight">Derivatives</h3>
                  <p className="text-[10px] text-text-tertiary mt-0.5 flex items-center gap-1.5"><span className="live-dot" />Perpetual Contract Data</p>
                </div>
              </div>
              <div className="space-y-0 divide-y divide-white/[0.04]">
                {[
                  { label: "Funding Rate", value: `${fundingRate >= 0 ? "+" : ""}${fundingRate.toFixed(4)}%`, color: fundingRate >= 0 ? "text-gain" : "text-loss", tooltip: "Rate paid between longs and shorts every 8h" },
                  { label: "OI Change 6h", value: `${oiChange6h >= 0 ? "+" : ""}$${Math.abs(oiChange6h) >= 1e6 ? (oiChange6h / 1e6).toFixed(2) + "M" : Math.abs(oiChange6h) >= 1e3 ? (oiChange6h / 1e3).toFixed(1) + "K" : oiChange6h.toFixed(0)}`, color: oiChange6h >= 0 ? "text-gain" : "text-loss", tooltip: "Open interest change in last 6 hours" },
                  { label: "Mark Price", value: `$${formatPrice(markPrice)}`, color: "text-text-primary", tooltip: "Fair price for liquidation calculations" },
                  { label: "Spot Price", value: spotPrice > 0 ? `$${formatPrice(spotPrice)}` : "--", color: "text-text-primary", tooltip: "Underlying spot market price" },
                  { label: "Basis", value: spotPrice > 0 ? `${basis >= 0 ? "+" : ""}${basis.toFixed(3)}%` : "--", color: spotPrice > 0 ? (basis >= 0 ? "text-gain" : "text-loss") : "text-text-tertiary", tooltip: "Difference between mark and spot price" },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between py-3 group/row deriv-row px-3 -mx-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] text-[#94A3B8] group-hover/row:text-text-secondary transition-colors">{row.label}</span>
                      <Tooltip text={row.tooltip} />
                    </div>
                    <span className={`font-mono tabular-nums text-[13px] font-semibold deriv-value ${row.color} ${row.color.includes("gain") ? "glow-green" : row.color.includes("loss") ? "glow-red" : ""}`}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatedListItem>
      </AnimatedList>

      {/* SUPPORT & RESISTANCE CARD */}
      {pp && (
        <motion.div
          className="kpi-card rounded-2xl"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-30px" }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          whileHover={{ y: -4, transition: { duration: 0.3 } }}
        >
          <div className="p-7">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center size-9 rounded-xl bg-[#A855F7]/12 shadow-[0_0_12px_rgba(168,85,247,0.10)]">
                  <Shield className="size-4 text-[#A855F7]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary tracking-tight">Support & Resistance</h3>
                  <p className="text-[10px] text-text-tertiary mt-0.5">Classic Pivot Points</p>
                </div>
              </div>
              {priceZone && (
                <span className="text-[11px] font-medium text-primary bg-primary/10 rounded-full px-3 py-1">{priceZone}</span>
              )}
            </div>

            <div className="grid grid-cols-5 gap-3">
              {[
                { label: "S2", value: pp.s2, color: "text-gain", bg: "bg-gain/[0.06]", border: "border-gain/15" },
                { label: "S1", value: pp.s1, color: "text-gain/80", bg: "bg-gain/[0.04]", border: "border-gain/10" },
                { label: "Pivot", value: pp.pivot, color: "text-primary", bg: "bg-primary/[0.06]", border: "border-primary/20" },
                { label: "R1", value: pp.r1, color: "text-loss/80", bg: "bg-loss/[0.04]", border: "border-loss/10" },
                { label: "R2", value: pp.r2, color: "text-loss", bg: "bg-loss/[0.06]", border: "border-loss/15" },
              ].map(level => {
                const isNearPrice = Math.abs((markPrice - level.value) / level.value) < 0.005;
                return (
                  <div key={level.label} className={`rounded-xl border p-4 text-center transition-all ${level.bg} ${level.border} ${isNearPrice ? "ring-1 ring-primary/30 shadow-[0_0_12px_rgba(245,158,11,0.08)]" : ""}`}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-2">{level.label}</p>
                    <p className={`font-mono tabular-nums text-sm font-bold ${level.color}`}>${formatPrice(level.value)}</p>
                    {isNearPrice && <p className="text-[9px] font-semibold text-primary mt-1.5">◆ Near Price</p>}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-text-tertiary">
              <span>Current:</span>
              <span className="font-mono tabular-nums font-bold text-text-primary">${formatPrice(markPrice)}</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
