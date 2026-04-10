"use client";

import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedList, AnimatedListItem } from "@/lib/motion/components";
import { formatPrice } from "@/lib/utils";
import { Activity, Layers, TrendingUp, TrendingDown, Info, Shield, Zap, Eye, Percent, BarChart3, Tag, GitBranch } from "lucide-react";
import { motion } from "framer-motion";
import { classifyDerivatives, classifyPivotSignal } from "@/lib/indicators";

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
    overallSignal?: { signal: string; confidence: number; reasoning: string[]; watchNext: string };
  } | null;
  isLoading: boolean;
}

// === HELPER FUNCTIONS ===

function getRsiArc(value: number) {
  if (value > 70) return { label: "Overbought", color: "#F6465D", bg: "rgba(246,70,93,0.12)", icon: "↑" };
  if (value < 30) return { label: "Oversold", color: "#22C55E", bg: "rgba(34,197,94,0.12)", icon: "↓" };
  return { label: "Neutral", color: "#94A3B8", bg: "rgba(148,163,184,0.12)", icon: "→" };
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
        <circle cx="48" cy="48" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${arcLength} ${circumference - arcLength}`} transform="rotate(135 48 48)" />
        <circle cx="48" cy="48" r={radius} fill="none" stroke={info.color} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${arcLength} ${circumference - arcLength}`} strokeDashoffset={dashOffset} transform="rotate(135 48 48)" style={{ filter: `drop-shadow(0 0 8px ${info.color}50)` }} />
      </svg>
      <span className="font-mono tabular-nums text-2xl font-bold text-[#F1F5F9] leading-none z-10">{value.toFixed(1)}</span>
    </div>
  );
}

