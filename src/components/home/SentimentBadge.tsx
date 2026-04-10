'use client';

interface SentimentBadgeProps {
  score: number | null;
  label: string | null;
}

/** Color + label mapping by score range */
function getSentimentInfo(score: number): {
  label: string;
  colorClass: string;
  bgClass: string;
} {
  if (score <= 20)
    return {
      label: 'Very Bearish',
      colorClass: 'text-[#ef4444]',
      bgClass: 'bg-[#ef4444]/10',
    };
  if (score <= 40)
    return {
      label: 'Bearish',
      colorClass: 'text-[#f97316]',
      bgClass: 'bg-[#f97316]/10',
    };
  if (score <= 60)
    return {
      label: 'Neutral',
      colorClass: 'text-[#8b8f99]',
      bgClass: 'bg-[#8b8f99]/10',
    };
  if (score <= 80)
    return {
      label: 'Bullish',
      colorClass: 'text-[#22c55e]',
      bgClass: 'bg-[#22c55e]/10',
    };
  return {
    label: 'Very Bullish',
    colorClass: 'text-[#22c55e]',
    bgClass: 'bg-[#22c55e]/10',
  };
}

/**
 * Simple colored pill badge showing AI sentiment classification.
 * Score 0-100 maps to Very Bearish / Bearish / Neutral / Bullish / Very Bullish.
 */
export default function SentimentBadge({ score, label }: SentimentBadgeProps) {
  if (score == null) {
    return (
      <span className="inline-flex items-center rounded-full bg-[#8b8f99]/10 px-2.5 py-0.5 text-xs font-medium text-[#555a65]">
        &mdash;
      </span>
    );
  }

  const info = getSentimentInfo(score);
  const displayLabel = label ?? info.label;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${info.bgClass} ${info.colorClass}`}
    >
      <span className="font-mono font-bold">{score}</span>
      <span>{displayLabel}</span>
    </span>
  );
}
