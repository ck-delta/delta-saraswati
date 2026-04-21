'use client';

// AI Market Summary — 4-section grid with callouts strip.
// Layout matches the target screenshot: Market Pulse + Big Movers (left),
// Macro Watch + Derivatives Insight (right). Plus a glanceable callout strip
// above (Fear & Greed, BTC dominance, next macro events, conditional alerts).

import { useEffect, useState } from 'react';
import type { PulseItem, PulseResponse, SentimentBadge } from '@/types/pulse';

const SENTIMENT_STYLE: Record<SentimentBadge, { bg: string; fg: string; border: string }> = {
  BULLISH: { bg: 'rgba(34, 197, 94, 0.10)', fg: '#4ADE80', border: 'rgba(34, 197, 94, 0.3)' },
  NEUTRAL: { bg: 'rgba(148, 163, 184, 0.08)', fg: '#94A3B8', border: 'rgba(148, 163, 184, 0.3)' },
  BEARISH: { bg: 'rgba(248, 113, 113, 0.10)', fg: '#F87171', border: 'rgba(248, 113, 113, 0.3)' },
};

const SECTION_STYLE = {
  marketPulse: { accent: '#58A7F0', label: 'MARKET PULSE', icon: '〰' },
  bigMovers:   { accent: '#F59E0B', label: 'BIG MOVERS',   icon: '🚀' },
  macroWatch:  { accent: '#22C55E', label: 'MACRO WATCH',  icon: '🌐' },
  derivativesInsight: { accent: '#A78BFA', label: 'DERIVATIVES INSIGHT', icon: '◆' },
} as const;

function timeAgo(ts: number): string {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
}

function fmtChangePct(n: number | undefined): string {
  if (n == null) return '';
  return `${n >= 0 ? '↑' : '↓'}${Math.abs(n).toFixed(2)}%`;
}

export default function DailyPulseSummary() {
  const [data, setData] = useState<PulseResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/ai/daily-pulse');
        if (!res.ok) throw new Error(`daily-pulse ${res.status}`);
        const json: PulseResponse = await res.json();
        if (!cancelled) {
          setData(json);
          setLoading(false);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load');
          setLoading(false);
        }
      }
    }

    load();
    const id = setInterval(load, 10 * 60_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return (
    <div className="rounded-xl border border-[#1e2024] bg-[#111214] p-5 lg:p-6 space-y-5">
      {/* ---- Header ---- */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: 'rgba(120, 86, 255, 0.12)', border: '1px solid rgba(120, 86, 255, 0.3)' }}
          >
            <span className="text-lg" style={{ color: '#A78BFA' }}>✦</span>
          </div>
          <div>
            <h2 className="text-base font-bold text-[#eaedf3]">AI Market Summary</h2>
            <p className="text-[11px] text-[#8b8f99] mt-0.5 flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#4ADE80]" />
              Powered by live Delta Exchange data
            </p>
          </div>
        </div>
        {data && (
          <div className="flex items-center gap-1.5 text-[11px] text-[#8b8f99]">
            <span>🕒</span>
            <span>{timeAgo(data.timestamp)}</span>
          </div>
        )}
      </div>

      {loading ? (
        <LoadingState />
      ) : error && !data ? (
        <div className="text-center py-8 text-sm text-[#8b8f99]">
          Could not load market summary — {error}
        </div>
      ) : data ? (
        <>
          {/* ---- 4-section grid ---- */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Section kind="marketPulse" items={data.summary.marketPulse} />
            <Section kind="macroWatch" items={data.summary.macroWatch} />
            <Section kind="bigMovers" items={data.summary.bigMovers} />
            <Section kind="derivativesInsight" items={data.summary.derivativesInsight} />
          </div>

          {/* ---- Footer ---- */}
          <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
            <div className="flex items-center gap-1.5 text-[10px] text-[#555a65]">
              <span>✦</span>
              <span>AI Generated · {timeAgo(data.timestamp)}</span>
            </div>
            {data.stale && (
              <span className="text-[9px] text-[#FCD34D] px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(252, 211, 77, 0.1)' }}
              >stale</span>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section
// ---------------------------------------------------------------------------

function Section({
  kind,
  items,
}: {
  kind: keyof typeof SECTION_STYLE;
  items: PulseItem[];
}) {
  const style = SECTION_STYLE[kind];
  return (
    <div>
      {/* Section header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-6 w-6 items-center justify-center rounded"
          style={{ background: `${style.accent}15`, color: style.accent }}
        >
          <span className="text-[11px]">{style.icon}</span>
        </div>
        <h3 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: style.accent }}>
          {style.label}
        </h3>
      </div>

      {items.length === 0 ? (
        <div className="text-xs text-[#555a65] italic py-2 pl-3 border-l-2" style={{ borderColor: `${style.accent}30` }}>
          No {style.label.toLowerCase()} in current window.
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item, i) => (
            <Item key={i} item={item} accent={style.accent} />
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Item
// ---------------------------------------------------------------------------

function Item({ item, accent }: { item: PulseItem; accent: string }) {
  const sent = SENTIMENT_STYLE[item.sentiment];
  const isHeadline = !item.price && !item.changePct;

  return (
    <li className="relative pl-3 border-l-2" style={{ borderColor: `${accent}40` }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Token row: label · price · change */}
          {!isHeadline ? (
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-bold text-[#eaedf3] text-sm">{item.label}</span>
              {item.price && (
                <span className="font-mono-num text-sm text-[#cbcfd7]">at {item.price}</span>
              )}
              {item.changePct != null && (
                <span
                  className="font-mono-num text-xs font-semibold"
                  style={{ color: item.changePct >= 0 ? '#4ADE80' : '#F87171' }}
                >
                  {fmtChangePct(item.changePct)}
                </span>
              )}
            </div>
          ) : (
            <div className="text-sm font-semibold text-[#eaedf3] leading-snug">
              {item.label}
            </div>
          )}
          {/* Reason line */}
          <div className="text-[12px] text-[#8b8f99] mt-0.5 flex items-baseline gap-2 flex-wrap">
            <span>— {item.reason}</span>
            {item.tag && (
              <span className="text-[10px] px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(255,255,255,0.04)', color: '#94A3B8' }}
              >
                {item.tag}
              </span>
            )}
          </div>
        </div>

        {/* Sentiment badge */}
        <span
          className="flex-shrink-0 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
          style={{
            background: sent.bg,
            color: sent.fg,
            border: `1px solid ${sent.border}`,
            letterSpacing: '0.08em',
          }}
        >
          {item.sentiment}
        </span>
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Loading state
// ---------------------------------------------------------------------------

function LoadingState() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="h-[72px] rounded-lg bg-white/[0.03] animate-pulse" />
        <div className="h-[72px] rounded-lg bg-white/[0.03] animate-pulse" />
        <div className="h-[72px] rounded-lg bg-white/[0.03] animate-pulse" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-24 rounded bg-white/[0.05] animate-pulse" />
            <div className="h-4 w-full rounded bg-white/[0.03] animate-pulse" />
            <div className="h-4 w-5/6 rounded bg-white/[0.03] animate-pulse" />
            <div className="h-4 w-4/6 rounded bg-white/[0.03] animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
