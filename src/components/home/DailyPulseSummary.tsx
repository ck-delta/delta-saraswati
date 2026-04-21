'use client';

// AI Market Summary — 8-section grid with callouts strip removed (now in
// MarketMoodBar). This card focuses on curated text snapshots.

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Activity, Rocket, Globe, Box, TrendingUp, Flame, Zap, Target } from 'lucide-react';
import type { PulseItem, PulseResponse, SentimentBadge, SectorBucket } from '@/types/pulse';

const SENTIMENT_STYLE: Record<SentimentBadge, { bg: string; fg: string; border: string; bar: string }> = {
  BULLISH: { bg: 'rgba(34, 197, 94, 0.10)',  fg: '#4ADE80', border: 'rgba(34, 197, 94, 0.3)',  bar: '#22C55E' },
  NEUTRAL: { bg: 'rgba(148, 163, 184, 0.08)', fg: '#94A3B8', border: 'rgba(148, 163, 184, 0.3)', bar: '#94A3B8' },
  BEARISH: { bg: 'rgba(248, 113, 113, 0.10)', fg: '#F87171', border: 'rgba(248, 113, 113, 0.3)', bar: '#F87171' },
};

const SECTION_STYLE = {
  marketPulse:        { accent: '#58A7F0', label: 'MARKET PULSE',        icon: Activity },
  bigMovers:          { accent: '#F59E0B', label: 'BIG MOVERS',          icon: Rocket },
  macroWatch:         { accent: '#22C55E', label: 'MACRO WATCH',         icon: Globe },
  derivativesInsight: { accent: '#A78BFA', label: 'DERIVATIVES INSIGHT', icon: Box },
  sectorRotation:     { accent: '#38BDF8', label: 'SECTOR ROTATION',     icon: TrendingUp },
  fundingExtremes:    { accent: '#FCD34D', label: 'FUNDING EXTREMES',    icon: Flame },
  volumeAnomalies:    { accent: '#F472B6', label: 'VOLUME ANOMALIES',    icon: Zap },
  oiChanges:          { accent: '#C084FC', label: 'OI CHANGE LEADERS',   icon: Target },
} as const;

type SectionKind = keyof typeof SECTION_STYLE;
type Filter = 'all' | 'bullish' | 'bearish';

