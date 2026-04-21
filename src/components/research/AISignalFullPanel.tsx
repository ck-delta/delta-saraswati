'use client';

// Full AI Signal panel for /research page.
// Shows: big composite pill + confidence + 3 sub-scores + contributor rows
// (every indicator vote, every pattern, news reasoning, deriv reasoning).

import { useEffect, useState } from 'react';
import AISignalBreakdown from '@/components/shared/AISignalBreakdown';
import type { AISignalResult } from '@/lib/signals/composite';
import type { TechScoreResult } from '@/lib/signals/tech-score';
import type { DerivScoreResult } from '@/lib/signals/deriv-score';
import type { NewsScoreResult } from '@/lib/signals/news-score';

interface AISignalPayload {
  symbol: string;
  composite: AISignalResult;
  breakdown: {
    news: NewsScoreResult;
    technical: TechScoreResult;
    derivatives: DerivScoreResult;
  };
}

interface Props {
  symbol: string;
}

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
        if (!cancelled) {
          setData(json);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Signal unavailable');
        }
      }
    }

    load();
    const id = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [symbol]);

  if (error) {
    return (
      <div className="rounded-xl border border-[#1e2024] bg-[#111214] p-6 text-center text-sm text-[#8b8f99]">
        AI Signal temporarily unavailable — {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-[#1e2024] bg-[#111214] p-6">
        <div className="h-16 w-full animate-pulse rounded-xl bg-white/[0.04]" />
        <div className="mt-4 space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-white/[0.03]" />
          <div className="h-3 w-full animate-pulse rounded bg-white/[0.03]" />
          <div className="h-3 w-full animate-pulse rounded bg-white/[0.03]" />
        </div>
      </div>
    );
  }

  const { composite, breakdown } = data;

  return (
    <div className="rounded-xl border border-[#1e2024] bg-[#111214] p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-[#eaedf3]">AI Signal</h2>
          <p className="text-[11px] text-[#555a65]">News · Technical · Derivatives — equal weight, agreement-based confidence</p>
        </div>
      </div>

      <AISignalBreakdown signal={composite} />

      {/* Reasoning bullets */}
      <div className="rounded-lg border border-white/[0.04] bg-white/[0.015] p-4 space-y-1.5">
        <div className="text-[10px] uppercase tracking-wider text-[#555a65] mb-2">Why this signal</div>
        {composite.reasoning.map((r, i) => (
          <div key={i} className="text-[12px] text-[#cbcfd7] leading-relaxed">
            • {r}
          </div>
        ))}
      </div>

      {/* Deep breakdown: indicator contributions + patterns + deriv/news details */}
      <details className="group">
        <summary className="cursor-pointer text-[11px] uppercase tracking-wider text-[#8b8f99] hover:text-[#eaedf3] select-none list-none flex items-center gap-2">
          <span className="transition-transform group-open:rotate-90">▸</span>
          <span>Full breakdown ({breakdown.technical.contributions.length} indicators, {breakdown.technical.patterns.length} patterns)</span>
        </summary>

        <div className="mt-4 space-y-5">
          {/* Technical indicators */}
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[#555a65] mb-2">
              Technical · regime: <span className="text-[#4ADE80]">{breakdown.technical.regime}</span> · ADX {breakdown.technical.adx} · vol multiplier {breakdown.technical.volumeMultiplier.toFixed(2)}×
            </div>
            <div className="space-y-1">
              {breakdown.technical.contributions.map((c) => (
                <div key={c.name} className="grid grid-cols-12 gap-2 text-[11px]">
                  <span className="col-span-3 text-[#cbcfd7] font-medium">{c.name}</span>
                  <span
                    className={`col-span-1 font-mono-num text-right font-bold ${
                      c.vote > 0 ? 'text-[#4ADE80]' : c.vote < 0 ? 'text-[#F87171]' : 'text-[#94A3B8]'
                    }`}
                  >
                    {c.vote > 0 ? '+' : ''}{c.vote}
                  </span>
                  <span className="col-span-1 text-right text-[#555a65]">×{c.weight}</span>
                  <span className="col-span-7 text-[#8b8f99]">{c.reason}</span>
                </div>
              ))}
            </div>
            {breakdown.technical.patterns.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {breakdown.technical.patterns.map((p, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{
                      background: p.direction === 'bull' ? 'rgba(74, 222, 128, 0.12)' : 'rgba(248, 113, 113, 0.12)',
                      color: p.direction === 'bull' ? '#4ADE80' : '#F87171',
                    }}
                  >
                    {p.name} · {(p.confidence * 100).toFixed(0)}%
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Derivatives */}
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[#555a65] mb-2">Derivatives</div>
            <div className="space-y-1">
              {breakdown.derivatives.reasoning.map((r, i) => (
                <div key={i} className="text-[11px] text-[#8b8f99]">• {r}</div>
              ))}
            </div>
          </div>

          {/* News */}
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[#555a65] mb-2">
              News · {breakdown.news.matched.length} matched headline{breakdown.news.matched.length === 1 ? '' : 's'} · aggregated impact {breakdown.news.aggregatedImpact >= 0 ? '+' : ''}{breakdown.news.aggregatedImpact.toFixed(1)}
            </div>
            <div className="space-y-1.5">
              {breakdown.news.matched.length === 0 ? (
                <div className="text-[11px] text-[#555a65]">No token-specific headlines — defaulting to Neutral 5.0</div>
              ) : (
                breakdown.news.matched.slice(0, 5).map((h, i) => (
                  <div key={i} className="text-[11px] text-[#8b8f99]">
                    <span
                      className="inline-block w-10 text-center text-[9px] font-bold rounded mr-2"
                      style={{
                        background: h.direction === 'bull' ? 'rgba(74, 222, 128, 0.15)' : h.direction === 'bear' ? 'rgba(248, 113, 113, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                        color: h.direction === 'bull' ? '#4ADE80' : h.direction === 'bear' ? '#F87171' : '#94A3B8',
                        padding: '1px 4px',
                      }}
                    >
                      {h.signedDecayedImpact >= 0 ? '+' : ''}{h.signedDecayedImpact.toFixed(1)}
                    </span>
                    <span className="text-[#cbcfd7]">{h.title.slice(0, 90)}{h.title.length > 90 ? '…' : ''}</span>
                    <span className="text-[10px] text-[#555a65] ml-2">
                      [{h.priceImpactTier}/{h.breadthTier}/{h.forwardTier}]
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </details>
    </div>
  );
}
