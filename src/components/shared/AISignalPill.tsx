'use client';

// Small pill for top-right corner of TokenCard.
// Renders: [icon] LABEL SCORE/10

import type { SignalTier } from '@/lib/signals/composite';

const TIER_STYLE: Record<SignalTier, { bg: string; fg: string; border: string; icon: string; label: string }> = {
  'Strong Sell': { bg: 'rgba(239, 68, 68, 0.15)', fg: '#F87171', border: 'rgba(239, 68, 68, 0.4)', icon: '↓↓', label: 'STRONG SELL' },
  'Sell':        { bg: 'rgba(248, 113, 113, 0.12)', fg: '#F87171', border: 'rgba(248, 113, 113, 0.35)', icon: '↓', label: 'SELL' },
  'Neutral':     { bg: 'rgba(148, 163, 184, 0.12)', fg: '#94A3B8', border: 'rgba(148, 163, 184, 0.35)', icon: '→', label: 'NEUTRAL' },
  'Buy':         { bg: 'rgba(74, 222, 128, 0.12)', fg: '#4ADE80', border: 'rgba(74, 222, 128, 0.35)', icon: '↑', label: 'BUY' },
  'Strong Buy':  { bg: 'rgba(34, 197, 94, 0.18)', fg: '#22C55E', border: 'rgba(34, 197, 94, 0.45)', icon: '↑↑', label: 'STRONG BUY' },
};

interface Props {
  tier: SignalTier;
  score: number;
  divergent?: boolean;
  size?: 'sm' | 'md';
}

export default function AISignalPill({ tier, score, divergent = false, size = 'sm' }: Props) {
  const style = TIER_STYLE[tier];
  const isSm = size === 'sm';

  return (
    <div
      className={`inline-flex items-center gap-1.5 font-semibold ${
        isSm ? 'h-7 px-2.5 text-[10px]' : 'h-9 px-3.5 text-xs'
      }`}
      style={{
        background: style.bg,
        color: style.fg,
        border: `1px solid ${style.border}`,
        borderRadius: '999px',
        letterSpacing: '0.04em',
      }}
      title={`AI Signal: ${style.label} · ${score.toFixed(1)}/10${divergent ? ' · signals diverge' : ''}`}
    >
      <span aria-hidden style={{ fontSize: isSm ? 10 : 12, lineHeight: 1 }}>{style.icon}</span>
      <span>{style.label}</span>
      <span
        className="font-mono-num"
        style={{
          background: 'rgba(0,0,0,0.25)',
          padding: isSm ? '1px 5px' : '2px 7px',
          borderRadius: '999px',
          fontSize: isSm ? 9 : 11,
        }}
      >
        {score.toFixed(1)}
      </span>
      {divergent && (
        <span
          aria-label="Signals diverge"
          title="News / Technical / Derivatives disagree by ≥4 points"
          style={{ color: '#FCD34D', fontSize: isSm ? 10 : 12 }}
        >
          ⚠
        </span>
      )}
    </div>
  );
}
