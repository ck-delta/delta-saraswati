"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedList, AnimatedListItem } from "@/lib/motion/components";
import { formatPrice, formatPercent } from "@/lib/utils";

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
  if (rsi > 70) return "text-loss";
  if (rsi < 30) return "text-gain";
  return "text-text-primary";
}

function getRsiLabel(rsi: number): string {
  if (rsi > 70) return "Overbought";
  if (rsi < 30) return "Oversold";
  return "Neutral";
}

function IndicatorRow({
  label,
  value,
  color,
  suffix,
}: {
  label: string;
  value: string;
  color?: string;
  suffix?: string;
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-text-tertiary">{label}</span>
      <span className={`font-mono tabular-nums text-sm ${color ?? "text-text-primary"}`}>
        {value}
        {suffix && <span className="ml-1 text-xs text-text-tertiary">{suffix}</span>}
      </span>
    </div>
  );
}

function SkeletonCard() {
  return (
    <Card className="p-0">
      <CardContent className="space-y-3 py-4 px-4">
        <Skeleton className="h-4 w-24" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3.5 w-16" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function IndicatorsPanel({ ticker, indicators, isLoading }: IndicatorsPanelProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
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

  return (
    <AnimatedList fast className="grid gap-4 md:grid-cols-2">
      {/* Technical Indicators */}
      <AnimatedListItem>
        <Card className="p-0 h-full">
          <CardContent className="py-4 px-4">
            <h3 className="mb-3 text-sm font-semibold text-text-primary">Technical</h3>
            <div className="divide-y divide-border">
              {indicators?.rsi != null && (
                <IndicatorRow
                  label="RSI (14)"
                  value={indicators.rsi.toFixed(1)}
                  color={getRsiColor(indicators.rsi)}
                  suffix={getRsiLabel(indicators.rsi)}
                />
              )}
              {indicators?.macd && (
                <>
                  <IndicatorRow
                    label="MACD Value"
                    value={indicators.macd.value.toFixed(2)}
                    color={indicators.macd.value >= 0 ? "text-gain" : "text-loss"}
                  />
                  <IndicatorRow
                    label="MACD Signal"
                    value={indicators.macd.signal.toFixed(2)}
                  />
                  <IndicatorRow
                    label="MACD Histogram"
                    value={indicators.macd.histogram.toFixed(2)}
                    color={indicators.macd.histogram >= 0 ? "text-gain" : "text-loss"}
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
                <p className="py-4 text-center text-xs text-text-tertiary">
                  No indicator data available
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </AnimatedListItem>

      {/* Derivatives Data */}
      <AnimatedListItem>
        <Card className="p-0 h-full">
          <CardContent className="py-4 px-4">
            <h3 className="mb-3 text-sm font-semibold text-text-primary">Derivatives</h3>
            <div className="divide-y divide-border">
              <IndicatorRow
                label="Funding Rate"
                value={`${fundingRate >= 0 ? "+" : ""}${fundingRate.toFixed(4)}%`}
                color={fundingRate >= 0 ? "text-gain" : "text-loss"}
              />
              <IndicatorRow
                label="OI Change 6h"
                value={`${oiChange6h >= 0 ? "+" : ""}$${Math.abs(oiChange6h) >= 1e6 ? (oiChange6h / 1e6).toFixed(2) + "M" : Math.abs(oiChange6h) >= 1e3 ? (oiChange6h / 1e3).toFixed(1) + "K" : oiChange6h.toFixed(0)}`}
                color={oiChange6h >= 0 ? "text-gain" : "text-loss"}
              />
              <IndicatorRow
                label="Mark Price"
                value={`$${formatPrice(markPrice)}`}
              />
              <IndicatorRow
                label="Spot Price"
                value={spotPrice > 0 ? `$${formatPrice(spotPrice)}` : "--"}
              />
              <IndicatorRow
                label="Basis"
                value={spotPrice > 0 ? `${basis >= 0 ? "+" : ""}${basis.toFixed(3)}%` : "--"}
                color={
                  spotPrice > 0
                    ? basis >= 0
                      ? "text-gain"
                      : "text-loss"
                    : undefined
                }
              />
            </div>
          </CardContent>
        </Card>
      </AnimatedListItem>
    </AnimatedList>
  );
}
