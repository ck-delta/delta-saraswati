"use client";

import { useState, useCallback, type KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { ArrowUp } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  }, [value, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask anything about crypto..."
        disabled={disabled}
        className={`
          flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-sm
          text-text-primary placeholder:text-text-tertiary
          focus:outline-none focus:ring-2 focus:ring-amber-500/40
          disabled:opacity-50
        `}
      />
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        className={`
          flex h-9 w-9 shrink-0 items-center justify-center rounded-full
          bg-primary text-primary-foreground
          disabled:opacity-50 disabled:pointer-events-none
        `}
      >
        <ArrowUp className="h-4 w-4" />
      </motion.button>
    </div>
  );
}
