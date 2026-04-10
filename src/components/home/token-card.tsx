"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCountUp, usePriceFlash } from "@/lib/motion/hooks";
import { formatPrice } from "@/lib/utils";
import { PriceChange } from "@/components/shared/price-change";
import { Info, Zap, TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";

interface TokenCardProps {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  fundingRate: number;
  volume24h: number;
  sentimentScore: number;
  onMoreInfo: () => void;
  onTradeNow: () => void;
}

export function TokenCardSkeleton() {
  return (
    <div className="card-3d">
      <Card className="p-0 card-elevated">
        <CardContent className="space-y-4 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-3.5 w-28" />
            </div>
            <Skeleton className="size-10 rounded-lg" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-9 flex-1 rounded-lg" />
            <Skeleton className="h-9 flex-1 rounded-lg" />
          </div>
        </CardContent>
      </Card>
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
  sentimentScore,
  onMoreInfo,
  onTradeNow,
}: TokenCardProps) {
  const displayPrice = useCountUp(price, {
    decimals: price >= 1000 ? 2 : price >= 1 ? 2 : 4,
  });
  const flashClass = usePriceFlash(price);

  const isPositive = change24h >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  const sentimentColor =
    sentimentScore > 0.6
      ? "bg-gain/20 text-gain"
      : sentimentScore < 0.4
        ? "bg-loss/20 text-loss"
        : "bg-text-tertiary/20 text-text-secondary";

  return (
    <motion.div
      className="card-3d"
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.25 } }}
      whileTap={{ scale: 0.98 }}
    >
      <Card className="p-0 h-full card-elevated group/token relative overflow-hidden">
        {/* Subtle top accent line */}
        <div className={`absolute top-0 left-0 right-0 h-[2px] ${isPositive ? "bg-gain/40" : "bg-loss/40"}`} />

        <CardContent className="space-y-3.5 pt-5 pb-4">
          {/* Header: symbol/name + trend icon */}
          <div className="flex items-start justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2.5">
                <h3 className="font-heading text-lg font-bold text-text-primary tracking-tight">
                  {symbol}
                </h3>
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${sentimentColor}`}
                  title={`Sentiment: ${sentimentScore.toFixed(2)}`}
                >
                  {sentimentScore > 0.6 ? "Bullish" : sentimentScore < 0.4 ? "Bearish" : "Neutral"}
                </span>
              </div>
              <p className="text-xs text-text-tertiary">{name}</p>
            </div>
            <div className={`flex items-center justify-center size-10 rounded-xl ${isPositive ? "bg-gain/10" : "bg-loss/10"}`}>
              <TrendIcon className={`size-5 ${isPositive ? "text-gain" : "text-loss"}`} />
            </div>
          </div>

          {/* Price */}
          <div className="space-y-1">
            <p
              className={`font-mono tabular-nums text-2xl font-bold text-text-primary rounded px-1 -mx-1 transition-colors ${flashClass}`}
            >
              ${displayPrice}
            </p>
            <PriceChange value={change24h} />
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-4 text-xs text-text-secondary">
            <span>
              Funding:{" "}
              <span className={`font-mono tabular-nums ${fundingRate >= 0 ? "text-gain" : "text-loss"}`}>
                {fundingRate >= 0 ? "+" : ""}
                {fundingRate.toFixed(4)}%
              </span>
            </span>
            <span>
              Vol:{" "}
              <span className="font-mono tabular-nums text-text-primary">
                {volume24h >= 1e9
                  ? `$${(volume24h / 1e9).toFixed(2)}B`
                  : volume24h >= 1e6
                    ? `$${(volume24h / 1e6).toFixed(1)}M`
                    : `$${(volume24h / 1e3).toFixed(0)}K`}
              </span>
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 border-border/60 hover:border-primary/30 hover:bg-primary/5 transition-all"
              onClick={onMoreInfo}
            >
              <Info className="size-3.5 mr-1" />
              More Info
            </Button>
            <Button
              size="sm"
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[var(--shadow-glow-sm)] transition-all"
              onClick={onTradeNow}
            >
              <Zap className="size-3.5 mr-1" />
              Trade Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
