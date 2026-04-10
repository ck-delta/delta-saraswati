"use client";

import { cn } from "@/lib/utils";

interface SentimentBadgeProps {
  sentiment: "positive" | "negative" | "neutral";
  score?: number;
}

export function SentimentBadge({ sentiment, score }: SentimentBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium capitalize",
        sentiment === "positive" && "bg-gain/10 text-gain",
        sentiment === "negative" && "bg-loss/10 text-loss",
        sentiment === "neutral" && "bg-muted text-text-tertiary"
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          sentiment === "positive" && "bg-gain",
          sentiment === "negative" && "bg-loss",
          sentiment === "neutral" && "bg-text-tertiary"
        )}
      />
      {sentiment}
      {score !== undefined && (
        <span className="text-[10px] opacity-70">({score.toFixed(1)})</span>
      )}
    </span>
  );
}
