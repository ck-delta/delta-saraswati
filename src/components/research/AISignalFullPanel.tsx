'use client';

// Big AI Signal panel for /research.
//
// Sections:
//  1. Composite pill (via AISignalBreakdown)
//  2. "Things to Note" — 3-5 Groq bullets (from /api/ai-signal response)
//  3. "Full breakdown" — grouped indicator list (Momentum / Trend / Volume /
//     Patterns / Derivatives / News), WITHOUT numeric scores. Each row shows
//     a directional arrow + short verdict. Neutrals rendered dimmed.
//
// Panel itself gets a tier-colored halo: green glow on Buy, red on Sell,
// stronger for Strong Buy/Sell. Neutral → no halo.

import { useEffect, useState } from 'react';
import AISignalBreakdown from '@/components/shared/AISignalBreakdown';
import type { AISignalResult, SignalTier } from '@/lib/signals/composite';
import type { TechScoreResult, IndicatorContribution } from '@/lib/signals/tech-score';
import type { DerivScoreResult } from '@/lib/signals/deriv-score';
import type { NewsScoreResult } from '@/lib/signals/news-score';
import type { ThingToNote } from '@/lib/ai/things-to-note';

interface AISignalPayload {
  symbol: string;
  composite: AISignalResult;
  breakdown: {
    news: NewsScoreResult;
    technical: TechScoreResult;
    derivatives: DerivScoreResult;
  };
  thingsToNote?: ThingToNote[];
}

interface Props {
  symbol: string;
}

const TIER_HALO: Record<SignalTier, string> = {
  'Strong Sell': '0 0 60px -10px rgba(239, 68, 68, 0.55), 0 24px 60px -24px rgba(239, 68, 68, 0.40)',
  'Sell':        '0 0 40px -12px rgba(248, 113, 113, 0.35), 0 20px 44px -24px rgba(248, 113, 113, 0.25)',
  'Neutral':     '0 20px 48px -28px rgba(0, 0, 0, 0.45)',
  'Buy':         '0 0 40px -12px rgba(74, 222, 128, 0.38), 0 20px 44px -24px rgba(74, 222, 128, 0.28)',
  'Strong Buy':  '0 0 60px -10px rgba(34, 197, 94, 0.55), 0 24px 60px -24px rgba(34, 197, 94, 0.40)',
};

const TIER_BORDER: Record<SignalTier, string> = {
  'Strong Sell': 'rgba(239, 68, 68, 0.35)',
  'Sell':        'rgba(248, 113, 113, 0.22)',
  'Neutral':     'rgba(255, 255, 255, 0.06)',
  'Buy':         'rgba(74, 222, 128, 0.22)',
  'Strong Buy':  'rgba(34, 197, 94, 0.35)',
};

const NOTE_KIND_STYLE: Record<ThingToNote['kind'], { bg: string; fg: string; label: string }> = {
  technical:   { bg: 'rgba(88, 167, 240, 0.12)',  fg: '#58A7F0', label: 'TECHNICAL' },
  news:        { bg: 'rgba(34, 197, 94, 0.12)',   fg: '#22C55E', label: 'NEWS' },
  derivatives: { bg: 'rgba(167, 139, 250, 0.12)', fg: '#A78BFA', label: 'DERIVATIVES' },
  pattern:     { bg: 'rgba(244, 114, 182, 0.12)', fg: '#F472B6', label: 'PATTERN' },
  options:     { bg: 'rgba(252, 211, 77, 0.12)',  fg: '#FCD34D', label: 'OPTIONS' },
  divergence:  { bg: 'rgba(252, 211, 77, 0.14)',  fg: '#FCD34D', label: 'DIVERGENCE' },
};

const TONE_COLOR: Record<ThingToNote['tone'], string> = {
  bullish: '#4ADE80',
  bearish: '#F87171',
  neutral: '#94A3B8',
};

