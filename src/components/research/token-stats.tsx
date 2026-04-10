"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedList, AnimatedListItem } from "@/lib/motion/components";
import { formatPrice, formatCompact, formatPercent } from "@/lib/utils";
import { DollarSign, TrendingUp, BarChart3, Target } from "@/components/icons";
import { motion } from "framer-motion";

interface TokenStatsProps {
  ticker: any | null;
  isLoading: boolean;
}

const STAT_ICONS = [DollarSign, TrendingUp, BarChart3, Target];

export function TokenStats({ ticker, isLoading }: TokenStatsProps) {
  if (isLoading || !ticker) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="kpi-card rounded-xl p-5">
            <Skeleton className="h-3 w-16 mb-3" />
            <Skeleton className="h-7 w-28" />
          </div>
        ))}
      </div>
    );
  }

  const price = Number(ticker.close || ticker.mark_price || 0);
  const change = Number(ticker.mark_change_24h || ticker.ltp_change_24h || 0);
  const volume = Number(ticker.turnover_usd || ticker.volume || 0);
  const oi = Number(ticker.oi_value_usd || ticker.oi || 0);

  const stats = [
    {
      label: "Price",
      value: `$${formatPrice(price)}`,
      color: "text-text-primary",
      accent: "rgba(245,158,11,0.15)",
      accentBorder: "rgba(245,158,11,0.25)",
    },
    {
      label: "24h Change",
      value: formatPercent(change),
      color: change >= 0 ? "text-gain-text" : "text-loss-text",
      accent: change >= 0 ? "rgba(14,203,129,0.12)" : "rgba(246,70,93,0.12)",
      accentBorder: change >= 0 ? "rgba(14,203,129,0.25)" : "rgba(246,70,93,0.25)",
    },
    {
      label: "Volume (24h)",
      value: formatCompact(volume),
      color: "text-text-primary",
      accent: "rgba(59,130,246,0.12)",
      accentBorder: "rgba(59,130,246,0.20)",
    },
    {
      label: "Open Interest",
      value: formatCompact(oi),
      color: "text-text-primary",
      accent: "rgba(168,85,247,0.12)",
      accentBorder: "rgba(168,85,247,0.20)",
    },
  ];

  return (
    <AnimatedList fast className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {stats.map((stat, idx) => {
        const Icon = STAT_ICONS[idx];
        return (
          <AnimatedListItem key={stat.label}>
            <motion.div
              className="kpi-card rounded-xl p-5 group/kpi cursor-default"
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              style={{
                borderColor: stat.accentBorder,
              }}
            >
              {/* Icon + label */}
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="flex items-center justify-center size-6 rounded-lg"
                  style={{ backgroundColor: stat.accent }}
                >
                  <Icon className="size-3" style={{ color: stat.accentBorder }} />
                </div>
                <span className="text-[11px] font-medium uppercase tracking-wider text-text-tertiary">
                  {stat.label}
                </span>
              </div>

              {/* Value */}
              <p
                className={`font-mono tabular-nums text-xl font-bold tracking-tight ${stat.color}`}
              >
                {stat.value}
              </p>
            </motion.div>
          </AnimatedListItem>
        );
      })}
    </AnimatedList>
  );
}
