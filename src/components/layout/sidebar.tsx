"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Triangle, Gauge, BarChart3, MessageCircle } from "lucide-react";
import { useAppStore } from "@/store/app-store";

const navItems = [
  { label: "Home", href: "/", icon: Gauge },
  { label: "Research", href: "/research", icon: BarChart3 },
  { label: "Chat", href: "/chat", icon: MessageCircle },
];

export function Sidebar() {
  const pathname = usePathname();
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed);

  return (
    <motion.aside
      className="hidden md:flex flex-col border-r border-white/[0.06] bg-[#0f1016] shrink-0"
      animate={{ width: sidebarCollapsed ? 64 : 240 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Logo */}
      <div className="flex h-14 items-center gap-3 px-4 shrink-0">
        <Triangle className="h-6 w-6 text-[#F59E0B] shrink-0" />
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="text-sm font-semibold text-[#F2F2F7] whitespace-nowrap"
            >
              Delta Saraswati
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav Items */}
      <nav className="flex flex-col gap-1 px-2 mt-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors"
            >
              {/* Active indicator bar */}
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[#F59E0B]"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}

              <Icon
                className={`h-5 w-5 shrink-0 ${
                  isActive ? "text-[#F2F2F7]" : "text-[#636366] hover:text-[#8E8E93]"
                }`}
              />

              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className={`text-sm whitespace-nowrap ${
                      isActive
                        ? "text-[#F2F2F7] font-medium"
                        : "text-[#636366] group-hover:text-[#8E8E93]"
                    }`}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>
    </motion.aside>
  );
}
