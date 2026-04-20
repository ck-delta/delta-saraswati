'use client';

interface FearGreedGaugeProps {
  value: number;
  classification: string;
}

/**
 * Map classification → Delta semantic color.
 * 0-30 negative (red), 30-70 warning (yellow), 70-100 positive (green).
 */
function getColor(classification: string): string {
  switch (classification) {
    case 'Extreme Fear':
    case 'Fear':
      return 'var(--negative-text)';
    case 'Neutral':
      return 'var(--warning-text)';
    case 'Greed':
    case 'Extreme Greed':
      return 'var(--positive-text)';
    default:
      return 'var(--warning-text)';
  }
}

/**
 * Compact Fear & Greed semicircle gauge.
 */
export default function FearGreedGauge({
  value,
  classification,
}: FearGreedGaugeProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const angleRad = Math.PI * (1 - clamped / 100);
  const cx = 32;
  const cy = 34;
  const r = 26;
  const needleX = cx + r * Math.cos(angleRad);
  const needleY = cy - r * Math.sin(angleRad);
  const color = getColor(classification);

  return (
    <div className="flex flex-col items-center gap-0.5">
      <svg
        viewBox="0 0 64 38"
        width={64}
        height={38}
        className="overflow-visible"
        aria-label={`Fear and Greed: ${clamped} - ${classification}`}
      >
        <defs>
          <linearGradient id="fgArc" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--red-500)" />
            <stop offset="50%" stopColor="var(--yellow-500)" />
            <stop offset="100%" stopColor="var(--green-500)" />
          </linearGradient>
        </defs>

        {/* Background track */}
        <path
          d={describeArc(cx, cy, r, 180, 0)}
          fill="none"
          stroke="var(--bg-secondary)"
          strokeWidth={5}
          strokeLinecap="round"
        />

        {/* Gradient arc */}
        <path
          d={describeArc(cx, cy, r, 180, 0)}
          fill="none"
          stroke="url(#fgArc)"
          strokeWidth={5}
          strokeLinecap="round"
        />

        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={needleX}
          y2={needleY}
          stroke={color}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
        <circle cx={needleX} cy={needleY} r={2} fill={color} />
        <circle cx={cx} cy={cy} r={1.5} fill="var(--text-tertiary)" />

        <text
          x={cx}
          y={cy - 5}
          textAnchor="middle"
          style={{
            fill: 'var(--text-primary)',
            fontSize: 9,
            fontWeight: 700,
          }}
          className="font-mono-num"
        >
          {clamped}
        </text>
      </svg>

      <span
        className="text-[9px] font-medium leading-none"
        style={{ color }}
      >
        {classification}
      </span>
    </div>
  );
}

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
  return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 0 ${x2} ${y2}`;
}
