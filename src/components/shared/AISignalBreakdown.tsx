'use client';

// AI Signal block: split 3-column pill (label | tier | score+bars), plus 3
// per-constituent rows with icons. Used inside TokenCard and at the top of
// /research.

import { Newspaper, Activity, Layers } from 'lucide-react';
import type { ComponentType, SVGProps } from 'react';
import SignalBars from './SignalBars';
import type { AISignalResult, SignalTier } from '@/lib/signals/composite';

const TIER_COLORS: Record<SignalTier, { bg: string; fg: string; border: string; bar: string; glow: string }> = {
  'Strong Sell': { bg: 'rgba(239, 68, 68, 0.14)',  fg: '#F87171', border: 'rgba(239, 68, 68, 0.45)',  bar: '#F87171', glow: 'rgba(239, 68, 68, 0.25)' },
  'Sell':        { bg: 'rgba(248, 113, 113, 0.10)', fg: '#F87171', border: 'rgba(248, 113, 113, 0.35)', bar: '#F87171', glow: 'rgba(248, 113, 113, 0.15)' },
  'Neutral':     { bg: 'rgba(148, 163, 184, 0.08)', fg: '#CBD5E1', border: 'rgba(148, 163, 184, 0.28)', bar: '#94A3B8', glow: 'rgba(148, 163, 184, 0.12)' },
  'Buy':         { bg: 'rgba(74, 222, 128, 0.12)',  fg: '#4ADE80', border: 'rgba(74, 222, 128, 0.35)',  bar: '#4ADE80', glow: 'rgba(74, 222, 128, 0.18)' },
  'Strong Buy':  { bg: 'rgba(34, 197, 94, 0.16)',   fg: '#22C55E', border: 'rgba(34, 197, 94, 0.50)', bar: '#22C55E', glow: 'rgba(34, 197, 94, 0.30)' },
};

interface Props {
  signal: AISignalResult;
  compact?: boolean;
  /** Previous composite score for delta indicator (optional). */
  prevScore?: number | null;
}

function barPct(score: number): number {
  return Math.max(0, Math.min(100, score * 10));
}

export default function AISignalBreakdown({
  signal,
  compact = false,
  prevScore = null,
}: Props) {
  const main = TIER_COLORS[signal.label];

  const delta =
    prevScore != null && Math.abs(signal.score - prevScore) >= 0.05
      ? signal.score - prevScore
      : null;

  return (
    <div className="flex flex-col gap-3">
      {/* --- Split AI Signal pill: 3 sections inside one rounded rectangle --- */}
      <div
        className="flex items-stretch rounded-xl overflow-hidden"
        style={{
          background: `linear-gradient(180deg, ${main.bg} 0%, rgba(0,0,0,0.15) 100%)`,
          border: `1px solid ${main.border}`,
          boxShadow: `0 0 0 1px rgba(255,255,255,0.015) inset, 0 12px 24px -12px ${main.glow}`,
        }}
        title={`AI Signal: ${signal.label} · ${signal.score.toFixed(1)}/10 · ${signal.confidence}% confidence`}
      >
        {/* ──── Section 1: AI SIGNAL label ──── */}
        <div
          className={`flex items-center gap-1.5 px-3 ${compact ? 'py-2.5' : 'py-3'} flex-shrink-0`}
          style={{ background: 'rgba(255,255,255,0.02)' }}
        >
          <span className="text-[11px] leading-none" style={{ color: main.fg }}>✦</span>
          <span
            className="text-[9px] uppercase tracking-[0.14em] font-bold whitespace-nowrap"
            style={{ color: main.fg, opacity: 0.85 }}
          >
            AI Signal
          </span>
        </div>

        {/* ──── Section 2: Tier label (flex-1 center) ──── */}
        <div
          className={`flex-1 flex items-center justify-center gap-2 px-2 ${compact ? 'py-2.5' : 'py-3'}`}
          style={{ borderLeft: `1px solid ${main.border}`, borderRight: `1px solid ${main.border}` }}
        >
          <span
            className={`${compact ? 'text-base' : 'text-lg'} font-black tracking-wide`}
            style={{ color: main.fg, letterSpacing: '0.02em' }}
          >
            {signal.label.toUpperCase()}
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

        {/* ──── Section 3: Score + confidence bars ──── */}
        <div
          className={`flex items-center gap-2 px-3 ${compact ? 'py-2.5' : 'py-3'} flex-shrink-0`}
          style={{ background: 'rgba(0,0,0,0.15)' }}
        >
          <div className="flex items-baseline gap-0.5">
            <span
              className={`${compact ? 'text-xl' : 'text-2xl'} font-mono-num font-black leading-none`}
              style={{ color: main.fg }}
            >
              {signal.score.toFixed(1)}
            </span>
            <span className="text-[10px] opacity-50" style={{ color: main.fg }}>/10</span>
          </div>
          {/* Confidence bars icon */}
          <div
            className="flex items-center"
            title={`Confidence ${signal.confidence}% — agreement across News/Technical/Derivatives`}
          >
            <SignalBars percent={signal.confidence} color={main.fg} size={14} />
          </div>
        </div>
      </div>

      {/* --- Delta indicator row (tiny, when score changed since last fetch) --- */}
      {delta != null && (
        <div className="flex items-center justify-end -mt-1">
          <span
            className="font-mono-num text-[10px] font-semibold"
            style={{ color: delta > 0 ? '#4ADE80' : '#F87171' }}
            title={`Score changed by ${delta > 0 ? '+' : ''}${delta.toFixed(2)} since last refresh`}
          >
            {delta > 0 ? '↑' : '↓'}{Math.abs(delta).toFixed(2)} since last refresh
          </span>
        </div>
      )}

      {/* --- Three constituent rows, each with an icon --- */}
      <div className="flex flex-col gap-2">
        <ConstituentRow icon={Newspaper} label="News"        score={signal.news.score}        tier={signal.news.label}        compact={compact} />
        <ConstituentRow icon={Activity}  label="Technical"   score={signal.technical.score}   tier={signal.technical.label}   compact={compact} />
        <ConstituentRow icon={Layers}    label="Derivatives" score={signal.derivatives.score} tier={signal.derivatives.label} compact={compact} />
      </div>
    </div>
  );
}

function ConstituentRow({
  icon: Icon,
  label,
  score,
  tier,
  compact,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  score: number;
  tier: SignalTier;
  compact: boolean;
}) {
  const t = TIER_COLORS[tier];
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5 flex-shrink-0 w-24">
        <Icon className="h-3 w-3 opacity-70" style={{ color: t.fg }} />
        <div className={`text-[11px] ${compact ? '' : 'font-medium'}`} style={{ color: 'var(--text-secondary, #cbcfd7)' }}>
          {label}
        </div>
      </div>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
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
