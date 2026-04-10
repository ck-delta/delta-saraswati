'use client';

interface FearGreedGaugeProps {
  value: number;
  classification: string;
}

/** Map classification to a color */
function getColor(classification: string): string {
  switch (classification) {
    case 'Extreme Fear':
      return '#ef4444';
    case 'Fear':
      return '#f97316';
    case 'Neutral':
      return '#eab308';
    case 'Greed':
      return '#22c55e';
    case 'Extreme Greed':
      return '#16a34a';
    default:
      return '#eab308';
  }
}

/**
 * Compact semicircle SVG gauge for the Fear & Greed Index.
 * 64px wide — designed to sit inline inside a token card.
 * Gradient arc from red (fear) to green (greed) with a needle.
 */
export default function FearGreedGauge({
  value,
  classification,
}: FearGreedGaugeProps) {
  const clamped = Math.max(0, Math.min(100, value));

  // Convert 0-100 to angle on semicircle: 0 = left (180deg), 100 = right (0deg)
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
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="25%" stopColor="#f97316" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="75%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#16a34a" />
          </linearGradient>
        </defs>

        {/* Background track */}
        <path
          d={describeArc(cx, cy, r, 180, 0)}
          fill="none"
          stroke="#1e2024"
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
        <circle cx={cx} cy={cy} r={1.5} fill="#555a65" />

        {/* Value */}
        <text
          x={cx}
          y={cy - 5}
          textAnchor="middle"
          className="fill-[#eaedf3] text-[9px] font-mono font-bold"
        >
          {clamped}
        </text>
      </svg>

      <span className="text-[9px] font-medium leading-none" style={{ color }}>
        {classification}
      </span>
    </div>
  );
}

/** SVG arc path from startAngle to endAngle (degrees). */
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
