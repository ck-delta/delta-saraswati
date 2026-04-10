"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Bot } from "@/components/icons";

interface TypingIndicatorProps {
  visible: boolean;
}

export function TypingIndicator({ visible }: TypingIndicatorProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.15 }}
          className="flex justify-start"
        >
          <div className="flex items-start gap-2.5">
            <div className="size-6 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
              <Bot className="size-3.5 text-amber-500" />
            </div>
          <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-card px-4 py-3">
            {[0, 0.15, 0.3].map((delay, i) => (
              <motion.div
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-text-tertiary"
                animate={{ y: [0, -4, 0] }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
