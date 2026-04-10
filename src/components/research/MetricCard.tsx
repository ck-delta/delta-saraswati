'use client';

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: ReactNode;
}

const trendConfig = {
  up: { icon: TrendingUp, color: 'text-[#22c55e]' },
  down: { icon: TrendingDown, color: 'text-[#ef4444]' },
  neutral: { icon: Minus, color: 'text-[#8b8f99]' },
} as const;

export function MetricCard({ title, value, subtitle, trend, icon }: MetricCardProps) {
  const trendInfo = trend ? trendConfig[trend] : null;

  return (
    <div className="bg-[#111214] border border-[#1e2024] rounded-xl p-4 flex flex-col gap-1.5 hover:border-[#2a2d33] transition-colors duration-150">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#555a65] uppercase tracking-wider">{title}</span>
        {icon && <span className="text-[#555a65]">{icon}</span>}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-lg font-mono font-semibold text-[#eaedf3]">
          {value}
        </span>
        {trendInfo && (
          <trendInfo.icon className={cn('h-4 w-4', trendInfo.color)} />
        )}
      </div>

      {subtitle && (
        <span
          className={cn(
            'text-xs font-mono',
            trend === 'up'
              ? 'text-[#22c55e]'
              : trend === 'down'
                ? 'text-[#ef4444]'
                : 'text-[#8b8f99]',
          )}
        >
          {subtitle}
        </span>
      )}
    </div>
  );
}
