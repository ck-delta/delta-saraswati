"use client";

import { motion } from "framer-motion";
import { Menu, User } from "@/components/icons";
import { useAppStore } from "@/store/app-store";

export function Header() {
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-white/[0.06] bg-[#08080c] px-4">
      {/* Left: mobile hamburger + title */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="flex md:hidden items-center justify-center h-8 w-8 rounded-lg text-[#8E8E93] hover:text-[#F2F2F7] transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold text-[#F2F2F7] md:hidden">
          Delta Saraswati
        </span>
      </div>

      {/* Right: deposit button + avatar */}
      <div className="flex items-center gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="rounded-lg bg-[#F59E0B] px-3 py-1.5 text-xs font-semibold text-[#08080c] transition-colors hover:bg-[#F59E0B]/90"
        >
          Deposit INR
        </motion.button>

        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1a1c26]">
          <User className="h-4 w-4 text-[#8E8E93]" />
        </div>
      </div>
    </header>
  );
}
