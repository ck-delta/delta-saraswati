'use client';

// Bull / Base / Bear scenarios — probabilities sum to 100%.
// Fetched from /api/ai/scenarios/[symbol] (Groq-generated, 15min cache).

import { useEffect, useState } from 'react';

interface Scenario {
  probability: number;
  thesis: string;
  invalidation: string;
}

interface ScenariosPayload {
  bull: Scenario;
  base: Scenario;
  bear: Scenario;
  generatedAt: number;
  stale?: boolean;
}

interface Props {
  symbol: string;
}

const SCENARIO_STYLE = {
  bull: { color: '#22C55E', bg: 'rgba(34, 197, 94, 0.08)', border: 'rgba(34, 197, 94, 0.3)', label: 'Bull', icon: '↑' },
  base: { color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.08)', border: 'rgba(148, 163, 184, 0.3)', label: 'Base', icon: '→' },
  bear: { color: '#F87171', bg: 'rgba(248, 113, 113, 0.08)', border: 'rgba(248, 113, 113, 0.3)', label: 'Bear', icon: '↓' },
} as const;

export default function ScenariosPanel({ symbol }: Props) {
  const [data, setData] = useState<ScenariosPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`/api/ai/scenarios/${symbol}`);
        if (!res.ok) throw new Error(`Scenarios ${res.status}`);
        const json: ScenariosPayload = await res.json();
        if (!cancelled) {
          setData(json);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Scenarios unavailable');
        }
      }
    }

    load();
    // Scenarios cache 15min server-side; refresh every 5min from client
    const id = setInterval(load, 5 * 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [symbol]);

  return (
    <div className="rounded-xl border border-[#1e2024] bg-[#111214] p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-[#eaedf3]">Scenarios</h2>
          <p className="text-[11px] text-[#555a65]">AI-generated Bull / Base / Bear probabilities with invalidation levels</p>
        </div>
        {data?.stale && (
          <span className="text-[10px] text-[#94A3B8] px-2 py-0.5 rounded-full bg-white/[0.03]">
            stale
          </span>
        )}
      </div>

      {error ? (
        <div className="py-4 text-center text-xs text-[#8b8f99]">Scenarios unavailable — {error}</div>
      ) : !data ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 w-full animate-pulse rounded-lg bg-white/[0.03]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(['bull', 'base', 'bear'] as const).map((key) => {
            const s = data[key];
            const style = SCENARIO_STYLE[key];
            return (
              <div
                key={key}
                className="rounded-lg p-4 space-y-2"
                style={{
                  background: style.bg,
                  border: `1px solid ${style.border}`,
                }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs font-bold uppercase tracking-wide flex items-center gap-1"
                    style={{ color: style.color }}
                  >
                    <span>{style.icon}</span>
                    <span>{style.label}</span>
                  </span>
                  <span
                    className="font-mono-num text-xl font-black"
                    style={{ color: style.color }}
                  >
                    {s.probability}%
                  </span>
                </div>
                <div className="text-[12px] text-[#cbcfd7] leading-relaxed">
                  {s.thesis}
                </div>
                <div className="pt-2 border-t" style={{ borderColor: style.border }}>
                  <div className="text-[9px] uppercase tracking-wider text-[#555a65] mb-0.5">Invalidation</div>
                  <div className="text-[11px]" style={{ color: style.color, opacity: 0.9 }}>
                    {s.invalidation}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
