"use client";

import { useAnimatedPercentage } from "@/lib/motion/hooks";
import { getFearGreedColor } from "@/lib/utils";
import { AlertTriangle } from "@/components/icons";

interface FearGreedGaugeProps {
  value: number;
  label: string;
}

export function FearGreedGauge({ value, label }: FearGreedGaugeProps) {
  const animatedValue = useAnimatedPercentage(value, 0.2);
  const color = getFearGreedColor(value);

  const size = 80;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 32;
  const strokeWidth = 6;
  const startAngle = 135;
  const totalAngle = 270;

  const polarToCartesian = (angle: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    };
  };

  const describeArc = (endAngleDeg: number) => {
    const start = polarToCartesian(startAngle);
    const end = polarToCartesian(endAngleDeg);
    const largeArcFlag = endAngleDeg - startAngle > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
  };

  const displayValue = animatedValue > 1 ? Math.round(animatedValue) : value;
  const arcValue = animatedValue > 0.5 ? animatedValue : 0;
  const fillAngle = startAngle + (totalAngle * Math.min(arcValue, 100)) / 100;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background track */}
        <path
          d={describeArc(startAngle + totalAngle)}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="text-muted/40"
        />
        {/* Filled arc */}
        {arcValue > 0.5 && (
          <path
            d={describeArc(fillAngle)}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        )}
        {/* Center value — show actual value immediately, animate arc only */}
        <text
          x={cx}
          y={cy - 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill={color}
          className="font-bold font-mono"
          fontSize="18"
          fontWeight="700"
        >
          {displayValue}
        </text>
        {/* Label */}
        <text
          x={cx}
          y={cy + 16}
          textAnchor="middle"
          dominantBaseline="central"
          className="text-text-tertiary"
          fill="currentColor"
          fontSize="8"
          fontWeight="500"
        >
          {label}
        </text>
      </svg>
      {value <= 25 && (
        <div className="flex items-center gap-1 -mt-1">
          <AlertTriangle className="size-3 text-[#F6465D]" />
          <span className="text-[9px] font-medium text-[#F6465D]">{label}</span>
        </div>
      )}
    </div>
  );
}
