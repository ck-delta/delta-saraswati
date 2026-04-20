'use client';

import { type ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: ReactNode;
}

function trendColor(trend?: 'up' | 'down' | 'neutral'): string {
  if (trend === 'up') return 'var(--positive-text)';
  if (trend === 'down') return 'var(--negative-text)';
  return 'var(--text-secondary)';
}

const TREND_ICON = {
  up: TrendingUp,
  down: TrendingDown,
  neutral: Minus,
} as const;

export function MetricCard({
  title,
  value,
  subtitle,
  trend,
  icon,
}: MetricCardProps) {
  const TrendIcon = trend ? TREND_ICON[trend] : null;
  const color = trendColor(trend);

  return (
    <div
      className="flex flex-col gap-1.5 p-4 transition-colors duration-150"
      style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--bg-secondary)',
        borderRadius: 'var(--radius-2xl)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--bg-tertiary)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--bg-secondary)';
      }}
    >
      <div className="flex items-center justify-between">
        <span
          className="text-[11px] uppercase tracking-wider"
          style={{ color: 'var(--text-secondary)' }}
        >
          {title}
        </span>
        {icon && (
          <span style={{ color: 'var(--text-tertiary)' }}>{icon}</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span
          className="font-mono-num font-semibold"
          style={{ fontSize: 18, color: 'var(--text-primary)' }}
        >
          {value}
        </span>
        {TrendIcon && (
          <TrendIcon className="h-4 w-4" style={{ color }} />
        )}
      </div>

      {subtitle && (
        <span className="font-mono-num text-xs" style={{ color }}>
          {subtitle}
        </span>
      )}
    </div>
  );
}
