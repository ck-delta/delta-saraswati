"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Menu, User, Wallet } from "@/components/icons";
import { useAppStore } from "@/store/app-store";

export function Header() {
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    handler();
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header className={`sticky top-0 z-50 flex h-14 items-center justify-between border-b px-4 transition-all duration-300 ${
      scrolled
        ? "border-white/[0.08] bg-[#08080c]/80 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.3)]"
        : "border-white/[0.06] bg-[#08080c]"
    }`}>
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
          whileHover={{ scale: 1.03, boxShadow: "0 0 20px rgba(245,158,11,0.25)" }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-[#08080c] transition-all"
          style={{ background: "linear-gradient(135deg, #F59E0B 0%, #F97316 100%)" }}
        >
          <Wallet className="size-3.5" />
          Deposit INR
        </motion.button>

        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1a1c26]">
          <User className="h-4 w-4 text-[#8E8E93]" />
        </div>
      </div>
    </header>
  );
}
