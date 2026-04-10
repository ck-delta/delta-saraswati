"use client";

import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "@/components/icons";

interface SentimentBadgeProps {
  sentiment: "positive" | "negative" | "neutral";
  score?: number;
}

export function SentimentBadge({ sentiment, score }: SentimentBadgeProps) {
  const Icon =
    sentiment === "positive"
      ? TrendingUp
      : sentiment === "negative"
        ? TrendingDown
        : Minus;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold tracking-wide whitespace-nowrap",
        "border backdrop-blur-sm transition-all",
        sentiment === "positive" &&
          "bg-gain/12 text-gain-text border-gain/25 shadow-[0_0_12px_rgba(14,203,129,0.15)]",
        sentiment === "negative" &&
          "bg-loss/12 text-loss-text border-loss/25 shadow-[0_0_12px_rgba(246,70,93,0.15)]",
        sentiment === "neutral" &&
          "bg-slate-400/12 text-slate-400 border-slate-400/20 shadow-[0_0_12px_rgba(148,163,184,0.1)]"
      )}
    >
      <Icon className="size-3.5" />
      <span className="capitalize">{sentiment}</span>
      {score !== undefined && (
        <span className="text-[10px] opacity-70 font-mono tabular-nums">
          ({score.toFixed(1)})
        </span>
      )}
    </span>
  );
}
