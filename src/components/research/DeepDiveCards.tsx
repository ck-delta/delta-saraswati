'use client';

// Three deep-dive cards that sit below the Scenarios section:
//   Technical · Derivatives · News
//
// Each card fetches its data from the existing /api/ai-signal endpoint and
// presents a richer view than the AI Signal panel breakdown. The card whose
// sub-score is the strongest contributor (by deviation from 5.0) gets a
// tier-colored halo — "importance" marker.

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Activity, Layers, Newspaper } from 'lucide-react';
import type { AISignalResult } from '@/lib/signals/composite';
import type { TechScoreResult } from '@/lib/signals/tech-score';
import type { DerivScoreResult } from '@/lib/signals/deriv-score';
import type { NewsScoreResult } from '@/lib/signals/news-score';
import type { PCRResult, OptionsLSResult } from '@/lib/api/delta';

interface AISignalPayload {
  symbol: string;
  composite: AISignalResult;
  breakdown: {
    news: NewsScoreResult;
    technical: TechScoreResult;
    derivatives: DerivScoreResult;
  };
  options?: {
    pcr: PCRResult | null;
    ls: OptionsLSResult | null;
    supported: boolean;
  };
}

interface Props {
  symbol: string;
}

const TIER_HALO = {
  bull: '0 0 40px -14px rgba(34, 197, 94, 0.45), inset 0 0 0 1px rgba(34, 197, 94, 0.22)',
  bear: '0 0 40px -14px rgba(239, 68, 68, 0.45), inset 0 0 0 1px rgba(239, 68, 68, 0.22)',
  none: '0 20px 44px -28px rgba(0, 0, 0, 0.45)',
};

function tone(score: number): 'bull' | 'bear' | 'none' {
  if (score >= 6.5) return 'bull';
  if (score <= 3.5) return 'bear';
  return 'none';
}

export default function DeepDiveCards({ symbol }: Props) {
  const [data, setData] = useState<AISignalPayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch(`/api/ai-signal/${symbol}`);
        if (!res.ok) throw new Error();
        const json: AISignalPayload = await res.json();
        if (!cancelled) setData(json);
      } catch {
        // silent
      }
    }
    load();
    const id = setInterval(load, 60_000);
    return () => { cancelled = true; clearInterval(id); };
  }, [symbol]);

  if (!data) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-96 rounded-2xl bg-white/[0.03] animate-pulse" />
        ))}
      </div>
    );
  }

  // Pick which card gets the halo — the sub-score furthest from neutral 5.0.
  const deviations = [
    Math.abs(data.composite.technical.score - 5),
    Math.abs(data.composite.derivatives.score - 5),
    Math.abs(data.composite.news.score - 5),
  ];
  const maxDev = Math.max(...deviations);
  const strongestIndex = deviations.indexOf(maxDev);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <TechnicalCard
        tech={data.breakdown.technical}
        strongest={strongestIndex === 0}
        symbol={symbol}
      />
      <DerivativesCard
        deriv={data.breakdown.derivatives}
        options={data.options}
        strongest={strongestIndex === 1}
        symbol={symbol}
      />
      <NewsCard
        news={data.breakdown.news}
        strongest={strongestIndex === 2}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared shell
// ---------------------------------------------------------------------------

