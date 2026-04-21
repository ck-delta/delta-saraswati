'use client';

// Cell-signal-style bars for the AI Signal confidence indicator.
// 4 bars total, rising height. Filled proportional to percent (50-95%).

interface Props {
  /** 0-100 confidence. */
  percent: number;
  color: string;
  size?: number;
  className?: string;
}

export default function SignalBars({ percent, color, size = 14, className }: Props) {
  // Map percent → number of filled bars.
  // Confidence range is 50-95% by convention, so normalise within that window
  // for more visual granularity.
  const pct = Math.max(0, Math.min(100, percent));
  const norm = Math.max(0, Math.min(1, (pct - 45) / 50)); // 50% → 0.10, 95% → 1.00
  const filledBars = Math.max(1, Math.round(norm * 4));

  const barWidth = size * 0.18;
  const gap = size * 0.08;
  const totalW = barWidth * 4 + gap * 3;
  const baseline = size;

  const heights = [size * 0.35, size * 0.55, size * 0.75, size * 0.95];

  return (
    <svg
      width={totalW}
      height={size}
      viewBox={`0 0 ${totalW} ${size}`}
      className={className}
      aria-label={`Confidence ${percent}%`}
      role="img"
    >
      {heights.map((h, i) => {
        const x = i * (barWidth + gap);
        const y = baseline - h;
        const filled = i < filledBars;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barWidth}
            height={h}
            rx={barWidth * 0.2}
            fill={filled ? color : 'rgba(255,255,255,0.14)'}
            style={{ transition: 'fill 0.3s' }}
          />
        );
      })}
    </svg>
  );
}
