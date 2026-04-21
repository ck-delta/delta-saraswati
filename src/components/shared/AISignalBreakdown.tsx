'use client';

// Big AI Signal block: oversized tier pill + confidence + 3 constituent rows.
// Used inside TokenCard and at the top of the /research page.

import type { AISignalResult, SignalTier } from '@/lib/signals/composite';

const TIER_COLORS: Record<SignalTier, { bg: string; fg: string; border: string; bar: string }> = {
  'Strong Sell': { bg: 'rgba(239, 68, 68, 0.12)',  fg: '#F87171', border: 'rgba(239, 68, 68, 0.4)',  bar: '#F87171' },
  'Sell':        { bg: 'rgba(248, 113, 113, 0.09)', fg: '#F87171', border: 'rgba(248, 113, 113, 0.3)', bar: '#F87171' },
  'Neutral':     { bg: 'rgba(148, 163, 184, 0.08)', fg: '#94A3B8', border: 'rgba(148, 163, 184, 0.3)', bar: '#94A3B8' },
  'Buy':         { bg: 'rgba(74, 222, 128, 0.10)',  fg: '#4ADE80', border: 'rgba(74, 222, 128, 0.3)',  bar: '#4ADE80' },
  'Strong Buy':  { bg: 'rgba(34, 197, 94, 0.14)',   fg: '#22C55E', border: 'rgba(34, 197, 94, 0.45)', bar: '#22C55E' },
};

interface Props {
  signal: AISignalResult;
  compact?: boolean;
}

function barPct(score: number): number {
  return Math.max(0, Math.min(100, score * 10));
}

export default function AISignalBreakdown({ signal, compact = false }: Props) {
  const main = TIER_COLORS[signal.label];
  const size = compact ? 'sm' : 'md';

  return (
    <div className="flex flex-col gap-3">
      {/* --- Big pill --- */}
      <div
        className="flex items-center justify-between rounded-xl px-4 py-3"
        style={{
          background: main.bg,
          border: `1px solid ${main.border}`,
        }}
      >
        <div className="flex items-center gap-3">
          <span
            className={`${compact ? 'text-base' : 'text-lg'} font-bold tracking-wide`}
            style={{ color: main.fg }}
          >
            {signal.direction === 'bull' ? '↑' : signal.direction === 'bear' ? '↓' : '→'} {signal.label.toUpperCase()}
          </span>
          {signal.divergent && (
            <span
              title="News / Technical / Derivatives disagree by ≥4"
              className="text-sm"
              style={{ color: '#FCD34D' }}
              aria-label="divergent"
            >
              ⚠
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-2">
          <span
            className={`${compact ? 'text-xl' : 'text-3xl'} font-mono-num font-black`}
            style={{ color: main.fg }}
          >
            {signal.score.toFixed(1)}
          </span>
          <span className="text-xs opacity-60" style={{ color: main.fg }}>/10</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] uppercase tracking-wider"
        style={{ color: 'var(--text-tertiary, #8b8f99)' }}
      >
        <span>Confidence</span>
        <span className="font-mono-num" style={{ color: 'var(--text-secondary, #cbcfd7)' }}>
          {signal.confidence}%
        </span>
      </div>

      {/* --- 3 constituent rows --- */}
      <div className="flex flex-col gap-2">
        <ConstituentRow label="News"        score={signal.news.score}        tier={signal.news.label}        compact={compact} />
        <ConstituentRow label="Technical"   score={signal.technical.score}   tier={signal.technical.label}   compact={compact} note={signal.technical.regime} />
        <ConstituentRow label="Derivatives" score={signal.derivatives.score} tier={signal.derivatives.label} compact={compact} note={signal.derivatives.positioning} />
      </div>
    </div>
  );
}

function ConstituentRow({
  label,
  score,
  tier,
  compact,
  note,
}: {
  label: string;
  score: number;
  tier: SignalTier;
  compact: boolean;
  note?: string;
}) {
  const t = TIER_COLORS[tier];
  return (
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0 w-24">
        <div className={`text-[11px] ${compact ? '' : 'font-medium'}`} style={{ color: 'var(--text-secondary, #cbcfd7)' }}>
          {label}
        </div>
        {note && (
          <div className="text-[9px] opacity-60" style={{ color: t.fg }}>
            {note}
          </div>
        )}
      </div>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${barPct(score)}%`,
            background: t.bar,
            boxShadow: `0 0 6px ${t.bar}60`,
          }}
        />
      </div>
      <div className="flex-shrink-0 w-14 text-right">
        <span className="font-mono-num text-xs font-semibold" style={{ color: t.fg }}>
          {score.toFixed(1)}
        </span>
        <span className="text-[9px] opacity-60 ml-0.5" style={{ color: t.fg }}>/10</span>
      </div>
    </div>
  );
}
