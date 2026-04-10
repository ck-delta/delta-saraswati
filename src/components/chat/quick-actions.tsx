"use client";

import { motion } from "framer-motion";
import { Gauge, TrendingUp, TrendingDown, Newspaper, Fish, Flame } from "@/components/icons";
import type { IconComponent } from "@/components/icons";
import { QUICK_ACTIONS } from "@/types/chat";

const iconMap: Record<string, IconComponent> = {
  gauge: Gauge,
  "trending-up": TrendingUp,
  "trending-down": TrendingDown,
  newspaper: Newspaper,
  fish: Fish,
  flame: Flame,
};

interface QuickActionsProps {
  onAction: (prompt: string) => void;
  disabled: boolean;
}

export function QuickActions({ onAction, disabled }: QuickActionsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {QUICK_ACTIONS.map((action) => {
        const Icon = action.icon ? iconMap[action.icon] : null;

        return (
          <motion.button
            key={action.label}
            whileTap={{ scale: 0.95 }}
            onClick={() => onAction(action.prompt)}
            disabled={disabled}
            className={`
              flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border
              px-3 py-1.5 text-sm text-text-secondary transition-colors
              hover:border-amber-500 hover:bg-[rgba(245,158,11,0.05)]
              disabled:pointer-events-none disabled:opacity-50
            `}
          >
            {Icon && <Icon className="h-3.5 w-3.5" />}
            {action.label}
          </motion.button>
        );
      })}
    </div>
  );
}
