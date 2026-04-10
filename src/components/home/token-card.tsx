"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCountUp, usePriceFlash } from "@/lib/motion/hooks";
import { PriceChange } from "@/components/shared/price-change";
import { Info, Zap } from "@/components/icons";
import { motion } from "framer-motion";

// Brand colors for top tokens
const TOKEN_BRAND: Record<string, { color: string; bg: string; glow: string; icon: string }> = {
  BTCUSD: {
    color: "#F7931A",
    bg: "rgba(247,147,26,0.12)",
    glow: "0 0 16px rgba(247,147,26,0.20)",
    icon: "₿",
  },
  ETHUSD: {
    color: "#627EEA",
    bg: "rgba(98,126,234,0.12)",
    glow: "0 0 16px rgba(98,126,234,0.20)",
    icon: "Ξ",
  },
  PAXGUSD: {
    color: "#E5B73B",
    bg: "rgba(229,183,59,0.12)",
    glow: "0 0 16px rgba(229,183,59,0.20)",
    icon: "Au",
  },
  SOLUSD: {
    color: "#9945FF",
    bg: "rgba(153,69,255,0.12)",
    glow: "0 0 16px rgba(153,69,255,0.20)",
    icon: "◎",
  },
};

const DEFAULT_BRAND = {
  color: "#F59E0B",
  bg: "rgba(245,158,11,0.12)",
  glow: "0 0 16px rgba(245,158,11,0.20)",
  icon: "●",
};

interface TokenCardProps {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  fundingRate: number;
  volume24h: number;
  maxVolume: number;
  sentimentScore: number;
  sparklineData?: number[];
  onMoreInfo: () => void;
  onTradeNow: () => void;
}

export function TokenCardSkeleton() {
  return (
    <div className="card-3d">
      <Card className="p-0 card-elevated">
        <CardContent className="flex flex-col gap-5 pt-7 pb-6 px-6">
          <div className="flex items-center gap-3">
            <Skeleton className="size-12 rounded-2xl" />
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
          <div className="space-y-2.5">
            <Skeleton className="h-9 w-36" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="h-px bg-white/[0.04]" />
          <div className="space-y-3">
            <div className="flex justify-between"><Skeleton className="h-3.5 w-20" /><Skeleton className="h-3.5 w-16" /></div>
            <div className="flex justify-between"><Skeleton className="h-3.5 w-20" /><Skeleton className="h-3.5 w-16" /></div>
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between"><Skeleton className="h-3 w-20" /><Skeleton className="h-3 w-12" /></div>
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
          <div className="flex gap-2.5 pt-1">
            <Skeleton className="h-10 flex-1 rounded-xl" />
            <Skeleton className="h-10 flex-1 rounded-xl" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Mini sparkline SVG — renders real price data or fallback
function MiniSparkline({ data, positive, brandColor }: { data: number[]; positive: boolean; brandColor: string }) {
  const points = useMemo(() => {
    const values = data.length >= 2 ? data : (positive ? [28, 24, 26, 20, 22, 16, 12] : [12, 16, 14, 20, 18, 24, 28]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const w = 60;
    const h = 32;
    const pad = 2;
    return values.map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = pad + ((max - v) / range) * (h - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
  }, [data, positive]);

  return (
    <svg width="60" height="32" viewBox="0 0 60 32" fill="none" className="opacity-50">
      <polyline points={points} stroke={brandColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <polygon points={`0,32 ${points} 60,32`} fill={brandColor} fillOpacity="0.15" />
    </svg>
  );
}

// Volume bar — horizontal fill relative to max volume
function VolumeBar({ volume, maxVolume, brandColor }: { volume: number; maxVolume: number; brandColor: string }) {
  const pct = maxVolume > 0 ? Math.max((volume / maxVolume) * 100, 8) : 30;
  return (
    <div className="h-1.5 w-full rounded-full bg-white/[0.04] overflow-hidden">
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: brandColor, opacity: 0.5 }} />
    </div>
  );
}

// AI Sentiment slider — score out of 10
function SentimentSlider({ score, brandColor }: { score: number; brandColor: string }) {
  const value = Math.max(0, Math.min(10, score * 10));
  const pct = (value / 10) * 100;
  const label = value >= 7 ? "Bullish" : value <= 3 ? "Bearish" : "Neutral";
  const labelColor = value >= 7 ? "text-gain" : value <= 3 ? "text-loss" : "text-text-tertiary";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-text-tertiary uppercase tracking-wider">AI Sentiment</span>
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-semibold ${labelColor}`}>{label}</span>
          <span className="font-mono tabular-nums text-xs font-bold text-text-primary">{value.toFixed(1)}<span className="text-text-tertiary/50">/10</span></span>
        </div>
      </div>
      <div className="relative h-1.5 w-full rounded-full bg-white/[0.04] overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${value <= 3 ? "#F6465D" : value <= 5 ? "#636366" : brandColor}, ${value <= 3 ? "#FF6B7A" : value <= 5 ? "#8E8E93" : brandColor})`,
            boxShadow: `0 0 8px ${value >= 7 ? brandColor : value <= 3 ? "rgba(246,70,93,0.3)" : "transparent"}`,
          }}
        />
        {/* Dot indicator at end of fill */}
        <div
          className="absolute top-1/2 -translate-y-1/2 size-2.5 rounded-full border-2 border-background transition-all duration-700"
          style={{
            left: `calc(${pct}% - 5px)`,
            backgroundColor: value <= 3 ? "#F6465D" : value <= 5 ? "#8E8E93" : brandColor,
          }}
        />
      </div>
    </div>
  );
}

