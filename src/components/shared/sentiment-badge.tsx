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
        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
        "border backdrop-blur-sm transition-all",
        sentiment === "positive" &&
          "bg-gain/8 text-gain-text border-gain/15 shadow-[0_0_8px_rgba(14,203,129,0.06)]",
        sentiment === "negative" &&
          "bg-loss/8 text-loss-text border-loss/15 shadow-[0_0_8px_rgba(246,70,93,0.06)]",
        sentiment === "neutral" &&
          "bg-white/[0.03] text-text-tertiary border-white/[0.06]"
      )}
    >
      <Icon className="size-3" />
      <span className="capitalize">{sentiment}</span>
      {score !== undefined && (
        <span className="text-[10px] opacity-60 font-mono tabular-nums">
          ({score.toFixed(1)})
        </span>
      )}
    </span>
  );
}