export default function AISignalFullPanel({ symbol }: Props) {
  const [data, setData] = useState<AISignalPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/ai-signal/${symbol}`);
        if (!res.ok) throw new Error(`AI signal ${res.status}`);
        const json: AISignalPayload = await res.json();
        if (!cancelled) { setData(json); setError(null); }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Signal unavailable');
      }
    }
    load();
    const id = setInterval(load, 60_000);
    return () => { cancelled = true; clearInterval(id); };
  }, [symbol]);

  if (error) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-b from-[#131418] to-[#101114] p-6 text-center text-sm text-[#8b8f99]">
        AI Signal temporarily unavailable — {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-b from-[#131418] to-[#101114] p-6">
        <div className="h-16 w-full animate-pulse rounded-xl bg-white/[0.04]" />
        <div className="mt-4 space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-3 w-full animate-pulse rounded bg-white/[0.03]" />
          ))}
        </div>
      </div>
    );
  }

  const { composite, breakdown, thingsToNote = [] } = data;

  return (
    <div
      className="rounded-2xl p-6 space-y-6"
      style={{
        background: 'linear-gradient(180deg, #131418 0%, #101114 100%)',
        border: `1px solid ${TIER_BORDER[composite.label]}`,
        boxShadow: TIER_HALO[composite.label],
        transition: 'box-shadow 0.5s ease, border-color 0.5s ease',
      }}
    >
      {/* --- Section header --- */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-[#eaedf3]">AI Signal</h2>
          <p className="text-[11px] text-[#555a65] mt-0.5">
            News · Technical · Derivatives — equal weight, agreement-based confidence
          </p>
        </div>
      </div>

      {/* --- Big composite pill --- */}
      <AISignalBreakdown signal={composite} />

      {/* --- Things to Note --- */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.18em] font-bold text-[#94A3B8]">
            ✧ Things to Note
          </span>
          <span className="flex-1 h-px bg-white/[0.04]" />
        </div>
        {thingsToNote.length === 0 ? (
          <div className="text-xs text-[#555a65] italic">
            No notable signals in the current window.
          </div>
        ) : (
          <ul className="space-y-2">
            {thingsToNote.map((note, i) => {
              const style = NOTE_KIND_STYLE[note.kind];
              const tone = TONE_COLOR[note.tone];
              return (
                <li
                  key={i}
                  className="flex items-start gap-3 rounded-lg px-3 py-2.5"
                  style={{
                    background: 'rgba(255,255,255,0.015)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderLeft: `3px solid ${tone}`,
                  }}
                >
                  <span
                    className="flex-shrink-0 text-[9px] font-bold uppercase tracking-[0.08em] px-1.5 py-0.5 rounded mt-[1px]"
                    style={{ background: style.bg, color: style.fg }}
                  >
                    {style.label}
                  </span>
                  <span className="text-[13px] text-[#cbcfd7] leading-relaxed">
                    {note.text}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* --- Full breakdown (grouped, no scores) --- */}
      <details className="group">
        <summary className="cursor-pointer text-[11px] uppercase tracking-[0.18em] font-bold text-[#94A3B8] hover:text-[#eaedf3] select-none list-none flex items-center gap-2">
          <span className="transition-transform group-open:rotate-90">▸</span>
          <span>Full breakdown</span>
          <span className="text-[9px] text-[#555a65] font-normal normal-case tracking-normal">
            — {breakdown.technical.contributions.length} indicators · {breakdown.technical.patterns.length} patterns · {breakdown.news.matched.length} headlines
          </span>
        </summary>

        <div className="mt-4 space-y-4">
          {/* Technical — grouped */}
          <GroupedTechnical tech={breakdown.technical} />

          {/* Derivatives */}
          <BreakdownBucket title="Derivatives" accent="#A78BFA">
            {breakdown.derivatives.reasoning.map((r, i) => (
              <BreakdownRow
                key={i}
                verdict={derivBucketTone(breakdown.derivatives, i)}
                name={derivRowName(i)}
                reason={r}
              />
            ))}
          </BreakdownBucket>

          {/* News */}
          <BreakdownBucket title="News" accent="#22C55E">
            {breakdown.news.matched.length === 0 ? (
              <div className="text-[11px] text-[#555a65] italic">
                No token-specific headlines — defaulting to Neutral.
              </div>
            ) : (
              breakdown.news.matched.slice(0, 5).map((h, i) => (
                <BreakdownRow
                  key={i}
                  verdict={h.direction === 'bull' ? 'bullish' : h.direction === 'bear' ? 'bearish' : 'neutral'}
                  name={`${h.source} · ${h.priceImpactTier}`}
                  reason={h.title.slice(0, 100) + (h.title.length > 100 ? '…' : '')}
                />
              ))
            )}
          </BreakdownBucket>
        </div>
      </details>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Grouped Technical rendering
// ---------------------------------------------------------------------------

function GroupedTechnical({ tech }: { tech: TechScoreResult }) {
  const momentumNames = new Set(['RSI', 'Stochastic', 'Williams %R', 'CCI', 'MFI']);
  const trendNames = new Set(['MACD', 'ADX', 'SMA', 'Parabolic SAR']);
  const volumeNames = new Set(['Bollinger']);

  const momentum = tech.contributions.filter((c) => momentumNames.has(c.name));
  const trend = tech.contributions.filter((c) => trendNames.has(c.name));
  const volume = tech.contributions.filter((c) => volumeNames.has(c.name));
  const other = tech.contributions.filter(
    (c) => !momentumNames.has(c.name) && !trendNames.has(c.name) && !volumeNames.has(c.name),
  );

  return (
    <div className="space-y-3">
      <BreakdownBucket title={`Momentum oscillators · regime: ${tech.regime}`} accent="#58A7F0">
        {momentum.length === 0 ? (
          <div className="text-[11px] text-[#555a65] italic">No oscillator data.</div>
        ) : (
          momentum.map((c) => <IndicatorRow key={c.name} contribution={c} />)
        )}
      </BreakdownBucket>

      <BreakdownBucket title="Trend indicators" accent="#4ADE80">
        {trend.length === 0 ? (
          <div className="text-[11px] text-[#555a65] italic">No trend data.</div>
        ) : (
          trend.map((c) => <IndicatorRow key={c.name} contribution={c} />)
        )}
      </BreakdownBucket>

      <BreakdownBucket title="Volatility / bands" accent="#FCD34D">
        {volume.length === 0 ? (
          <div className="text-[11px] text-[#555a65] italic">No volatility data.</div>
        ) : (
          volume.map((c) => <IndicatorRow key={c.name} contribution={c} />)
        )}
      </BreakdownBucket>

      {other.length > 0 && (
        <BreakdownBucket title="Other" accent="#94A3B8">
          {other.map((c) => <IndicatorRow key={c.name} contribution={c} />)}
        </BreakdownBucket>
      )}

      <BreakdownBucket title="Chart patterns" accent="#F472B6">
        {tech.patterns.length === 0 ? (
          <div className="text-[11px] text-[#555a65] italic">No patterns firing right now.</div>
        ) : (
          tech.patterns.map((p, i) => (
            <BreakdownRow
              key={i}
              verdict={p.direction === 'bull' ? 'bullish' : 'bearish'}
              name={p.name}
              reason={`Pattern fired on last candle · ${(p.confidence * 100).toFixed(0)}% confidence.`}
            />
          ))
        )}
      </BreakdownBucket>
    </div>
  );
}

function IndicatorRow({ contribution }: { contribution: IndicatorContribution }) {
  const verdict: 'bullish' | 'bearish' | 'neutral' =
    contribution.vote > 0 ? 'bullish' : contribution.vote < 0 ? 'bearish' : 'neutral';
  return <BreakdownRow verdict={verdict} name={contribution.name} reason={contribution.reason} />;
}

// ---------------------------------------------------------------------------
// Shared bucket + row primitives
// ---------------------------------------------------------------------------

function BreakdownBucket({
  title,
  accent,
  children,
}: {
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="h-1 w-1 rounded-full" style={{ background: accent }} />
        <span className="text-[10px] uppercase tracking-[0.12em] font-semibold" style={{ color: accent }}>
          {title}
        </span>
      </div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function BreakdownRow({
  verdict,
  name,
  reason,
}: {
  verdict: 'bullish' | 'bearish' | 'neutral';
  name: string;
  reason: string;
}) {
  const isNeutral = verdict === 'neutral';
  const color = verdict === 'bullish' ? '#4ADE80' : verdict === 'bearish' ? '#F87171' : '#94A3B8';
  const arrow = verdict === 'bullish' ? '↑' : verdict === 'bearish' ? '↓' : '→';
  return (
    <div
      className="grid grid-cols-[auto_130px_1fr] items-baseline gap-3 text-[12px]"
      style={{ opacity: isNeutral ? 0.65 : 1 }}
    >
      <span className="font-mono font-bold text-[14px] leading-none" style={{ color }}>
        {arrow}
      </span>
      <span className="text-[#cbcfd7] font-medium truncate">{name}</span>
      <span className="text-[#8b8f99]">
        {isNeutral ? (
          <span>— Neutral</span>
        ) : (
          <>
            <span className="font-semibold" style={{ color }}>
              {verdict === 'bullish' ? 'Bullish' : 'Bearish'}
            </span>
            <span> — {reason}</span>
          </>
        )}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Derivatives bucket helpers
// ---------------------------------------------------------------------------

function derivBucketTone(deriv: DerivScoreResult, idx: number): 'bullish' | 'bearish' | 'neutral' {
  // Reasoning array order (see calculateDerivScore): [positioning, funding, basis]
  const scores = [deriv.positioningScore, deriv.fundingScore, deriv.basisScore];
  const s = scores[idx] ?? 0;
  if (s > 0) return 'bullish';
  if (s < 0) return 'bearish';
  return 'neutral';
}

function derivRowName(idx: number): string {
  return ['Positioning', 'Funding rate', 'Spot-perp basis'][idx] ?? 'Derivative';
}
