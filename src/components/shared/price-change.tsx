"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { formatPercent } from "@/lib/utils";

interface PriceChangeProps {
  value: number;
}

export function PriceChange({ value }: PriceChangeProps) {
  const isPositive = value >= 0;

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono tabular-nums text-sm ${
        isPositive ? "text-gain" : "text-loss"
      }`}
    >
      {isPositive ? (
        <TrendingUp className="size-3.5" />
      ) : (
        <TrendingDown className="size-3.5" />
      )}
      {formatPercent(value)}
    </span>
  );
}
