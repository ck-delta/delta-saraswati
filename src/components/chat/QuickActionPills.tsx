'use client';

import {
  BarChart3,
  TrendingUp,
  Newspaper,
  Fish,
  Flame,
  Percent,
  type LucideIcon,
} from 'lucide-react';
import { QUICK_ACTIONS } from '@/lib/constants';

const ICON_MAP: Record<string, LucideIcon> = {
  BarChart3,
  TrendingUp,
  Newspaper,
  Fish,
  Flame,
  Percent,
};

interface QuickActionPillsProps {
  onAction: (prompt: string, contextType: string) => void;
}

export function QuickActionPills({ onAction }: QuickActionPillsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
      {QUICK_ACTIONS.map((action) => {
        const Icon = ICON_MAP[action.icon];
        return (
          <button
            key={action.id}
            onClick={() => onAction(action.prompt, action.contextType)}
            className="flex shrink-0 items-center gap-2 text-xs transition-colors duration-150 cursor-pointer"
            style={{
              padding: '6px 12px',
              background: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              borderRadius: 'var(--radius-pill)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-tertiary)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--bg-secondary)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            {Icon && <Icon className="size-3.5" />}
            <span>{action.label}</span>
          </button>
        );
      })}
    </div>
  );
}
