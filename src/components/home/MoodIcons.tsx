'use client';

// Semantic SVG icons for the Market Mood Bar.
// All accept `size`, `color`, and optional animation/value props.

interface BaseProps {
  size?: number;
  color: string;
}

// ---------------------------------------------------------------------------
// Fear & Greed semicircle gauge with needle
// ---------------------------------------------------------------------------

interface GaugeProps extends BaseProps {
  value: number; // 0-100
}

export function GaugeIcon({ size = 40, color, value }: GaugeProps) {
  // Map 0..100 → angle -90deg..+90deg (left to right across the semicircle)
  const clamped = Math.max(0, Math.min(100, value));
  const angle = (clamped / 100) * 180 - 90; // -90..+90
  // Needle length
  const needleLen = size * 0.40;
  const cx = size / 2;
  const cy = size * 0.62;
  const rad = ((angle - 90) * Math.PI) / 180; // -90 → pointing up
  const x2 = cx + needleLen * Math.cos(rad);
  const y2 = cy + needleLen * Math.sin(rad);

  const r = size * 0.40;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      <defs>
        <linearGradient id="gauge-grad" x1="0" y1="0.5" x2="1" y2="0.5">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="40%" stopColor="#F59E0B" />
          <stop offset="55%" stopColor="#FBBF24" />
          <stop offset="75%" stopColor="#84CC16" />
          <stop offset="100%" stopColor="#22C55E" />
        </linearGradient>
      </defs>
      {/* Track arc */}
      <path
        d={`M${cx - r},${cy} A${r},${r} 0 0 1 ${cx + r},${cy}`}
        stroke="url(#gauge-grad)"
        strokeWidth={size * 0.09}
        fill="none"
        strokeLinecap="round"
        opacity="0.9"
      />
      {/* Needle */}
      <line
        x1={cx}
        y1={cy}
        x2={x2}
        y2={y2}
        stroke={color}
        strokeWidth={size * 0.06}
        strokeLinecap="round"
        style={{ transition: 'all 0.8s cubic-bezier(0.25, 1, 0.5, 1)' }}
      />
      {/* Pivot dot */}
      <circle cx={cx} cy={cy} r={size * 0.06} fill={color} stroke="#0e0f12" strokeWidth={1.5} />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// BTC Dominance donut (shows BTC share vs everything else)
// ---------------------------------------------------------------------------

interface DominanceProps extends BaseProps {
  /** BTC dominance percent 0-100. */
  value: number;
}

export function DominanceIcon({ size = 40, color, value }: DominanceProps) {
  const r = size * 0.38;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const btcLen = circumference * (value / 100);
  const gap = circumference - btcLen;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      {/* Background ring (alts) */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="rgba(148, 163, 184, 0.25)"
        strokeWidth={size * 0.12}
      />
      {/* BTC dominance arc */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={size * 0.12}
        strokeDasharray={`${btcLen} ${gap}`}
        strokeDashoffset={circumference * 0.25}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'all 0.8s cubic-bezier(0.25, 1, 0.5, 1)' }}
      />
      {/* BTC symbol in center */}
      <text
        x={cx}
        y={cy + size * 0.10}
        textAnchor="middle"
        fontSize={size * 0.32}
        fontWeight="800"
        fill={color}
        fontFamily="ui-monospace, monospace"
      >
        ₿
      </text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// ETH / BTC ratio icon — ETH diamond over BTC circle
// ---------------------------------------------------------------------------

interface EthBtcProps extends BaseProps {
  /** True = ETH strengthening vs BTC */
  rising: boolean;
}

export function EthBtcIcon({ size = 40, color, rising }: EthBtcProps) {
  const cx = size / 2;
  const cy = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      {/* BTC circle underlay */}
      <circle cx={cx} cy={cy} r={size * 0.42} fill="rgba(247, 147, 26, 0.18)" stroke="rgba(247, 147, 26, 0.5)" strokeWidth="1.5" />
      {/* ETH diamond overlay */}
      <g transform={`translate(${cx}, ${cy})`}>
        <polygon points={`0,-${size * 0.28} ${size * 0.18},0 0,${size * 0.28} -${size * 0.18},0`} fill={color} opacity="0.9" />
      </g>
      {/* Direction arrow top-right */}
      <g transform={`translate(${size * 0.72}, ${size * 0.22})`}>
        <circle r={size * 0.15} fill={rising ? 'rgba(74, 222, 128, 0.2)' : 'rgba(248, 113, 113, 0.2)'} />
        <text
          x="0"
          y={size * 0.055}
          textAnchor="middle"
          fontSize={size * 0.20}
          fontWeight="900"
          fill={rising ? '#4ADE80' : '#F87171'}
        >
          {rising ? '↑' : '↓'}
        </text>
      </g>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Calendar icon with current-day tick
// ---------------------------------------------------------------------------

export function CalendarIcon({ size = 40, color }: BaseProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
      {/* Calendar body */}
      <rect x="6" y="10" width="28" height="24" rx="3" fill="none" stroke={color} strokeWidth="2" />
      {/* Top strip (bound with color) */}
      <rect x="6" y="10" width="28" height="6" rx="3" fill={color} opacity="0.25" />
      {/* Binder rings */}
      <line x1="13" y1="6" x2="13" y2="13" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="27" y1="6" x2="27" y2="13" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      {/* Date marker */}
      <circle cx="20" cy="24" r="4" fill={color} opacity="0.9" />
      <text x="20" y="26" textAnchor="middle" fontSize="6" fontWeight="800" fill="#0e0f12">•</text>
    </svg>
  );
}
