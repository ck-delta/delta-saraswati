'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, MessageCircle } from 'lucide-react';
import { useUIStore } from '@/stores/ui-store';
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet';

// ---------------------------------------------------------------------------
// Navigation items
// ---------------------------------------------------------------------------

const NAV_ITEMS = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Research', href: '/research', icon: Search },
  { label: 'Chat', href: '/chat', icon: MessageCircle },
] as const;

// ---------------------------------------------------------------------------
// Delta triangle logo SVG
// ---------------------------------------------------------------------------

function DeltaLogo() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="flex-shrink-0"
    >
      <path
        d="M16 3L29 27H3L16 3Z"
        fill="#f7931a"
        fillOpacity="0.9"
      />
      <path
        d="M16 9L23 24H9L16 9Z"
        fill="#08090a"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Shared sidebar content (desktop & mobile)
// ---------------------------------------------------------------------------

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      {/* ---- Logo area ---- */}
      <div className="flex items-center gap-3 px-5 h-14 border-b border-[#1e2024]">
        <DeltaLogo />
        <div className="flex items-baseline gap-1.5">
          <span className="text-xs font-semibold tracking-widest uppercase text-[#8b8f99]">
            Delta
          </span>
          <span className="text-sm font-semibold tracking-wide text-[#eaedf3]">
            Saraswati
          </span>
        </div>
      </div>

      {/* ---- Navigation ---- */}
      <nav className="flex-1 flex flex-col gap-0.5 px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`
                group relative flex items-center gap-3 rounded-lg px-3 py-2.5
                text-sm font-medium transition-colors duration-150
                ${
                  isActive
                    ? 'text-[#f7931a] bg-[#f7931a]/[0.08]'
                    : 'text-[#8b8f99] hover:text-[#eaedf3] hover:bg-[#181a1d]'
                }
              `}
            >
              {/* Active left border indicator */}
              {isActive && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 rounded-r-full bg-[#f7931a]"
                  aria-hidden
                />
              )}

              <Icon
                size={18}
                className={`flex-shrink-0 ${isActive ? 'text-[#f7931a]' : 'text-[#555a65] group-hover:text-[#8b8f99]'}`}
              />

              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ---- Bottom section ---- */}
      <div className="px-5 pb-5 border-t border-[#1e2024] pt-4">
        <p className="text-[10px] font-medium tracking-wide uppercase text-[#555a65] leading-relaxed">
          Powered by Delta Exchange
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Desktop Sidebar
// ---------------------------------------------------------------------------

export default function Sidebar() {
  return (
    <aside className="w-60 hidden md:flex flex-shrink-0 h-screen sticky top-0 flex-col bg-[#0d0e10] border-r border-[#1e2024]">
      <SidebarContent />
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Mobile Sidebar (Sheet overlay)
// ---------------------------------------------------------------------------

export function MobileSidebar() {
  const mobileMenuOpen = useUIStore((s) => s.mobileMenuOpen);
  const setMobileMenuOpen = useUIStore((s) => s.setMobileMenuOpen);

  return (
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SheetContent
        side="left"
        showCloseButton={false}
        className="w-64 p-0 flex flex-col bg-[#0d0e10] border-r border-[#1e2024]"
      >
        <SheetTitle className="sr-only">Navigation menu</SheetTitle>
        <SidebarContent onNavigate={() => setMobileMenuOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