export function TokenCard({
  symbol,
  name,
  price,
  change24h,
  fundingRate,
  volume24h,
  maxVolume,
  sentimentScore,
  sparklineData,
  onMoreInfo,
  onTradeNow,
}: TokenCardProps) {
  const displayPrice = useCountUp(price, {
    decimals: price >= 1000 ? 2 : price >= 1 ? 2 : 4,
  });
  const flashClass = usePriceFlash(price);

  const isPositive = change24h >= 0;
  const brand = TOKEN_BRAND[symbol] || DEFAULT_BRAND;

  return (
    <motion.div
      className="card-3d"
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -6, transition: { duration: 0.25 } }}
      whileTap={{ scale: 0.98 }}
    >
      <Card className="p-0 h-full card-elevated group/token relative overflow-hidden token-card-gradient">
        {/* Brand-colored top accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ backgroundColor: brand.color, opacity: 0.5 }} />

        <CardContent className="flex flex-col gap-5 pt-7 pb-6 px-6">
          {/* Header: icon + symbol/name + sparkline */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {/* Token icon with brand glow */}
              <div
                className="flex items-center justify-center size-12 rounded-2xl text-lg font-bold shrink-0 token-icon-ring"
                style={{
                  backgroundColor: brand.bg,
                  color: brand.color,
                  boxShadow: brand.glow,
                }}
              >
                {brand.icon}
              </div>
              <div className="space-y-0.5 min-w-0">
                <h3 className="font-heading text-base font-bold text-text-primary tracking-tight">
                  {symbol}
                </h3>
                <p className="text-[11px] text-text-tertiary truncate">{name}</p>
              </div>
            </div>
            {/* Mini sparkline */}
            <div className="flex items-center">
              <MiniSparkline data={sparklineData || []} positive={isPositive} brandColor={brand.color} />
            </div>
          </div>

          {/* Price — largest element */}
          <div className="space-y-2.5">
            <p
              className={`font-mono tabular-nums text-[28px] leading-none font-bold text-text-primary rounded px-1 -mx-1 transition-colors ${flashClass}`}
            >
              ${displayPrice}
            </p>
            <PriceChange value={change24h} asPill />
          </div>

          {/* Divider */}
          <div className="gradient-separator" />

          {/* Stats grid — funding & volume */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-tertiary">Funding Rate</span>
              <span className={`font-mono tabular-nums font-semibold ${fundingRate >= 0 ? "text-gain" : "text-loss"}`}>
                {fundingRate >= 0 ? "+" : ""}{fundingRate.toFixed(4)}%
              </span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-tertiary">Volume (24h)</span>
                <span className="font-mono tabular-nums font-semibold text-text-primary">
                  {volume24h >= 1e9
                    ? `$${(volume24h / 1e9).toFixed(2)}B`
                    : volume24h >= 1e6
                      ? `$${(volume24h / 1e6).toFixed(1)}M`
                      : `$${(volume24h / 1e3).toFixed(0)}K`}
                </span>
              </div>
              <VolumeBar volume={volume24h} maxVolume={maxVolume} brandColor={brand.color} />
            </div>
          </div>

          {/* AI Sentiment Slider */}
          <SentimentSlider score={sentimentScore} brandColor={brand.color} />

          {/* Action buttons */}
          <div className="flex gap-2.5 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-10 rounded-xl border-border/50 hover:border-primary/30 hover:bg-primary/5 font-semibold transition-all"
              onClick={onMoreInfo}
            >
              <Info className="size-3.5 mr-1.5" />
              More Info
            </Button>
            <Button
              size="sm"
              className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground font-semibold trade-btn-shine hover:bg-primary/90 hover:shadow-[var(--shadow-glow-md)] transition-all"
              onClick={onTradeNow}
            >
              <Zap className="size-3.5 mr-1.5" />
              Trade Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
