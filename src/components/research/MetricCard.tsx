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
  up: { icon: TrendingUp, color: 'text-[#00c076]' },
  down: { icon: TrendingDown, color: 'text-[#ff4d4f]' },
  neutral: { icon: Minus, color: 'text-[#9ca3af]' },
} as const;

export function MetricCard({ title, value, subtitle, trend, icon }: MetricCardProps) {
  const trendInfo = trend ? trendConfig[trend] : null;

  return (
    <div className="bg-[#1a1a1f] border border-[#2a2a32] rounded-lg p-4 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#6b7280] uppercase tracking-wider">{title}</span>
        {icon && <span className="text-[#6b7280]">{icon}</span>}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-lg font-mono font-semibold text-white">
          {value}
        </span>
        {trendInfo && (
          <trendInfo.icon className={cn('h-4 w-4', trendInfo.color)} />
        )}
      </div>

      {subtitle && (
        <span className={cn(
          'text-xs font-mono',
          trend === 'up' ? 'text-[#00c076]' : trend === 'down' ? 'text-[#ff4d4f]' : 'text-[#9ca3af]',
        )}>
          {subtitle}
        </span>
      )}
    </div>
  );
}
