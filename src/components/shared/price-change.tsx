"use client";

import { TrendingUp, TrendingDown } from "@/components/icons";
import { formatPercent } from "@/lib/utils";

interface PriceChangeProps {
  value: number;
  asPill?: boolean;
}

export function PriceChange({ value, asPill = false }: PriceChangeProps) {
  const isPositive = value >= 0;

  if (asPill) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-bold ${
          isPositive
            ? "bg-gain/15 text-gain"
            : "bg-loss/15 text-loss"
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
