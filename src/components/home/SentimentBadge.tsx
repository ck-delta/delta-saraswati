'use client';

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';

interface SentimentBadgeProps {
  score: number | null;
  label: string | null;
}

/** Color + label mapping by score range */
function getSentimentInfo(score: number): { label: string; color: string; bg: string } {
  if (score <= 20) return { label: 'Very Bearish', color: '#ff4d4f', bg: 'rgba(255,77,79,0.15)' };
  if (score <= 40) return { label: 'Bearish', color: '#ff8c00', bg: 'rgba(255,140,0,0.15)' };
  if (score <= 60) return { label: 'Neutral', color: '#ffd700', bg: 'rgba(255,215,0,0.15)' };
  if (score <= 80) return { label: 'Bullish', color: '#90ee90', bg: 'rgba(144,238,144,0.15)' };
  return { label: 'Very Bullish', color: '#00c076', bg: 'rgba(0,192,118,0.15)' };
}

/**
 * Small colored badge showing AI sentiment score (0-100).
 * Tooltip explains the classification on hover.
 */
export default function SentimentBadge({ score, label }: SentimentBadgeProps) {
  if (score == null) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-[#222228] px-2 py-0.5 text-xs text-[#6b7280]">
        AI Sentiment: --
      </span>
    );
  }

  const info = getSentimentInfo(score);
  const displayLabel = label ?? info.label;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          className="inline-flex cursor-default items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium transition-colors"
          style={{
            backgroundColor: info.bg,
            color: info.color,
          }}
        >
          <span className="font-mono font-bold">{score}</span>
          <span>{displayLabel}</span>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="max-w-[200px] text-xs">
            AI Sentiment Score: {score}/100 ({displayLabel}).
            Based on recent price action, volume, funding rates, and news sentiment.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