function Tooltip({ text }: { text: string }) {
  return (
    <div className="relative group/tip inline-flex">
      <Info className="size-3 text-[#64748B] hover:text-[#94A3B8] cursor-help transition-colors" />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 bg-[#1E293B] rounded-lg text-[10px] text-[#CBD5E1] whitespace-nowrap opacity-0 pointer-events-none group-hover/tip:opacity-100 transition-opacity z-20 shadow-xl border border-white/10">{text}</div>
    </div>
  );
}

function SmaRow({ label, smaPrice, currentPrice, isClosest, tooltip }: { label: string; smaPrice: number; currentPrice: number; isClosest?: boolean; tooltip: string }) {
  const isAbove = currentPrice > smaPrice;
  const diff = ((currentPrice - smaPrice) / smaPrice) * 100;
  return (
    <div className={`flex items-center justify-between py-3.5 group/row rounded-lg px-3 -mx-3 transition-all ${isClosest ? "bg-primary/[0.06] border border-primary/15" : "hover:bg-white/[0.03]"}`}>
      <div className="flex items-center gap-2">
        <span className="text-[13px] font-medium text-[#CBD5E1] group-hover/row:text-[#F1F5F9] transition-colors">{label}</span>
        <Tooltip text={tooltip} />
        {isClosest && <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/15 text-primary">Closest</span>}
      </div>
      <div className="flex items-center gap-2.5">
        <span className={`inline-flex items-center gap-1 text-[10px] font-bold rounded-full px-2 py-0.5 ${isAbove ? "bg-[#22C55E]/12 text-[#22C55E]" : "bg-[#F87171]/12 text-[#F87171]"}`}>
          {isAbove ? <TrendingUp className="size-2.5" /> : <TrendingDown className="size-2.5" />}
          {isAbove ? "Above" : "Below"} {Math.abs(diff).toFixed(1)}%
        </span>
        <span className={`font-mono tabular-nums text-sm font-bold ${isAbove ? "text-[#22C55E] glow-green" : "text-[#F87171] glow-red"}`}>${formatPrice(smaPrice)}</span>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (<div className="kpi-card rounded-2xl p-7"><Skeleton className="h-5 w-32 mb-6" /><div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => (<div key={i} className="flex items-center justify-between"><Skeleton className="h-3.5 w-24" /><Skeleton className="h-4.5 w-20" /></div>))}</div></div>);
}

function getSignalStyle(signal: string) {
  switch (signal) {
    case "Strong Buy": return { bg: "bg-[#22C55E]/15", text: "text-[#22C55E]", border: "border-[#22C55E]/25", glow: "shadow-[0_0_16px_rgba(34,197,94,0.25)]", gradBg: "from-[#22C55E]/[0.06] to-transparent" };
    case "Buy": return { bg: "bg-[#22C55E]/10", text: "text-[#4ADE80]", border: "border-[#22C55E]/15", glow: "shadow-[0_0_12px_rgba(34,197,94,0.15)]", gradBg: "from-[#22C55E]/[0.04] to-transparent" };
    case "Neutral": return { bg: "bg-[#94A3B8]/10", text: "text-[#94A3B8]", border: "border-[#94A3B8]/15", glow: "", gradBg: "from-[#94A3B8]/[0.03] to-transparent" };
    case "Sell": return { bg: "bg-[#F87171]/10", text: "text-[#F87171]", border: "border-[#F87171]/15", glow: "shadow-[0_0_12px_rgba(248,113,113,0.15)]", gradBg: "from-[#F87171]/[0.04] to-transparent" };
    case "Strong Sell": return { bg: "bg-[#F87171]/15", text: "text-[#F87171]", border: "border-[#F87171]/25", glow: "shadow-[0_0_16px_rgba(248,113,113,0.25)]", gradBg: "from-[#F87171]/[0.06] to-transparent" };
    default: return { bg: "bg-white/5", text: "text-[#94A3B8]", border: "border-white/10", glow: "", gradBg: "from-white/[0.02] to-transparent" };
  }
}

function getMacdSignalStyle(signal: string) {
  switch (signal) {
    case "Strong Buy": return { bg: "bg-[#22C55E]/20", text: "text-[#22C55E]", border: "border-[#22C55E]/30", glow: "shadow-[0_0_12px_rgba(34,197,94,0.3)]" };
    case "Buy": return { bg: "bg-[#22C55E]/10", text: "text-[#4ADE80]", border: "border-[#22C55E]/20", glow: "" };
    case "Strong Sell": return { bg: "bg-[#F87171]/20", text: "text-[#F87171]", border: "border-[#F87171]/30", glow: "shadow-[0_0_12px_rgba(248,113,113,0.3)]" };
    case "Sell": return { bg: "bg-[#F87171]/10", text: "text-[#F87171]", border: "border-[#F87171]/20", glow: "" };
    default: return { bg: "bg-white/5", text: "text-[#94A3B8]", border: "border-white/10", glow: "" };
  }
}

function getAdxLabel(adx: number) {
  if (adx >= 25) return { label: "Strong Trend", color: "text-primary" };
  if (adx >= 20) return { label: "Moderate", color: "text-[#CBD5E1]" };
  return { label: "Weak / Ranging", color: "text-[#94A3B8]" };
}

// Row icons for derivatives
const DERIV_ICONS: Record<string, typeof Percent> = {
  "Funding Rate": Percent,
  "OI Change 6h": BarChart3,
  "Mark Price": Tag,
  "Spot Price": Tag,
  "Basis": GitBranch,
};

// === MAIN COMPONENT ===

export function IndicatorsPanel({ ticker, indicators, isLoading }: IndicatorsPanelProps) {
  if (isLoading) {
    return (<div className="grid gap-5 md:grid-cols-2"><SkeletonCard /><SkeletonCard /></div>);
  }

  const markPrice = Number(ticker?.mark_price || 0);
  const spotPrice = Number(ticker?.spot_price || 0);
  const fundingRate = Number(ticker?.funding_rate || 0);
  const oiChange6h = Number(ticker?.oi_change_usd_6h || 0);
  const basis = spotPrice > 0 ? ((markPrice - spotPrice) / spotPrice) * 100 : 0;
  const priceChange = Number(ticker?.mark_change_24h || 0);

  const rsiInfo = indicators?.rsi != null ? getRsiArc(indicators.rsi) : null;
  const macdStyle = indicators?.macdSignal ? getMacdSignalStyle(indicators.macdSignal) : null;
  const adxInfo = indicators?.adx ? getAdxLabel(indicators.adx.adx) : null;
  const pp = indicators?.pivotPoints;

  // Client-side derivatives signals
  const derivSignal = useMemo(() => classifyDerivatives(priceChange > 0, oiChange6h > 0, fundingRate > 0), [priceChange, oiChange6h, fundingRate]);
  const pivotSignal = useMemo(() => pp ? classifyPivotSignal(markPrice, pp.pivot, pp.r1, pp.s1) : null, [markPrice, pp]);

  // Augment overall signal with derivatives reasoning
  const os = indicators?.overallSignal;
  const augmentedSignal = useMemo(() => {
    if (!os) return null;
    const extraReasoning = [...os.reasoning];
    let scoreAdj = 0;
    // Derivatives positioning
    if (derivSignal.color === "bullish") { scoreAdj += 1; extraReasoning.push(`${derivSignal.signal} — ${derivSignal.description.split(".")[0]}`); }
    else { scoreAdj -= 1; extraReasoning.push(`${derivSignal.signal} — ${derivSignal.description.split(".")[0]}`); }
    // Pivot signal
    if (pivotSignal) {
      if (pivotSignal.signal === "Buy") { scoreAdj += 1; extraReasoning.push(`Pivot: ${pivotSignal.reason}`); }
      else { scoreAdj -= 1; extraReasoning.push(`Pivot: ${pivotSignal.reason}`); }
    }
    // Recompute signal from original + adjustment
    const origScoreMap: Record<string, number> = { "Strong Buy": 5, "Buy": 2, "Neutral": 0, "Sell": -2, "Strong Sell": -5 };
    const totalScore = (origScoreMap[os.signal] ?? 0) + scoreAdj;
    let newSignal: string;
    if (totalScore >= 4) newSignal = "Strong Buy";
    else if (totalScore >= 2) newSignal = "Buy";
    else if (totalScore >= -1) newSignal = "Neutral";
    else if (totalScore >= -3) newSignal = "Sell";
    else newSignal = "Strong Sell";
    const newConf = Math.min(95, Math.max(50, Math.round((Math.abs(totalScore) / 9) * 100)));
    return { signal: newSignal, confidence: newConf, reasoning: extraReasoning, watchNext: os.watchNext };
  }, [os, derivSignal, pivotSignal]);

  const osStyle = augmentedSignal ? getSignalStyle(augmentedSignal.signal) : null;

  const smas = [
    { key: "sma20", label: "SMA 20", value: indicators?.sma20, tooltip: "20-period simple moving average" },
    { key: "sma50", label: "SMA 50", value: indicators?.sma50, tooltip: "50-period simple moving average" },
    { key: "sma200", label: "SMA 200", value: indicators?.sma200, tooltip: "200-period — key long-term trend" },
  ].filter(s => s.value != null);

  const closestSma = smas.length > 0 ? smas.reduce((c, s) => Math.abs(markPrice - (s.value ?? 0)) < Math.abs(markPrice - (c.value ?? 0)) ? s : c).key : null;

  // Price zone for S&R
  let priceZone = "";
  if (pp && markPrice > 0) {
    if (markPrice > pp.r2) priceZone = "Above R2";
    else if (markPrice > pp.r1) priceZone = "R1 – R2";
    else if (markPrice > pp.pivot) priceZone = "Pivot – R1";
    else if (markPrice > pp.s1) priceZone = "S1 – Pivot";
    else if (markPrice > pp.s2) priceZone = "S1 – S2";
    else priceZone = "Below S2";
  }

  // Derivatives data rows
  const derivRows = [
    { label: "Funding Rate", value: `${fundingRate >= 0 ? "+" : ""}${fundingRate.toFixed(4)}%`, color: fundingRate >= 0 ? "text-[#22C55E]" : "text-[#F87171]", tooltip: "Rate paid between longs and shorts every 8h" },
    { label: "OI Change 6h", value: `${oiChange6h >= 0 ? "+" : ""}$${Math.abs(oiChange6h) >= 1e6 ? (oiChange6h / 1e6).toFixed(2) + "M" : Math.abs(oiChange6h) >= 1e3 ? (oiChange6h / 1e3).toFixed(1) + "K" : oiChange6h.toFixed(0)}`, color: oiChange6h >= 0 ? "text-[#22C55E]" : "text-[#F87171]", tooltip: "Open interest change in last 6 hours" },
    { label: "Mark Price", value: `$${formatPrice(markPrice)}`, color: "text-[#F1F5F9]", tooltip: "Fair price for liquidation calculations" },
    { label: "Spot Price", value: spotPrice > 0 ? `$${formatPrice(spotPrice)}` : "--", color: "text-[#F1F5F9]", tooltip: "Underlying spot market price" },
    { label: "Basis", value: spotPrice > 0 ? `${basis >= 0 ? "+" : ""}${basis.toFixed(3)}%` : "--", color: spotPrice > 0 ? (basis >= 0 ? "text-[#22C55E]" : "text-[#F87171]") : "text-[#64748B]", tooltip: "Difference between mark and spot price" },
  ];

  return (
    <AnimatedList fast className="grid gap-5 md:grid-cols-2">
      {/* ===== TECHNICAL CARD ===== */}
      <AnimatedListItem>
        <motion.div className="kpi-card rounded-2xl h-full" whileHover={{ y: -4, transition: { duration: 0.3 } }}>
          <div className="p-7">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center size-9 rounded-xl bg-[#3B82F6]/15 shadow-[0_0_14px_rgba(59,130,246,0.12)]">
                <Activity className="size-4 text-[#60A5FA]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F1F5F9] tracking-tight">Technical</h3>
                <p className="text-[10px] text-[#64748B] mt-0.5 flex items-center gap-1.5"><span className="live-dot" />Live Indicators</p>
              </div>
            </div>

            {!indicators ? (
              <p className="py-8 text-center text-sm text-[#64748B]">No indicator data available</p>
            ) : (
              <div className="space-y-5">
                {/* OVERALL SIGNAL */}
                {augmentedSignal && osStyle && (
                  <div className={`rounded-xl border p-5 bg-gradient-to-b ${osStyle.gradBg} ${osStyle.border} ${osStyle.glow}`}>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-[#CBD5E1]">Overall Signal</span>
                      <span className="text-[12px] font-mono font-bold text-[#94A3B8]">Confidence: {augmentedSignal.confidence}%</span>
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-base font-bold border ${osStyle.bg} ${osStyle.text} ${osStyle.border} ${osStyle.glow}`}>
                        <Zap className="size-4" />{augmentedSignal.signal}
                      </span>
                    </div>
                    <div className="space-y-1.5 mb-3">
                      {augmentedSignal.reasoning.map((r, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-[#64748B] mt-0.5 text-[10px] shrink-0">•</span>
                          <span className="text-[12px] leading-relaxed text-[#94A3B8]">{r}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5 pt-2 border-t border-white/[0.04]">
                      <Eye className="size-3 text-[#64748B]" />
                      <span className="text-[11px] text-[#64748B] italic">{augmentedSignal.watchNext}</span>
                    </div>
                  </div>
                )}

                {/* MOMENTUM OSCILLATORS */}
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-[#CBD5E1] mb-4">Momentum Oscillators</p>
                  {indicators.rsi != null && rsiInfo && (
                    <div className="flex items-center gap-5 mb-4">
                      <RsiGaugeCircular value={indicators.rsi} />
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold text-[#CBD5E1]">RSI (14)</span>
                          <Tooltip text="RSI > 70 = Overbought, RSI < 30 = Oversold" />
                        </div>
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold" style={{ backgroundColor: rsiInfo.bg, color: rsiInfo.color }}>
                          {rsiInfo.icon} {rsiInfo.label}
                        </span>
                      </div>
                    </div>
                  )}
                  {indicators.macdSignal && macdStyle && (
                    <div className="flex items-center justify-between py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-[#CBD5E1]">MACD (12,26,9)</span>
                        <Tooltip text="Moving Average Convergence Divergence crossover signal" />
                      </div>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold border ${macdStyle.bg} ${macdStyle.text} ${macdStyle.border} ${macdStyle.glow}`}>
                        <Zap className="size-3" />{indicators.macdSignal}
                      </span>
                    </div>
                  )}
                </div>

                <div className="gradient-separator" />

                {/* TREND STRENGTH */}
                {indicators.adx && adxInfo && (
                  <>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-[#CBD5E1] mb-3">Trend Strength</p>
                      <div className="flex items-center justify-between py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold text-[#CBD5E1]">ADX (14)</span>
                          <Tooltip text="ADX > 25 = strong trend, < 20 = ranging/weak" />
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-[12px] font-bold ${indicators.adx.plusDI > indicators.adx.minusDI ? "text-[#22C55E] glow-green" : "text-[#F87171] glow-red"}`}>
                            {indicators.adx.plusDI > indicators.adx.minusDI ? "▲ Bullish" : "▼ Bearish"}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className={`font-mono tabular-nums text-xl font-bold ${adxInfo.color}`}>{indicators.adx.adx.toFixed(1)}</span>
                            <span className={`text-[11px] font-semibold ${adxInfo.color}`}>{adxInfo.label}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="gradient-separator" />
                  </>
                )}

                {/* TREND AVERAGES */}
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-[#CBD5E1] mb-3">Trend Averages</p>
                  {indicators.trendSummary && (
                    <div className={`rounded-xl px-4 py-3 mb-4 text-[12px] leading-relaxed border ${
                      indicators.trendSummary.toLowerCase().includes("uptrend") || indicators.trendSummary.toLowerCase().includes("bullish") || indicators.trendSummary.toLowerCase().includes("golden")
                        ? "bg-[#22C55E]/[0.06] border-[#22C55E]/15 text-[#4ADE80]"
                        : indicators.trendSummary.toLowerCase().includes("downtrend") || indicators.trendSummary.toLowerCase().includes("bearish") || indicators.trendSummary.toLowerCase().includes("death")
                          ? "bg-[#F87171]/[0.06] border-[#F87171]/15 text-[#F87171]"
                          : "bg-white/[0.03] border-white/[0.06] text-[#94A3B8]"
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

      {/* ===== DERIVATIVES CARD (now includes S&R + Positioning) ===== */}
      <AnimatedListItem>
        <motion.div className="derivatives-card h-full" whileHover={{ y: -4, transition: { duration: 0.3 } }}>
          <div className="p-7">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center size-9 rounded-xl bg-primary/15 shadow-[0_0_14px_rgba(245,158,11,0.12)]">
                <Layers className="size-4 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#F1F5F9] tracking-tight">Derivatives</h3>
                <p className="text-[10px] text-[#64748B] mt-0.5 flex items-center gap-1.5"><span className="live-dot" />Perpetual Contract Data</p>
              </div>
            </div>

            {/* Data rows with icons */}
            <div className="space-y-0 divide-y divide-white/[0.06]">
              {derivRows.map(row => {
                const Icon = DERIV_ICONS[row.label] || Tag;
                return (
                  <div key={row.label} className="flex items-center justify-between py-3.5 group/row deriv-row px-3 -mx-3">
                    <div className="flex items-center gap-2.5">
                      <Icon className="size-3.5 text-[#475569]" />
                      <span className="text-[13px] font-medium text-[#CBD5E1] group-hover/row:text-[#F1F5F9] transition-colors">{row.label}</span>
                      <Tooltip text={row.tooltip} />
                    </div>
                    <span className={`font-mono tabular-nums text-sm font-bold deriv-value ${row.color} ${row.color.includes("22C55E") ? "glow-green" : row.color.includes("F87171") ? "glow-red" : ""}`}>{row.value}</span>
                  </div>
                );
              })}
            </div>

            {/* S&R Section */}
            {pp && (
              <>
                <div className="gradient-separator my-5" />
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Shield className="size-3.5 text-[#A855F7]" />
                      <p className="text-[11px] font-bold uppercase tracking-widest text-[#CBD5E1]">Support & Resistance</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {pivotSignal && (
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold rounded-full px-2 py-0.5 ${pivotSignal.signal === "Buy" ? "bg-[#22C55E]/12 text-[#22C55E]" : "bg-[#F87171]/12 text-[#F87171]"}`}>
                          {pivotSignal.signal === "Buy" ? <TrendingUp className="size-2.5" /> : <TrendingDown className="size-2.5" />}
                          {pivotSignal.signal} — {priceZone}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Compact pivot levels */}
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { label: "S2", value: pp.s2, color: "text-[#22C55E]", bg: "bg-[#22C55E]/[0.05]", border: "border-[#22C55E]/10" },
                      { label: "S1", value: pp.s1, color: "text-[#4ADE80]", bg: "bg-[#22C55E]/[0.03]", border: "border-[#22C55E]/8" },
                      { label: "P", value: pp.pivot, color: "text-primary", bg: "bg-primary/[0.06]", border: "border-primary/15" },
                      { label: "R1", value: pp.r1, color: "text-[#FCA5A5]", bg: "bg-[#F87171]/[0.03]", border: "border-[#F87171]/8" },
                      { label: "R2", value: pp.r2, color: "text-[#F87171]", bg: "bg-[#F87171]/[0.05]", border: "border-[#F87171]/10" },
                    ].map(level => (
                      <div key={level.label} className={`rounded-lg border py-2.5 px-1.5 text-center ${level.bg} ${level.border}`}>
                        <p className="text-[9px] font-bold uppercase text-[#64748B] mb-1">{level.label}</p>
                        <p className={`font-mono tabular-nums text-[11px] font-bold ${level.color}`}>${formatPrice(level.value)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Positioning Signal */}
            <div className="gradient-separator my-5" />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#CBD5E1] mb-3">Positioning</p>
              <div className={`rounded-xl border p-4 ${derivSignal.color === "bullish" ? "bg-[#22C55E]/[0.04] border-[#22C55E]/12" : "bg-[#F87171]/[0.04] border-[#F87171]/12"}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${derivSignal.color === "bullish" ? "bg-[#22C55E]/15 text-[#22C55E]" : "bg-[#F87171]/15 text-[#F87171]"}`}>
                    {derivSignal.color === "bullish" ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                    {derivSignal.signal}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-[#94A3B8]">{derivSignal.description}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatedListItem>
    </AnimatedList>
  );
}
