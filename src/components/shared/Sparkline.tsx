'use client';

// Minimal 24h sparkline. Fetches hourly candles for a symbol, draws a
// faded line + gradient fill. Designed to sit behind the price number.

import { useEffect, useMemo, useState } from 'react';
import type { DeltaCandle } from '@/types/delta';

interface Props {
  symbol: string;
  width?: number;
  height?: number;
  color: string;
  /** Flip colour when sparkline trend is negative. Default true. */
  autoColor?: boolean;
}

export default function Sparkline({
  symbol,
  width = 120,
  height = 40,
  color,
  autoColor = true,
}: Props) {
  const [closes, setCloses] = useState<number[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const end = Math.floor(Date.now() / 1000);
        const start = end - 25 * 3600;
        const res = await fetch(
          `/api/candles?symbol=${encodeURIComponent(symbol)}&resolution=1h&start=${start}&end=${end}`,
        );
        if (!res.ok) return;
        const json: { candles?: DeltaCandle[] } = await res.json();
        const arr = (json.candles ?? []).map((c) => Number(c.close)).filter((x) => !isNaN(x));
        if (!cancelled && arr.length > 2) setCloses(arr);
      } catch {
        // silent
      }
    }
    load();
    const id = setInterval(load, 10 * 60_000);
    return () => { cancelled = true; clearInterval(id); };
  }, [symbol]);

  const path = useMemo(() => {
    if (!closes || closes.length < 2) return null;
    const min = Math.min(...closes);
    const max = Math.max(...closes);
    const range = max - min || 1;
    const pad = 2;
    const points = closes.map((v, i) => {
      const x = (i / (closes.length - 1)) * width;
      const y = pad + ((max - v) / range) * (height - pad * 2);
      return [x, y] as const;
    });
    const d = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
    const area = `${d} L${width},${height} L0,${height} Z`;
    const isUp = closes[closes.length - 1] >= closes[0];
    return { d, area, isUp };
  }, [closes, width, height]);

  if (!path) return null;

  const effectiveColor = autoColor ? (path.isUp ? '#4ADE80' : '#F87171') : color;
  const id = `spark-${symbol.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="pointer-events-none opacity-40"
      aria-hidden
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={effectiveColor} stopOpacity="0.35" />
          <stop offset="100%" stopColor={effectiveColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={path.area} fill={`url(#${id})`} />
      <path d={path.d} stroke={effectiveColor} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