function CardShell({
  title,
  score,
  tier,
  accent,
  icon: Icon,
  strongest,
  children,
}: {
  title: string;
  score: number;
  tier: string;
  accent: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  strongest: boolean;
  children: React.ReactNode;
}) {
  const t = tone(score);
  const halo = strongest ? TIER_HALO[t] : TIER_HALO.none;
  return (
    <div
      className="rounded-2xl p-5 space-y-4 transition-all duration-300"
      style={{
        background: 'linear-gradient(180deg, #131418 0%, #101114 100%)',
        border: `1px solid ${strongest ? (t === 'bull' ? 'rgba(34,197,94,0.30)' : t === 'bear' ? 'rgba(239,68,68,0.30)' : 'rgba(255,255,255,0.06)') : 'rgba(255,255,255,0.06)'}`,
        boxShadow: halo,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: `${accent}18`, color: accent, border: `1px solid ${accent}30` }}>
            <Icon className="h-3.5 w-3.5" />
          </div>
          <h3 className="text-[11px] font-bold uppercase tracking-[0.12em]" style={{ color: accent }}>
            {title}
          </h3>
          {strongest && (
            <span
              className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#cbcfd7' }}
              title="Strongest signal right now"
            >
              lead
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="font-mono-num text-lg font-black" style={{ color: accent }}>
            {score.toFixed(1)}
          </span>
          <span className="text-[9px] opacity-60" style={{ color: accent }}>/10</span>
        </div>
      </div>

      {/* Tier badge */}
      <div className="flex items-center gap-2 -mt-2">
        <span
          className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
          style={{
            background: tier === 'Strong Buy' || tier === 'Buy' ? 'rgba(34,197,94,0.12)'
              : tier === 'Strong Sell' || tier === 'Sell' ? 'rgba(248,113,113,0.12)'
              : 'rgba(148,163,184,0.10)',
            color: tier === 'Strong Buy' || tier === 'Buy' ? '#4ADE80'
              : tier === 'Strong Sell' || tier === 'Sell' ? '#F87171'
              : '#94A3B8',
          }}
        >
          {tier}
        </span>
      </div>

      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Technical deep-dive
// ---------------------------------------------------------------------------

// Which bucket an indicator belongs to. Used to section the full list.
const INDICATOR_BUCKETS: Record<string, 'momentum' | 'trend' | 'volatility' | 'volume'> = {
  RSI:            'momentum',
  Stochastic:     'momentum',
  'Williams %R':  'momentum',
  CCI:            'momentum',
  MFI:            'volume',
  MACD:           'trend',
  ADX:            'trend',
  SMA:            'trend',
  'Parabolic SAR':'trend',
  Bollinger:      'volatility',
};

const BUCKET_LABEL: Record<string, string> = {
  momentum:   'Momentum oscillators',
  trend:      'Trend',
  volatility: 'Volatility',
  volume:     'Volume-weighted',
};

const BUCKET_ACCENT: Record<string, string> = {
  momentum:   '#58A7F0',
  trend:      '#4ADE80',
  volatility: '#FCD34D',
  volume:     '#F472B6',
};

function TechnicalCard({ tech, strongest, symbol: _symbol }: { tech: TechScoreResult; strongest: boolean; symbol: string }) {
  // Tally bullish vs bearish vs neutral votes (across all 10 indicators)
  let bull = 0, bear = 0, neutral = 0;
  for (const c of tech.contributions) {
    if (c.vote > 0) bull++;
    else if (c.vote < 0) bear++;
    else neutral++;
  }

  // Group by bucket while preserving a stable order
  const buckets: Record<string, typeof tech.contributions> = {
    momentum: [], trend: [], volatility: [], volume: [], other: [],
  };
  for (const c of tech.contributions) {
    const b = INDICATOR_BUCKETS[c.name] ?? 'other';
    buckets[b].push(c);
  }
  const bucketOrder = ['momentum', 'trend', 'volatility', 'volume', 'other'] as const;

  return (
    <CardShell
      title="Technical deep-dive"
      score={tech.score}
      tier={tech.label}
      accent="#58A7F0"
      icon={Activity}
      strongest={strongest}
    >
      <div className="space-y-3">
        {/* Regime chip */}
        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-[#8b8f99]">Regime</span>
          <span className="font-bold text-[#eaedf3] uppercase tracking-wider">
            {tech.regime}
          </span>
          <span className="text-[#555a65]">·</span>
          <span className="text-[#8b8f99]">ADX {tech.adx.toFixed(1)}</span>
          <span className="text-[#555a65]">·</span>
          <span className="text-[#8b8f99]">vol mult {tech.volumeMultiplier.toFixed(2)}×</span>
        </div>

        {/* Vote tally */}
        <div className="grid grid-cols-3 gap-2">
          <VoteTile label="Bullish" count={bull} color="#4ADE80" />
          <VoteTile label="Neutral" count={neutral} color="#94A3B8" />
          <VoteTile label="Bearish" count={bear} color="#F87171" />
        </div>

        {/* All indicators grouped by bucket */}
        <div className="space-y-3 pt-1">
          {bucketOrder.map((key) => {
            const items = buckets[key];
            if (!items || items.length === 0) return null;
            const accent = BUCKET_ACCENT[key] ?? '#94A3B8';
            const label = BUCKET_LABEL[key] ?? 'Other';
            return (
              <div key={key} className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full" style={{ background: accent }} />
                  <span className="text-[9px] uppercase tracking-[0.14em] font-bold" style={{ color: accent }}>
                    {label}
                  </span>
                </div>
                {items.map((c) => {
                  const v = c.vote > 0 ? 'bullish' : c.vote < 0 ? 'bearish' : 'neutral';
                  const color = v === 'bullish' ? '#4ADE80' : v === 'bearish' ? '#F87171' : '#94A3B8';
                  const arrow = v === 'bullish' ? '↑' : v === 'bearish' ? '↓' : '→';
                  const dim = v === 'neutral' ? 0.65 : 1;
                  return (
                    <div
                      key={c.name}
                      className="grid grid-cols-[14px_90px_1fr] gap-2 text-[11px] leading-snug"
                      style={{ opacity: dim }}
                    >
                      <span className="font-mono font-bold text-[13px] leading-none" style={{ color }}>
                        {arrow}
                      </span>
                      <span className="font-semibold text-[#cbcfd7] truncate">{c.name}</span>
                      <span className="text-[#8b8f99]">
                        {v === 'neutral' ? (
                          <span>— Neutral</span>
                        ) : (
                          <>
                            <span className="font-semibold" style={{ color }}>
                              {v === 'bullish' ? 'Bullish' : 'Bearish'}
                            </span>
                            <span> — {c.reason}</span>
                          </>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Patterns */}
        <div className="pt-1">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="h-1 w-1 rounded-full" style={{ background: '#F472B6' }} />
            <span className="text-[9px] uppercase tracking-[0.14em] font-bold" style={{ color: '#F472B6' }}>
              Chart patterns
            </span>
          </div>
          {tech.patterns.length === 0 ? (
            <div className="text-[11px] text-[#555a65] italic">
              No candlestick / chart patterns firing.
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {tech.patterns.map((p, i) => (
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
      </div>
    </CardShell>
  );
}

function VoteTile({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-lg py-2"
      style={{ background: `${color}10`, border: `1px solid ${color}25` }}
    >
      <span className="font-mono-num text-xl font-black leading-none" style={{ color }}>
        {count}
      </span>
      <span className="text-[9px] uppercase tracking-wider mt-1" style={{ color, opacity: 0.75 }}>
        {label}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Derivatives deep-dive — positioning + funding + basis + PCR + L/S
// ---------------------------------------------------------------------------

function DerivativesCard({
  deriv,
  options,
  strongest,
  symbol: _symbol,
}: {
  deriv: DerivScoreResult;
  options?: AISignalPayload['options'];
  strongest: boolean;
  symbol: string;
}) {
  const positioningColor =
    deriv.positioning === 'Long Buildup' || deriv.positioning === 'Short Covering' ? '#4ADE80'
    : deriv.positioning === 'Short Buildup' || deriv.positioning === 'Long Unwinding' ? '#F87171'
    : '#94A3B8';

  // Count verdict tallies across all derivative signals for the header row.
  const signals: { score: number }[] = [
    { score: deriv.positioningScore },
    { score: deriv.fundingScore },
    { score: deriv.basisScore },
  ];
  if (options?.pcr) {
    signals.push({ score: options.pcr.label === 'Bullish crowd' ? 1 : options.pcr.label === 'Bearish crowd' ? -1 : 0 });
  }
  if (options?.ls) {
    signals.push({ score: options.ls.label === 'Long-biased' ? 1 : options.ls.label === 'Short-biased' ? -1 : 0 });
  }
  let bull = 0, bear = 0, neutral = 0;
  for (const s of signals) {
    if (s.score > 0) bull++;
    else if (s.score < 0) bear++;
    else neutral++;
  }

  return (
    <CardShell
      title="Derivatives deep-dive"
      score={deriv.score}
      tier={deriv.label}
      accent="#A78BFA"
      icon={Layers}
      strongest={strongest}
    >
      <div className="space-y-4">
        {/* Positioning — prominently displayed */}
        <div
          className="rounded-lg p-3 space-y-1"
          style={{
            background: `${positioningColor}08`,
            border: `1px solid ${positioningColor}30`,
          }}
        >
          <div className="flex items-baseline justify-between">
            <span className="text-[9px] uppercase tracking-[0.14em] font-bold text-[#94A3B8]">
              Positioning
            </span>
            <span className="text-[9px] text-[#555a65]">
              perp price vs OI, 6h window
            </span>
          </div>
          <div className="text-base font-black uppercase tracking-wider" style={{ color: positioningColor }}>
            {deriv.positioning}
          </div>
          <div className="text-[11px] text-[#8b8f99] leading-snug">
            {deriv.reasoning[0]}
          </div>
        </div>

        {/* Verdict tally across all signals (perp + options) */}
        <div className="grid grid-cols-3 gap-2">
          <VoteTile label="Bullish" count={bull} color="#4ADE80" />
          <VoteTile label="Neutral" count={neutral} color="#94A3B8" />
          <VoteTile label="Bearish" count={bear} color="#F87171" />
        </div>

        {/* All derivative signals grouped */}
        <div className="space-y-3 pt-1">
          {/* Perp / spot signals */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full" style={{ background: '#A78BFA' }} />
              <span className="text-[9px] uppercase tracking-[0.14em] font-bold" style={{ color: '#A78BFA' }}>
                Perpetual signals
              </span>
            </div>
            <DerivSignalRow
              name="Positioning"
              value={deriv.positioning}
              verdict={
                deriv.positioningScore > 0 ? 'bullish'
                : deriv.positioningScore < 0 ? 'bearish'
                : 'neutral'
              }
              reason={deriv.reasoning[0] ?? ''}
            />
            <DerivSignalRow
              name="Funding rate"
              value={`${deriv.fundingRate >= 0 ? '+' : ''}${(deriv.fundingRate * 100).toFixed(4)}% · p${deriv.fundingPercentile.toFixed(0)}`}
              verdict={
                deriv.fundingScore > 0 ? 'bullish'
                : deriv.fundingScore < 0 ? 'bearish'
                : 'neutral'
              }
              reason={deriv.reasoning[1] ?? ''}
            />
            <DerivSignalRow
              name="Basis (spot-perp)"
              value={
                deriv.basis != null
                  ? `${deriv.basis >= 0 ? '+' : ''}${(deriv.basis * 100).toFixed(3)}%`
                  : '—'
              }
              verdict={
                deriv.basisScore > 0 ? 'bullish'
                : deriv.basisScore < 0 ? 'bearish'
                : 'neutral'
              }
              reason={deriv.reasoning[2] ?? ''}
            />
          </div>

          {/* Options sentiment (BTC / ETH only) */}
          <div className="space-y-2 pt-1 border-t border-white/[0.04]">
            <div className="flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full" style={{ background: '#FCD34D' }} />
              <span className="text-[9px] uppercase tracking-[0.14em] font-bold" style={{ color: '#FCD34D' }}>
                Options sentiment
              </span>
            </div>
            {options?.supported ? (
              <>
                {options.pcr ? (
                  <PcrBar pcr={options.pcr} />
                ) : (
                  <div className="text-[11px] text-[#555a65] italic">PCR: options data thin right now.</div>
                )}
                {options.ls ? (
                  <LsBar ls={options.ls} />
                ) : (
                  <div className="text-[11px] text-[#555a65] italic">L/S: options data thin right now.</div>
                )}
              </>
            ) : (
              <div className="text-[10px] text-[#555a65] italic">
                PCR · L/S — only computed for tokens with liquid Delta options (BTC, ETH).
              </div>
            )}
          </div>
        </div>
      </div>
    </CardShell>
  );
}

function DerivSignalRow({
  name,
  value,
  verdict,
  reason,
}: {
  name: string;
  value: string;
  verdict: 'bullish' | 'bearish' | 'neutral';
  reason?: string;
}) {
  const color = verdict === 'bullish' ? '#4ADE80' : verdict === 'bearish' ? '#F87171' : '#94A3B8';
  const arrow = verdict === 'bullish' ? '↑' : verdict === 'bearish' ? '↓' : '→';
  const dim = verdict === 'neutral' ? 0.70 : 1;
  return (
    <div style={{ opacity: dim }}>
      <div className="grid grid-cols-[14px_1fr_auto] gap-2 text-[11px] items-baseline">
        <span className="font-mono font-bold text-[13px] leading-none" style={{ color }}>
          {arrow}
        </span>
        <span className="font-semibold text-[#cbcfd7]">{name}</span>
        <span className="font-mono-num text-[11px] font-semibold" style={{ color }}>
          {value}
        </span>
      </div>
      {reason && (
        <div className="text-[10px] text-[#8b8f99] ml-[22px] leading-snug">
          <span className="font-semibold" style={{ color }}>
            {verdict === 'bullish' ? 'Bullish' : verdict === 'bearish' ? 'Bearish' : 'Neutral'}
          </span>{' '}— {reason}
        </div>
      )}
    </div>
  );
}

function StatTile({ label, value, caption, color }: { label: string; value: string; caption: string; color: string }) {
  return (
    <div className="rounded-lg p-2.5 border border-white/[0.04] bg-white/[0.015]">
      <div className="text-[9px] uppercase tracking-wider text-[#8b8f99]">{label}</div>
      <div className="font-mono-num text-sm font-bold mt-0.5" style={{ color }}>
        {value}
      </div>
      <div className="text-[9px] text-[#555a65] mt-0.5">{caption}</div>
    </div>
  );
}

function PcrBar({ pcr }: { pcr: PCRResult }) {
  // PCR 0..2 range visualisation. 1.0 = balanced.
  const clamped = Math.max(0, Math.min(2, pcr.pcrVolume));
  const bullPct = ((1 - Math.min(1, pcr.pcrVolume)) * 100); // 0..100 "bullish" side
  const bearPct = 100 - bullPct;
  const color = pcr.label === 'Bullish crowd' ? '#4ADE80' : pcr.label === 'Bearish crowd' ? '#F87171' : '#94A3B8';

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between text-[10px]">
        <span className="text-[#8b8f99]">PCR (24h vol) · {clamped.toFixed(2)}</span>
        <span className="font-bold uppercase tracking-wider" style={{ color }}>{pcr.label}</span>
      </div>
      <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <div className="absolute inset-y-0 left-0" style={{ width: `${bullPct}%`, background: '#4ADE8055' }} />
        <div className="absolute inset-y-0 right-0" style={{ width: `${bearPct}%`, background: '#F8717155' }} />
        <div
          className="absolute top-[-3px] w-[2px] h-[12px]"
          style={{ left: `${(clamped / 2) * 100}%`, background: color, boxShadow: `0 0 6px ${color}` }}
        />
      </div>
      <div className="text-[10px] text-[#555a65]">{pcr.description}</div>
    </div>
  );
}

function LsBar({ ls }: { ls: OptionsLSResult }) {
  const pct = ls.longBiasPct;
  const color = ls.label === 'Long-biased' ? '#4ADE80' : ls.label === 'Short-biased' ? '#F87171' : '#94A3B8';
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between text-[10px]">
        <span className="text-[#8b8f99]">L/S bias (options OI) · {pct.toFixed(0)}% long</span>
        <span className="font-bold uppercase tracking-wider" style={{ color }}>{ls.label}</span>
      </div>
      <div className="relative h-1.5 rounded-full overflow-hidden flex">
        <div style={{ width: `${pct}%`, background: '#4ADE80AA' }} />
        <div style={{ width: `${100 - pct}%`, background: '#F87171AA' }} />
      </div>
      <div className="text-[10px] text-[#555a65]">{ls.description}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// News deep-dive — top 5 matched headlines
// ---------------------------------------------------------------------------

function NewsCard({ news, strongest }: { news: NewsScoreResult; strongest: boolean }) {
  const top = news.matched
    .slice()
    .sort((a, b) => Math.abs(b.signedDecayedImpact) - Math.abs(a.signedDecayedImpact))
    .slice(0, 5);

  let bull = 0, bear = 0, neu = 0;
  for (const h of news.matched) {
    if (h.direction === 'bull') bull++;
    else if (h.direction === 'bear') bear++;
    else neu++;
  }

  return (
    <CardShell
      title="News deep-dive"
      score={news.score}
      tier={news.label}
      accent="#22C55E"
      icon={Newspaper}
      strongest={strongest}
    >
      <div className="space-y-3">
        {/* Tally */}
        <div className="grid grid-cols-3 gap-2">
          <VoteTile label="Bullish" count={bull} color="#4ADE80" />
          <VoteTile label="Neutral" count={neu} color="#94A3B8" />
          <VoteTile label="Bearish" count={bear} color="#F87171" />
        </div>

        {top.length === 0 ? (
          <div className="text-[11px] text-[#555a65] italic py-2">
            No token-specific headlines in the current window.
          </div>
        ) : (
          <ul className="space-y-2 pt-1">
            {top.map((h, i) => {
              const dirColor = h.direction === 'bull' ? '#4ADE80' : h.direction === 'bear' ? '#F87171' : '#94A3B8';
              return (
                <li
                  key={i}
                  className="rounded-lg p-2.5 space-y-1"
                  style={{
                    background: 'rgba(255,255,255,0.015)',
                    border: '1px solid rgba(255,255,255,0.04)',
                    borderLeft: `3px solid ${dirColor}`,
                  }}
                >
                  <div className="text-[12px] font-semibold text-[#eaedf3] leading-snug">
                    {h.title}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap text-[9px]">
                    <span className="text-[#8b8f99]">{h.source}</span>
                    <span className="text-[#555a65]">·</span>
                    <span
                      className="font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                      style={{ background: `${dirColor}12`, color: dirColor, border: `1px solid ${dirColor}30` }}
                    >
                      {h.priceImpactTier}
                    </span>
                    <span className="text-[#555a65]">·</span>
                    <span className="text-[#555a65]">{h.breadthTier}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </CardShell>
  );
}
