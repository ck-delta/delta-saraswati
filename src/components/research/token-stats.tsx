"use client";

import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedList, AnimatedListItem } from "@/lib/motion/components";
import { formatPrice, formatCompact, formatPercent } from "@/lib/utils";
import { DollarSign, TrendingUp, BarChart3, Target } from "lucide-react";
import { motion } from "framer-motion";

interface TokenStatsProps {
  ticker: any | null;
  sparkline?: number[];
  isLoading: boolean;
}

const STAT_ICONS = [DollarSign, TrendingUp, BarChart3, Target];

// Real sparkline from 24h close prices
function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 64;
  const h = 28;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" className="opacity-60">
      <polyline points={points} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <defs>
        <linearGradient id={`spark-grad-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${points} ${w},${h}`} fill={`url(#spark-grad-${color.replace('#','')})`} />
    </svg>
  );
}

export function TokenStats({ ticker, sparkline, isLoading }: TokenStatsProps) {
  if (isLoading || !ticker) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="kpi-card rounded-2xl p-6">
            <Skeleton className="h-3 w-16 mb-3" />
            <Skeleton className="h-8 w-28" />
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
      sparkColor: "#F59E0B",
      accent: "rgba(245,158,11,0.15)",
      accentBorder: "rgba(245,158,11,0.25)",
    },
    {
      label: "24h Change",
      value: formatPercent(change),
      color: change >= 0 ? "text-gain" : "text-loss",
      sparkColor: change >= 0 ? "#0ECB81" : "#F6465D",
      accent: change >= 0 ? "rgba(14,203,129,0.12)" : "rgba(246,70,93,0.12)",
      accentBorder: change >= 0 ? "rgba(14,203,129,0.25)" : "rgba(246,70,93,0.25)",
      glow: change >= 0 ? "glow-green" : "glow-red",
    },
    {
      label: "Volume (24h)",
      value: formatCompact(volume),
      color: "text-text-primary",
      sparkColor: "#3B82F6",
      accent: "rgba(59,130,246,0.12)",
      accentBorder: "rgba(59,130,246,0.20)",
    },
    {
      label: "Open Interest",
      value: formatCompact(oi),
      color: "text-text-primary",
      sparkColor: "#A855F7",
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
              className="kpi-card rounded-2xl p-6 group/kpi cursor-default relative overflow-hidden"
              whileHover={{ y: -4, transition: { duration: 0.25 } }}
              style={{ borderColor: stat.accentBorder }}
            >
              {/* Sparkline in top-right */}
              {sparkline && sparkline.length > 1 && (
                <div className="absolute top-4 right-4 opacity-40 group-hover/kpi:opacity-60 transition-opacity">
                  <Sparkline data={sparkline} color={stat.sparkColor} />
                </div>
              )}

              {/* Icon + label */}
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="flex items-center justify-center size-7 rounded-lg"
                  style={{ backgroundColor: stat.accent, boxShadow: `0 0 8px ${stat.accent}` }}
                >
                  <Icon className="size-3.5" style={{ color: stat.accentBorder }} />
                </div>
                <span className="text-[11px] font-medium uppercase tracking-wider text-[#94A3B8]">
                  {stat.label}
                </span>
              </div>

              {/* Value — large */}
              <p className={`font-mono tabular-nums text-2xl font-bold tracking-tight ${stat.color} ${(stat as any).glow ?? ""}`}>
                {stat.value}
              </p>
            </motion.div>
          </AnimatedListItem>
        );
      })}
    </AnimatedList>
  );
}
