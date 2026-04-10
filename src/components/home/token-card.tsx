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
  onMoreInfo: () => void;
  onTradeNow: () => void;
}

export function TokenCardSkeleton() {
  return (
    <div className="card-3d">
      <Card className="p-0 card-elevated">
        <CardContent className="space-y-5 pt-6 pb-5 px-5">
          <div className="flex items-center gap-3">
            <Skeleton className="size-12 rounded-2xl" />
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-9 w-36" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
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

// Mini sparkline SVG — generates a simple 7-point line
function MiniSparkline({ positive, brandColor }: { positive: boolean; brandColor: string }) {
  const points = useMemo(() => {
    // Deterministic-looking sparkline based on direction
    const up = [28, 24, 26, 20, 22, 16, 12];
    const down = [12, 16, 14, 20, 18, 24, 28];
    const data = positive ? up : down;
    return data.map((y, i) => `${i * 10},${y}`).join(" ");
  }, [positive]);

  return (
    <svg width="60" height="32" viewBox="0 0 60 32" fill="none" className="opacity-50">
      <polyline
        points={points}
        stroke={brandColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <defs>
        <linearGradient id={`spark-${positive}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={brandColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={brandColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,32 ${points} 60,32`}
        fill={`url(#spark-${positive})`}
      />
    </svg>
  );
}

// Volume bar — scales relative to max volume
function VolumeBar({ volume, maxVolume, brandColor }: { volume: number; maxVolume: number; brandColor: string }) {
  const pct = maxVolume > 0 ? Math.max((volume / maxVolume) * 100, 8) : 30;
  return (
    <div className="flex items-center gap-2">
      <div className="h-3 w-1 rounded-full" style={{ height: `${Math.max(pct * 0.18, 6)}px`, backgroundColor: brandColor, opacity: 0.6 }} />
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

        <CardContent className="space-y-4 pt-6 pb-5 px-5">
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
              <MiniSparkline positive={isPositive} brandColor={brand.color} />
            </div>
          </div>

          {/* Price — largest element */}
          <div className="space-y-2">
            <p
              className={`font-mono tabular-nums text-[28px] leading-none font-bold text-text-primary rounded px-1 -mx-1 transition-colors ${flashClass}`}
            >
              ${displayPrice}
            </p>
            {/* Change as a pill */}
            <PriceChange value={change24h} asPill />
          </div>

          {/* Meta row with volume bar */}
          <div className="flex items-center gap-4 text-xs text-text-secondary">
            <span className="flex items-center gap-1">
              Funding:{" "}
              <span className={`font-mono tabular-nums font-medium ${fundingRate >= 0 ? "text-gain" : "text-loss"}`}>
                {fundingRate >= 0 ? "+" : ""}
                {fundingRate.toFixed(4)}%
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <VolumeBar volume={volume24h} maxVolume={maxVolume} brandColor={brand.color} />
              <span>Vol:</span>
              <span className="font-mono tabular-nums font-medium text-text-primary">
                {volume24h >= 1e9
                  ? `$${(volume24h / 1e9).toFixed(2)}B`
                  : volume24h >= 1e6
                    ? `$${(volume24h / 1e6).toFixed(1)}M`
                    : `$${(volume24h / 1e3).toFixed(0)}K`}
              </span>
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2.5 pt-0.5">
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
