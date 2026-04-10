"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedList, AnimatedListItem } from "@/lib/motion/components";
import { formatPrice, formatCompact, formatPercent } from "@/lib/utils";

interface TokenStatsProps {
  ticker: any | null;
  isLoading: boolean;
}

export function TokenStats({ ticker, isLoading }: TokenStatsProps) {
  if (isLoading || !ticker) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-0">
            <CardContent className="space-y-2 py-3 px-4">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const price = Number(ticker.close || ticker.mark_price || 0);
  const change = Number(ticker.mark_change_24h || ticker.ltp_change_24h || 0);
  const volume = Number(ticker.turnover_usd || ticker.volume || 0);
  const oi = Number(ticker.oi_value_usd || ticker.oi || 0);

  const stats = [
    { label: "Price", value: `$${formatPrice(price)}` },
    {
      label: "24h Change",
      value: formatPercent(change),
      color: change >= 0 ? "text-gain" : "text-loss",
    },
    { label: "Volume (24h)", value: formatCompact(volume) },
    { label: "Open Interest", value: formatCompact(oi) },
  ];

  return (
    <AnimatedList fast className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((stat) => (
        <AnimatedListItem key={stat.label}>
          <Card className="p-0">
            <CardContent className="space-y-1 py-3 px-4">
              <p className="text-xs text-text-tertiary">{stat.label}</p>
              <p
                className={`font-mono tabular-nums text-sm font-semibold ${
                  stat.color ?? "text-text-primary"
                }`}
              >
                {stat.value}
              </p>
            </CardContent>
          </Card>
        </AnimatedListItem>
      ))}
    </AnimatedList>
  );
}