function timeAgo(ts: number | string): string {
  const n = typeof ts === 'string' ? Date.parse(ts) : ts;
  if (isNaN(n)) return '';
  const mins = Math.floor((Date.now() - n) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
}

function fmtChangePct(n: number | undefined): string {
  if (n == null) return '';
  return `${n >= 0 ? '↑' : '↓'}${Math.abs(n).toFixed(2)}%`;
}

function fmtCompactUsd(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function faviconUrl(domain: string | undefined, size = 32): string | null {
  if (!domain) return null;
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;
}

function matchesFilter(item: PulseItem, filter: Filter): boolean {
  if (filter === 'all') return true;
  if (filter === 'bullish') return item.sentiment === 'BULLISH';
  return item.sentiment === 'BEARISH';
}

export default function DailyPulseSummary() {
  const [data, setData] = useState<PulseResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/ai/daily-pulse');
        if (!res.ok) throw new Error(`daily-pulse ${res.status}`);
        const json: PulseResponse = await res.json();
        if (!cancelled) { setData(json); setLoading(false); setError(null); }
      } catch (err) {
        if (!cancelled) { setError(err instanceof Error ? err.message : 'Failed to load'); setLoading(false); }
      }
    }
    load();
    const id = setInterval(load, 10 * 60_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const counts = useMemo(() => {
    if (!data) return { all: 0, bullish: 0, bearish: 0 };
    const all: PulseItem[] = [
      ...data.summary.marketPulse,
      ...data.summary.bigMovers,
      ...data.summary.macroWatch,
      ...data.summary.derivativesInsight,
      ...data.summary.fundingExtremes,
      ...data.summary.volumeAnomalies,
      ...data.summary.oiChanges,
    ];
    let bullish = 0, bearish = 0;
    for (const it of all) {
      if (it.sentiment === 'BULLISH') bullish++;
      else if (it.sentiment === 'BEARISH') bearish++;
    }
    return { all: all.length, bullish, bearish };
  }, [data]);

  return (
    <div className="rounded-xl border border-[#1e2024] bg-[#111214] p-5 lg:p-6 space-y-5">
      {/* ---- Header ---- */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: 'rgba(120, 86, 255, 0.12)', border: '1px solid rgba(120, 86, 255, 0.3)' }}
          >
            <span className="text-lg" style={{ color: '#A78BFA' }}>✦</span>
          </div>
          <div>
            <h2 className="text-base font-bold text-[#eaedf3]">AI Market Summary</h2>
            <p className="text-[11px] text-[#8b8f99] mt-0.5 flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#4ADE80] animate-pulse" />
              Powered by live Delta Exchange data
            </p>
          </div>
        </div>
        {data && (
          <div className="flex items-center gap-1.5 text-[11px] text-[#8b8f99]">
            <span aria-hidden>🕒</span>
            <span>{timeAgo(data.timestamp)}</span>
          </div>
        )}
      </div>

      {/* ---- Filter tabs ---- */}
      {data && counts.all > 0 && (
        <div className="flex gap-1 rounded-lg bg-white/[0.02] border border-white/[0.04] p-1 max-w-md">
          <FilterTab label="All"     count={counts.all}     active={filter === 'all'}     onClick={() => setFilter('all')} />
          <FilterTab label="Bullish" count={counts.bullish} active={filter === 'bullish'} onClick={() => setFilter('bullish')} color="#4ADE80" />
          <FilterTab label="Bearish" count={counts.bearish} active={filter === 'bearish'} onClick={() => setFilter('bearish')} color="#F87171" />
        </div>
      )}

      {loading ? (
        <LoadingState />
      ) : error && !data ? (
        <div className="text-center py-8 text-sm text-[#8b8f99]">
          Could not load market summary — {error}
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-5">
            <Section kind="marketPulse"        items={data.summary.marketPulse}        filter={filter} />
            <Section kind="macroWatch"         items={data.summary.macroWatch}         filter={filter} />
            <Section kind="bigMovers"          items={data.summary.bigMovers}          filter={filter} />
            <Section kind="derivativesInsight" items={data.summary.derivativesInsight} filter={filter} />
            <SectorSection                    buckets={data.summary.sectorRotation}   filter={filter} />
            <Section kind="fundingExtremes"    items={data.summary.fundingExtremes}    filter={filter} />
            <Section kind="volumeAnomalies"    items={data.summary.volumeAnomalies}    filter={filter} />
            <Section kind="oiChanges"          items={data.summary.oiChanges}          filter={filter} />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
            <div className="flex items-center gap-1.5 text-[10px] text-[#555a65]">
              <span>✦</span>
              <span>AI Generated · {timeAgo(data.timestamp)}</span>
            </div>
            {data.stale && (
              <span className="text-[9px] text-[#FCD34D] px-2 py-0.5 rounded-full" style={{ background: 'rgba(252, 211, 77, 0.1)' }}>stale</span>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Filter tab
// ---------------------------------------------------------------------------

function FilterTab({
  label, count, active, onClick, color,
}: { label: string; count: number; active: boolean; onClick: () => void; color?: string; }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all"
      style={{
        background: active ? (color ? `${color}15` : 'rgba(255,255,255,0.05)') : 'transparent',
        color: active ? (color ?? '#eaedf3') : '#8b8f99',
        border: active && color ? `1px solid ${color}40` : '1px solid transparent',
      }}
    >
      <span>{label}</span>
      <span className="font-mono-num text-[9px] px-1 rounded"
        style={{ background: active ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.04)', color: active ? (color ?? '#cbcfd7') : '#555a65' }}
      >
        {count}
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Section
// ---------------------------------------------------------------------------

function Section({ kind, items, filter }: { kind: SectionKind; items: PulseItem[]; filter: Filter }) {
  const style = SECTION_STYLE[kind];
  const Icon = style.icon;
  const filtered = items.filter((it) => matchesFilter(it, filter));

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-6 w-6 items-center justify-center rounded" style={{ background: `${style.accent}15`, color: style.accent }}>
          <Icon className="h-3 w-3" />
        </div>
        <h3 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: style.accent }}>
          {style.label}
        </h3>
        <span className="inline-block h-1 w-1 rounded-full animate-pulse ml-0.5" style={{ background: style.accent, opacity: 0.6 }} />
      </div>

      {filtered.length === 0 ? (
        <div className="text-xs text-[#555a65] italic py-2 pl-3 border-l-2" style={{ borderColor: `${style.accent}30` }}>
          {items.length === 0 ? `No ${style.label.toLowerCase()} in current window.` : `No ${filter} items in this section.`}
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((item, i) => (
            <Item key={i} item={item} />
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sector Rotation section (different shape from the PulseItem sections)
// ---------------------------------------------------------------------------

function SectorSection({ buckets, filter }: { buckets: SectorBucket[]; filter: Filter }) {
  const style = SECTION_STYLE.sectorRotation;
  const Icon = style.icon;
  const filtered = buckets.filter((b) => {
    if (filter === 'all') return true;
    if (filter === 'bullish') return b.sentiment === 'BULLISH';
    return b.sentiment === 'BEARISH';
  });

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-6 w-6 items-center justify-center rounded" style={{ background: `${style.accent}15`, color: style.accent }}>
          <Icon className="h-3 w-3" />
        </div>
        <h3 className="text-[11px] font-bold uppercase tracking-wider" style={{ color: style.accent }}>
          {style.label}
        </h3>
        <span className="inline-block h-1 w-1 rounded-full animate-pulse ml-0.5" style={{ background: style.accent, opacity: 0.6 }} />
      </div>

      {filtered.length === 0 ? (
        <div className="text-xs text-[#555a65] italic py-2 pl-3 border-l-2" style={{ borderColor: `${style.accent}30` }}>
          No sector data available.
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((b, i) => {
            const sent = SENTIMENT_STYLE[b.sentiment];
            const dirIcon = b.avgChangePct24h >= 0 ? '↑' : '↓';
            return (
              <li key={i} className="relative pl-3 border-l-2" style={{ borderColor: sent.border }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-bold text-[#eaedf3] text-sm">{b.name}</span>
                      <span className="font-mono-num text-xs font-semibold" style={{ color: sent.fg }}>
                        {dirIcon}{Math.abs(b.avgChangePct24h).toFixed(2)}%
                      </span>
                    </div>
                    <div className="text-[12px] text-[#8b8f99] mt-0.5">
                      — {b.tokens.length} tokens · {fmtCompactUsd(b.totalVolumeUsd)} 24h vol
                    </div>
                  </div>
                  <span
                    className="flex-shrink-0 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                    style={{ background: sent.bg, color: sent.fg, border: `1px solid ${sent.border}` }}
                  >
                    {b.sentiment}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Item
// ---------------------------------------------------------------------------

function Item({ item }: { item: PulseItem }) {
  const sent = SENTIMENT_STYLE[item.sentiment];
  const isHeadline = !!item.url;
  const [expanded, setExpanded] = useState(false);

  const body = (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        {/* Headline row (news items with url) */}
        {isHeadline ? (
          <div className="flex items-start gap-2">
            {item.sourceDomain && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={faviconUrl(item.sourceDomain) ?? ''}
                alt=""
                width={16}
                height={16}
                className="h-4 w-4 rounded mt-[3px] flex-shrink-0"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            )}
            <div className="min-w-0">
              <div className="text-sm font-semibold text-[#eaedf3] leading-snug">{item.label}</div>
              {(item.source || item.publishedAt) && (
                <div className="text-[10px] text-[#555a65] mt-0.5">
                  {item.source}{item.publishedAt ? ` · ${timeAgo(item.publishedAt)}` : ''}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-bold text-[#eaedf3] text-sm">{item.label}</span>
            {item.price && <span className="font-mono-num text-sm text-[#cbcfd7]">at {item.price}</span>}
            {item.changePct != null && (
              <span className="font-mono-num text-xs font-semibold" style={{ color: item.changePct >= 0 ? '#4ADE80' : '#F87171' }}>
                {fmtChangePct(item.changePct)}
              </span>
            )}
          </div>
        )}
        {/* Reason line */}
        <div className="text-[12px] text-[#8b8f99] mt-0.5 flex items-baseline gap-2 flex-wrap">
          <span>— {item.reason}</span>
          {item.tag && (
            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.04)', color: '#94A3B8' }}>
              {item.tag}
            </span>
          )}
        </div>
        {expanded && item.detail && (
          <div className="mt-2 rounded-md px-2.5 py-1.5 text-[11px] leading-relaxed" style={{ background: 'rgba(255,255,255,0.02)', color: '#cbcfd7', border: '1px solid rgba(255,255,255,0.04)' }}>
            {item.detail}
          </div>
        )}
      </div>

      <span
        className="flex-shrink-0 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
        style={{ background: sent.bg, color: sent.fg, border: `1px solid ${sent.border}`, letterSpacing: '0.08em' }}
      >
        {item.sentiment}
      </span>
    </div>
  );

  // Tier-colored left border thickness tracks sentiment
  const borderWidth = item.sentiment === 'BULLISH' || item.sentiment === 'BEARISH' ? '3px' : '2px';
  const commonClass = 'relative pl-3 border-l-[3px] transition-colors duration-150 rounded-r';
  const commonStyle = {
    borderColor: sent.border,
    borderLeftWidth: borderWidth,
  };

  // Click behaviour: prefer url (news) > symbol (research page).
  if (item.url) {
    return (
      <li
        className={commonClass}
        style={commonStyle}
        onMouseEnter={() => item.detail && setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="block hover:bg-white/[0.02] rounded-r px-1 -mx-1 py-0.5">
          {body}
        </a>
      </li>
    );
  }
  if (item.symbol) {
    return (
      <li
        className={commonClass}
        style={commonStyle}
        onMouseEnter={() => item.detail && setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        <Link href={`/research?token=${item.symbol}`} className="block hover:bg-white/[0.02] rounded-r px-1 -mx-1 py-0.5">
          {body}
        </Link>
      </li>
    );
  }
  return (
    <li
      className={commonClass}
      style={commonStyle}
      onMouseEnter={() => item.detail && setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {body}
    </li>
  );
}

// ---------------------------------------------------------------------------
// Loading state
// ---------------------------------------------------------------------------

function LoadingState() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-24 rounded bg-white/[0.05] animate-pulse" />
            <div className="h-4 w-full rounded bg-white/[0.03] animate-pulse" />
            <div className="h-4 w-5/6 rounded bg-white/[0.03] animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
