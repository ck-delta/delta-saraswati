'use client';

// Sticky top-of-page ribbon with 4 mood tiles:
// Fear & Greed · BTC Dominance · ETH/BTC ratio · Macro Calendar.
// Each tile has proper SVG iconography, a value, a secondary line, a 7d sparkline
// when available, and a hover tooltip via title attribute.
// Stale (>30min) tiles render at reduced opacity.

import { useEffect, useState } from 'react';
import { GaugeIcon, DominanceIcon, EthBtcIcon, CalendarIcon } from './MoodIcons';
import MacroEventsModal from './MacroEventsModal';
import type { MarketMood } from '@/app/api/market-mood/route';

// Default staleness threshold: anything older than 30 min is dimmed.
// Override per tile where source cadence is naturally slower (F&G = daily).
const STALENESS_DEFAULT_MS = 30 * 60_000;
const STALENESS_DAILY_MS = 30 * 3_600_000; // ~30h — long enough for once-a-day sources

function fgColor(value: number): string {
  if (value <= 24) return '#EF4444';
  if (value <= 44) return '#F59E0B';
  if (value <= 55) return '#FBBF24';
  if (value <= 75) return '#84CC16';
  return '#22C55E';
}

function MiniSpark({ values, color, width = 80, height = 18 }: { values: number[]; color: string; width?: number; height?: number }) {
  if (!values || values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pad = 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = pad + ((max - v) / range) * (height - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const d = `M${pts.join(' L')}`;
  const area = `${d} L${width},${height} L0,${height} Z`;
  const id = `ms-${Math.random().toString(36).slice(2, 7)}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="pointer-events-none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={d} stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function MarketMoodBar() {
  const [data, setData] = useState<MarketMood | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [macroOpen, setMacroOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/market-mood');
        if (!res.ok) throw new Error(`market-mood ${res.status}`);
        const json: MarketMood = await res.json();
        if (!cancelled) {
          setData(json);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'unavailable');
      }
    }
    load();
    const id = setInterval(load, 5 * 60_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return (
    <>
      <div className="mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <FearGreedTile mood={data?.fearGreed ?? null} loading={!data && !error} />
          <BtcDominanceTile mood={data?.btcDominance ?? null} loading={!data && !error} />
          <EthBtcTile mood={data?.ethBtc ?? null} loading={!data && !error} />
          <MacroTile
            events={data?.nextMacroEvents ?? []}
            loading={!data && !error}
            onOpen={() => setMacroOpen(true)}
          />
        </div>
      </div>

      <MacroEventsModal
        open={macroOpen}
        onOpenChange={setMacroOpen}
        events={data?.upcomingMacroEvents ?? []}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Tile shell (shared)
// ---------------------------------------------------------------------------

function TileShell({
  children,
  lastUpdatedMs,
  tooltip,
  stalenessMs = STALENESS_DEFAULT_MS,
}: {
  children: React.ReactNode;
  lastUpdatedMs?: number | null;
  tooltip?: string;
  stalenessMs?: number;
}) {
  const stale = lastUpdatedMs != null && Date.now() - lastUpdatedMs > stalenessMs;
  return (
    <div
      title={tooltip}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-opacity"
      style={{
        background: 'rgba(255,255,255,0.015)',
        border: '1px solid rgba(255,255,255,0.05)',
        opacity: stale ? 0.55 : 1,
      }}
    >
      {children}
    </div>
  );
}

function LoadingTile({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 border border-white/[0.04] bg-white/[0.015]">
      <div className="w-10 h-10 rounded-lg bg-white/[0.04] animate-pulse" />
      <div className="flex flex-col gap-1.5 min-w-0 flex-1">
        <div className="h-[9px] w-16 rounded bg-white/[0.05] animate-pulse" />
        <div className="h-3 w-24 rounded bg-white/[0.04] animate-pulse" />
        <div className="h-3 w-20 rounded bg-white/[0.03] animate-pulse" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fear & Greed tile
// ---------------------------------------------------------------------------

function FearGreedTile({ mood, loading }: { mood: MarketMood['fearGreed']; loading: boolean }) {
  if (loading) return <LoadingTile label="F&G" />;
  if (!mood) return null;
  const color = fgColor(mood.value);
  const tooltip = 'Fear & Greed Index combines volatility, momentum, social media, surveys, and BTC dominance — 0 = extreme fear, 100 = extreme greed.';

  return (
    <TileShell lastUpdatedMs={mood.lastUpdatedMs} tooltip={tooltip} stalenessMs={STALENESS_DAILY_MS}>
      <div className="flex-shrink-0">
        <GaugeIcon size={40} color={color} value={mood.value} />
      </div>
      <div className="min-w-0 flex-1 flex flex-col gap-0.5">
        <div className="flex items-center justify-between">
          <span className="text-[9px] uppercase tracking-wider text-[#8b8f99]">Fear & Greed</span>
          <span className="font-mono-num text-xs font-black" style={{ color }}>{mood.value}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-bold truncate" style={{ color }}>
          <span className="uppercase">{mood.label}</span>
          {mood.prevValue != null && (
            <span className="font-mono-num text-[9px] text-[#8b8f99] font-normal">
              {mood.direction === 'up' ? '↑' : mood.direction === 'down' ? '↓' : '→'}{Math.abs(mood.value - mood.prevValue)}
            </span>
          )}
        </div>
        <div className="h-[18px] mt-0.5">
          <MiniSpark values={mood.history} color={color} />
        </div>
      </div>
    </TileShell>
  );
}

// ---------------------------------------------------------------------------
// BTC Dominance tile
// ---------------------------------------------------------------------------

function BtcDominanceTile({ mood, loading }: { mood: MarketMood['btcDominance']; loading: boolean }) {
  if (loading) return <LoadingTile label="BTC.D" />;
  if (!mood) return null;
  const color = '#F7931A';
  const regime = mood.value >= 55 ? 'BTC-heavy' : mood.value >= 45 ? 'Balanced' : 'Alt-heavy';
  const tooltip = `BTC's share of total crypto market cap. Rising dominance usually means alts underperform. Now ${mood.value.toFixed(1)}% of $${mood.totalMarketCapUsdT.toFixed(2)}T total.`;

  return (
    <TileShell lastUpdatedMs={mood.lastUpdatedMs} tooltip={tooltip}>
      <div className="flex-shrink-0">
        <DominanceIcon size={40} color={color} value={mood.value} />
      </div>
      <div className="min-w-0 flex-1 flex flex-col gap-0.5">
        <div className="flex items-center justify-between">
          <span className="text-[9px] uppercase tracking-wider text-[#8b8f99]">BTC Dominance</span>
          <span className="font-mono-num text-xs font-black" style={{ color }}>{mood.value.toFixed(1)}%</span>
        </div>
        <div className="text-[11px] font-bold truncate" style={{ color: '#eaedf3' }}>
          {regime}
        </div>
        <div className="flex items-center gap-1 text-[10px] text-[#8b8f99]">
          <span>Total mcap</span>
          <span className="font-mono-num font-semibold" style={{ color: mood.marketCapPctChange24h >= 0 ? '#4ADE80' : '#F87171' }}>
            {mood.marketCapPctChange24h >= 0 ? '↑' : '↓'}{Math.abs(mood.marketCapPctChange24h).toFixed(2)}%
          </span>
          <span>· ${mood.totalMarketCapUsdT.toFixed(2)}T</span>
        </div>
      </div>
    </TileShell>
  );
}

// ---------------------------------------------------------------------------
// ETH / BTC tile
// ---------------------------------------------------------------------------

function EthBtcTile({ mood, loading }: { mood: MarketMood['ethBtc']; loading: boolean }) {
  if (loading) return <LoadingTile label="ETH/BTC" />;
  if (!mood) return null;
  const rising = mood.pctChange7d >= 0;
  const color = rising ? '#627EEA' : '#94A3B8';
  const tooltip = `ETH priced in BTC. Rising = ETH strengthening vs Bitcoin (alts leading). Falling = BTC outpacing alts. 7d change: ${mood.pctChange7d >= 0 ? '+' : ''}${mood.pctChange7d.toFixed(2)}%.`;
  // Downsample history to ~40 points for the sparkline
  const step = Math.max(1, Math.floor(mood.history.length / 40));
  const sampled = mood.history.filter((_, i) => i % step === 0);

  return (
    <TileShell lastUpdatedMs={mood.lastUpdatedMs} tooltip={tooltip}>
      <div className="flex-shrink-0">
        <EthBtcIcon size={40} color="#627EEA" rising={rising} />
      </div>
      <div className="min-w-0 flex-1 flex flex-col gap-0.5">
        <div className="flex items-center justify-between">
          <span className="text-[9px] uppercase tracking-wider text-[#8b8f99]">ETH / BTC</span>
          <span className="font-mono-num text-xs font-black" style={{ color: '#eaedf3' }}>{mood.ratio.toFixed(5)}</span>
        </div>
        <div className="text-[11px] font-bold truncate" style={{ color }}>
          {rising ? 'ETH strengthening' : 'BTC outpacing'}
          <span className="font-mono-num ml-1.5 text-[10px] font-normal" style={{ color: rising ? '#4ADE80' : '#F87171' }}>
            {rising ? '↑' : '↓'}{Math.abs(mood.pctChange7d).toFixed(2)}% 7d
          </span>
        </div>
        <div className="h-[18px] mt-0.5">
          <MiniSpark values={sampled} color={rising ? '#4ADE80' : '#F87171'} />
        </div>
      </div>
    </TileShell>
  );
}

// ---------------------------------------------------------------------------
// Macro Calendar tile
// ---------------------------------------------------------------------------

function MacroTile({
  events,
  loading,
  onOpen,
}: {
  events: MarketMood['nextMacroEvents'];
  loading: boolean;
  onOpen: () => void;
}) {
  if (loading) return <LoadingTile label="Macro" />;
  if (!events || events.length === 0) return null;
  const color = '#22C55E';
  const tooltip = 'Click to see all 10 upcoming FOMC, CPI, PCE and NFP events.';

  return (
    <button
      type="button"
      onClick={onOpen}
      title={tooltip}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all hover:bg-white/[0.03] hover:border-white/[0.10] focus:outline-none focus:ring-2 focus:ring-[#22C55E]/40"
      style={{
        background: 'rgba(255,255,255,0.015)',
        border: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      <div className="flex-shrink-0">
        <CalendarIcon size={40} color={color} />
      </div>
      <div className="min-w-0 flex-1 flex flex-col gap-0.5">
        <div className="flex items-center justify-between">
          <span className="text-[9px] uppercase tracking-wider text-[#8b8f99]">Macro Calendar</span>
          <span className="font-mono-num text-[10px] text-[#8b8f99] flex items-center gap-0.5">
            view all
            <span aria-hidden className="opacity-60">→</span>
          </span>
        </div>
        {events.slice(0, 2).map((e, i) => (
          <div key={i} className="flex items-baseline gap-1.5 text-[11px] truncate">
            <span className="font-mono-num font-black" style={{ color }}>{e.countdown}</span>
            <span className="font-bold text-[#eaedf3]">{e.kind.replace('_', ' ')}</span>
            <span className="text-[#555a65] truncate">
              {e.label.replace(/ \(.+\)$/, '').replace(/^US /, '').replace(/^FOMC /i, '')}
            </span>
          </div>
        ))}
      </div>
    </button>
  );
}
