"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Gauge, BarChart3, MessageCircle } from "@/components/icons";

const navItems = [
  { label: "Home", href: "/", icon: Gauge },
  { label: "Research", href: "/research", icon: BarChart3 },
  { label: "Chat", href: "/chat", icon: MessageCircle },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-white/[0.06] bg-[#08080c] pb-[env(safe-area-inset-bottom)] md:hidden">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className="relative flex flex-col items-center justify-center gap-1 px-4 py-2"
          >
            {/* Active indicator dot */}
            {isActive && (
              <motion.div
                layoutId="mobile-active"
                className="absolute -top-1 h-[3px] w-6 rounded-full bg-[#F59E0B]"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}

            <Icon
              className={`h-5 w-5 ${
                isActive ? "text-[#F59E0B]" : "text-[#636366]"
              }`}
            />

            {isActive && (
              <span className="text-[10px] font-medium text-[#F59E0B]">
                {item.label}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
