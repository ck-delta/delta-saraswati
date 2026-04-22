'use client';

// Scenarios — Bull / Base / Bear probabilities + Entry/TP/SL/Invalidation/Catalyst.
// Each card gets a directional halo (green for Bull, red for Bear, neutral for Base).

import { useEffect, useState } from 'react';

interface Scenario {
  probability: number;
  thesis: string;
  entry: string;
  tp: string;
  sl: string;
  invalidation: string;
  catalyst: string;
}

interface ScenariosPayload {
  bull: Scenario;
  base: Scenario;
  bear: Scenario;
  generatedAt: number;
  levels?: {
    price: number;
    pivots: { pivot: number; r1: number; r2: number; s1: number; s2: number } | null;
  };
  stale?: boolean;
}

interface Props {
  symbol: string;
}

type Kind = 'bull' | 'base' | 'bear';

const SCENARIO_STYLE: Record<Kind, {
  color: string;
  bg: string;
  border: string;
  halo: string;
  label: string;
  icon: string;
}> = {
  bull: {
    color: '#22C55E',
    bg:    'rgba(34, 197, 94, 0.06)',
    border:'rgba(34, 197, 94, 0.30)',
    halo:  '0 0 44px -14px rgba(34, 197, 94, 0.55), inset 0 0 0 1px rgba(34, 197, 94, 0.25)',
    label: 'BULL',
    icon:  '↑',
  },
  base: {
    color: '#94A3B8',
    bg:    'rgba(148, 163, 184, 0.06)',
    border:'rgba(148, 163, 184, 0.25)',
    halo:  '0 20px 44px -24px rgba(0, 0, 0, 0.40)',
    label: 'BASE',
    icon:  '→',
  },
  bear: {
    color: '#F87171',
    bg:    'rgba(248, 113, 113, 0.06)',
    border:'rgba(248, 113, 113, 0.30)',
    halo:  '0 0 44px -14px rgba(248, 113, 113, 0.55), inset 0 0 0 1px rgba(248, 113, 113, 0.25)',
    label: 'BEAR',
    icon:  '↓',
  },
};

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
        if (!cancelled) { setData(json); setError(null); }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Scenarios unavailable');
      }
    }
    load();
    const id = setInterval(load, 5 * 60_000);
    return () => { cancelled = true; clearInterval(id); };
  }, [symbol]);

  return (
    <div
      className="rounded-2xl border p-6 space-y-5"
      style={{
        background: 'linear-gradient(180deg, #131418 0%, #101114 100%)',
        borderColor: 'rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold tracking-wide text-[#eaedf3]">Scenarios</h2>
          <p className="text-[11px] text-[#555a65] mt-0.5">
            Probability-weighted Bull / Base / Bear outcomes with entry, target, stop
          </p>
        </div>
        {data?.stale && (
          <span className="text-[10px] text-[#94A3B8] px-2 py-0.5 rounded-full bg-white/[0.03]">stale</span>
        )}
      </div>

      {error ? (
        <div className="py-4 text-center text-xs text-[#8b8f99]">Scenarios unavailable — {error}</div>
      ) : !data ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-56 w-full animate-pulse rounded-xl bg-white/[0.03]" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['bull', 'base', 'bear'] as const).map((kind) => (
              <ScenarioCard key={kind} kind={kind} scenario={data[kind]} />
            ))}
          </div>

          {data.levels?.pivots && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-[#555a65] pt-2 border-t border-white/[0.04]">
              <span className="uppercase tracking-wider font-semibold text-[#8b8f99]">Levels used</span>
              <span>P ${data.levels.pivots.pivot.toLocaleString()}</span>
              <span style={{ color: '#F87171' }}>R1 ${data.levels.pivots.r1.toLocaleString()}</span>
              <span style={{ color: '#F87171' }}>R2 ${data.levels.pivots.r2.toLocaleString()}</span>
              <span style={{ color: '#4ADE80' }}>S1 ${data.levels.pivots.s1.toLocaleString()}</span>
              <span style={{ color: '#4ADE80' }}>S2 ${data.levels.pivots.s2.toLocaleString()}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ScenarioCard({ kind, scenario }: { kind: Kind; scenario: Scenario }) {
  const style = SCENARIO_STYLE[kind];
  return (
    <div
      className="relative rounded-xl p-4 space-y-4"
      style={{
        background: style.bg,
        border: `1px solid ${style.border}`,
        boxShadow: style.halo,
      }}
    >
      {/* Header row: label + probability */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-black" style={{ color: style.color }}>{style.icon}</span>
          <span className="text-xs font-black uppercase tracking-[0.15em]" style={{ color: style.color }}>
            {style.label}
          </span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="font-mono-num text-3xl font-black leading-none" style={{ color: style.color }}>
            {scenario.probability}%
          </span>
          <span className="text-[9px] uppercase tracking-wider" style={{ color: style.color, opacity: 0.7 }}>
            chance
          </span>
        </div>
      </div>

      {/* Thesis */}
      <p className="text-[13px] text-[#cbcfd7] leading-relaxed">
        {scenario.thesis}
      </p>

      {/* Trade plan grid */}
      <div className="space-y-2 rounded-lg p-3"
        style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.04)' }}
      >
        <TradeRow label="Entry"         value={scenario.entry} color={style.color} />
        <TradeRow label="Take profit"   value={scenario.tp}    color="#4ADE80" strong />
        <TradeRow label="Stop loss"     value={scenario.sl}    color="#F87171" strong />
      </div>

      {/* Catalyst */}
      <div className="space-y-1">
        <div className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: style.color, opacity: 0.8 }}>
          Catalyst
        </div>
        <div className="text-[12px] text-[#cbcfd7] leading-snug">
          {scenario.catalyst}
        </div>
      </div>

      {/* Invalidation */}
      <div
        className="space-y-1 pt-2 border-t"
        style={{ borderColor: style.border }}
      >
        <div className="text-[9px] uppercase tracking-wider font-semibold" style={{ color: style.color, opacity: 0.8 }}>
          Invalidation
        </div>
        <div className="text-[12px] font-medium leading-snug" style={{ color: style.color }}>
          {scenario.invalidation}
        </div>
      </div>
    </div>
  );
}

function TradeRow({ label, value, color, strong = false }: { label: string; value: string; color: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[10px] uppercase tracking-wider text-[#8b8f99]">{label}</span>
      <span
        className={`font-mono-num text-[12px] text-right leading-snug ${strong ? 'font-bold' : 'font-medium'}`}
        style={{ color: strong ? color : '#cbcfd7' }}
      >
        {value}
      </span>
    </div>
  );
}
