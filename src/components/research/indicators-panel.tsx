"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedList, AnimatedListItem } from "@/lib/motion/components";
import { formatPrice } from "@/lib/utils";
import { Activity, Layers } from "@/components/icons";
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

function getRsiColor(rsi: number): string {
  if (rsi > 70) return "text-loss-text";
  if (rsi < 30) return "text-gain-text";
  return "text-text-primary";
}

function getRsiLabel(rsi: number): { text: string; color: string; bg: string } {
  if (rsi > 70) return { text: "Overbought", color: "text-loss-text", bg: "bg-loss/10" };
  if (rsi < 30) return { text: "Oversold", color: "text-gain-text", bg: "bg-gain/10" };
  return { text: "Neutral", color: "text-text-tertiary", bg: "bg-white/[0.04]" };
}

function IndicatorRow({
  label,
  value,
  color,
  badge,
}: {
  label: string;
  value: string;
  color?: string;
  badge?: { text: string; color: string; bg: string };
}) {
  return (
    <div className="flex items-center justify-between py-2.5 group/row">
      <span className="text-[12px] text-text-tertiary group-hover/row:text-text-secondary transition-colors">
        {label}
      </span>
      <div className="flex items-center gap-2">
        {badge && (
          <span className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${badge.bg} ${badge.color}`}>
            {badge.text}
          </span>
        )}
        <span className={`font-mono tabular-nums text-[13px] font-semibold ${color ?? "text-text-primary"}`}>
          {value}
        </span>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="kpi-card rounded-xl p-5">
      <Skeleton className="h-5 w-28 mb-4" />
      <div className="space-y-3">
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

  const rsiInfo = indicators?.rsi != null ? getRsiLabel(indicators.rsi) : null;

  return (
    <AnimatedList fast className="grid gap-5 md:grid-cols-2">
      {/* Technical Indicators */}
      <AnimatedListItem>
        <motion.div
          className="kpi-card rounded-xl h-full"
          whileHover={{ y: -2, transition: { duration: 0.2 } }}
        >
          <div className="p-5">
            {/* Header */}
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex items-center justify-center size-7 rounded-lg bg-info/10">
                <Activity className="size-3.5 text-info" />
              </div>
              <h3 className="text-sm font-bold text-text-primary tracking-tight">Technical</h3>
            </div>

            <div className="space-y-0 divide-y divide-white/[0.04]">
              {indicators?.rsi != null && (
                <IndicatorRow
                  label="RSI (14)"
                  value={indicators.rsi.toFixed(1)}
                  color={getRsiColor(indicators.rsi)}
                  badge={rsiInfo || undefined}
                />
              )}
              {indicators?.macd && (
                <>
                  <IndicatorRow
                    label="MACD Value"
                    value={indicators.macd.value.toFixed(2)}
                    color={indicators.macd.value >= 0 ? "text-gain-text" : "text-loss-text"}
                  />
                  <IndicatorRow label="MACD Signal" value={indicators.macd.signal.toFixed(2)} />
                  <IndicatorRow
                    label="MACD Histogram"
                    value={indicators.macd.histogram.toFixed(2)}
                    color={indicators.macd.histogram >= 0 ? "text-gain-text" : "text-loss-text"}
                  />
                </>
              )}
              {indicators?.sma20 != null && (
                <IndicatorRow label="SMA 20" value={`$${formatPrice(indicators.sma20)}`} />
              )}
              {indicators?.sma50 != null && (
                <IndicatorRow label="SMA 50" value={`$${formatPrice(indicators.sma50)}`} />
              )}
              {indicators?.sma200 != null && (
                <IndicatorRow label="SMA 200" value={`$${formatPrice(indicators.sma200)}`} />
              )}
              {!indicators && (
                <p className="py-6 text-center text-xs text-text-tertiary">
                  No indicator data available
                </p>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatedListItem>

      {/* Derivatives Data */}
      <AnimatedListItem>
        <motion.div
          className="kpi-card rounded-xl h-full"
          whileHover={{ y: -2, transition: { duration: 0.2 } }}
        >
          <div className="p-5">
            {/* Header */}
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex items-center justify-center size-7 rounded-lg bg-primary/10">
                <Layers className="size-3.5 text-primary" />
              </div>
              <h3 className="text-sm font-bold text-text-primary tracking-tight">Derivatives</h3>
            </div>

            <div className="space-y-0 divide-y divide-white/[0.04]">
              <IndicatorRow
                label="Funding Rate"
                value={`${fundingRate >= 0 ? "+" : ""}${fundingRate.toFixed(4)}%`}
                color={fundingRate >= 0 ? "text-gain-text" : "text-loss-text"}
              />
              <IndicatorRow
                label="OI Change 6h"
                value={`${oiChange6h >= 0 ? "+" : ""}$${Math.abs(oiChange6h) >= 1e6 ? (oiChange6h / 1e6).toFixed(2) + "M" : Math.abs(oiChange6h) >= 1e3 ? (oiChange6h / 1e3).toFixed(1) + "K" : oiChange6h.toFixed(0)}`}
                color={oiChange6h >= 0 ? "text-gain-text" : "text-loss-text"}
              />
              <IndicatorRow label="Mark Price" value={`$${formatPrice(markPrice)}`} />
              <IndicatorRow
                label="Spot Price"
                value={spotPrice > 0 ? `$${formatPrice(spotPrice)}` : "--"}
              />
              <IndicatorRow
                label="Basis"
                value={spotPrice > 0 ? `${basis >= 0 ? "+" : ""}${basis.toFixed(3)}%` : "--"}
                color={spotPrice > 0 ? (basis >= 0 ? "text-gain-text" : "text-loss-text") : undefined}
              />
            </div>
          </div>
        </motion.div>
      </AnimatedListItem>
    </AnimatedList>
  );
}
