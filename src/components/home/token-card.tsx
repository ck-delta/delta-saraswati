"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedCard } from "@/lib/motion/components";
import { useCountUp, usePriceFlash } from "@/lib/motion/hooks";
import { formatPrice } from "@/lib/utils";
import { PriceChange } from "@/components/shared/price-change";
import { FearGreedGauge } from "@/components/home/fear-greed-gauge";
import { Info, Zap } from "lucide-react";

interface TokenCardProps {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  fearGreedValue: number;
  fearGreedLabel: string;
  fundingRate: number;
  volume24h: number;
  sentimentScore: number;
  onMoreInfo: () => void;
  onTradeNow: () => void;
}

export function TokenCardSkeleton() {
  return (
    <Card className="p-0">
      <CardContent className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-3.5 w-24" />
          </div>
          <Skeleton className="size-[80px] rounded-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 flex-1" />
        </div>
      </CardContent>
    </Card>
  );
}

export function TokenCard({
  symbol,
  name,
  price,
  change24h,
  fearGreedValue,
  fearGreedLabel,
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

  const sentimentColor =
    sentimentScore > 0.6
      ? "bg-gain"
      : sentimentScore < 0.4
        ? "bg-loss"
        : "bg-text-tertiary";

  return (
    <AnimatedCard>
      <Card className="p-0 h-full">
        <CardContent className="space-y-3 pt-4">
          {/* Header: symbol/name + gauge */}
          <div className="flex items-start justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h3 className="font-heading text-base font-semibold text-text-primary">
                  {symbol}
                </h3>
                <span
                  className={`size-2 rounded-full ${sentimentColor}`}
                  title={`Sentiment: ${sentimentScore.toFixed(2)}`}
                />
              </div>
              <p className="text-xs text-text-tertiary">{name}</p>
            </div>
            <FearGreedGauge value={fearGreedValue} label={fearGreedLabel} />
          </div>

          {/* Price */}
          <div className="space-y-1">
            <p
              className={`font-mono tabular-nums text-xl font-bold text-text-primary rounded px-1 -mx-1 transition-colors ${flashClass}`}
            >
              ${displayPrice}
            </p>
            <PriceChange value={change24h} />
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-4 text-xs text-text-secondary">
            <span>
              Funding:{" "}
              <span className="font-mono tabular-nums text-text-primary">
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
              className="flex-1"
              onClick={onMoreInfo}
            >
              <Info className="size-3.5 mr-1" />
              More Info
            </Button>
            <Button
              size="sm"
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[var(--shadow-glow-sm)]"
              onClick={onTradeNow}
            >
              <Zap className="size-3.5 mr-1" />
              Trade Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </AnimatedCard>
  );
}
