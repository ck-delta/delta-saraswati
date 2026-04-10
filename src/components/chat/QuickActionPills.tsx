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
            className="flex shrink-0 items-center gap-2 rounded-full border border-[#1e2024] bg-[#111214] px-4 py-2 text-sm text-[#8b8f99] transition-all duration-150 hover:border-[#f7931a]/40 hover:text-[#eaedf3] cursor-pointer"
          >
            {Icon && <Icon className="size-4" />}
            <span>{action.label}</span>
          </button>
        );
      })}
    </div>
  );
}
