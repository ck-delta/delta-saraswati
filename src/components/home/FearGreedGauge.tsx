'use client';

import { FEAR_GREED_COLORS } from '@/lib/constants';

interface FearGreedGaugeProps {
  value: number;
  classification: string;
}

/**
 * Semicircle SVG gauge for the Fear & Greed Index.
 * Renders a gradient arc from red (fear) to green (greed)
 * with a needle indicator pointing to the current value.
 */
export default function FearGreedGauge({ value, classification }: FearGreedGaugeProps) {
  // Clamp value to 0-100
  const clamped = Math.max(0, Math.min(100, value));

  // Convert value (0-100) to an angle on the semicircle.
  // 0 = left (180deg), 100 = right (0deg)
  const angleRad = Math.PI * (1 - clamped / 100);

  // Needle endpoint on arc (center at 40,44, radius 34)
  const cx = 40;
  const cy = 44;
  const r = 34;
  const needleX = cx + r * Math.cos(angleRad);
  const needleY = cy - r * Math.sin(angleRad);

  const color = FEAR_GREED_COLORS[classification] ?? '#ffd700';

  return (
    <div className="flex flex-col items-center gap-0.5">
      <svg
        viewBox="0 0 80 48"
        width={80}
        height={48}
        className="overflow-visible"
        aria-label={`Fear and Greed Index: ${clamped} - ${classification}`}
      >
        <defs>
          <linearGradient id="fgGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ff4d4f" />
            <stop offset="25%" stopColor="#ff8c00" />
            <stop offset="50%" stopColor="#ffd700" />
            <stop offset="75%" stopColor="#90ee90" />
            <stop offset="100%" stopColor="#00c076" />
          </linearGradient>
        </defs>

        {/* Background arc track */}
        <path
          d={describeArc(cx, cy, r, 180, 0)}
          fill="none"
          stroke="#2a2a32"
          strokeWidth={6}
          strokeLinecap="round"
        />

        {/* Gradient arc */}
        <path
          d={describeArc(cx, cy, r, 180, 0)}
          fill="none"
          stroke="url(#fgGradient)"
          strokeWidth={6}
          strokeLinecap="round"
        />

        {/* Needle line */}
        <line
          x1={cx}
          y1={cy}
          x2={needleX}
          y2={needleY}
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
        />

        {/* Needle circle at tip */}
        <circle cx={needleX} cy={needleY} r={2.5} fill={color} />

        {/* Center dot */}
        <circle cx={cx} cy={cy} r={2} fill="#9ca3af" />

        {/* Value text */}
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          className="fill-white text-[10px] font-mono font-bold"
        >
          {clamped}
        </text>
      </svg>

      <span
        className="text-[10px] font-medium leading-none"
        style={{ color }}
      >
        {classification}
      </span>
    </div>
  );
}

/**
 * Generate an SVG arc path from startAngle to endAngle (degrees).
 * 0deg = right (3 o'clock), 180deg = left (9 o'clock).
 */
function describeArc(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
): string {
  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;

  const x1 = cx + radius * Math.cos(startRad);
  const y1 = cy - radius * Math.sin(startRad);
  const x2 = cx + radius * Math.cos(endRad);
  const y2 = cy - radius * Math.sin(endRad);

  const largeArc = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
  // Sweep flag: 0 = counterclockwise (from left to right along top)
  return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 0 ${x2} ${y2}`;
}
