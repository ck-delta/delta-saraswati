'use client';

import { usePathname } from 'next/navigation';
import { Menu, ExternalLink, User } from 'lucide-react';
import { useUIStore } from '@/stores/ui-store';

// ---------------------------------------------------------------------------
// Page title mapping
// ---------------------------------------------------------------------------

function getPageTitle(pathname: string): string {
  if (pathname === '/') return 'Daily Pulse';
  if (pathname.startsWith('/research')) return 'Research';
  if (pathname.startsWith('/chat')) return 'Chat';
  return 'Delta Saraswati';
}

// ---------------------------------------------------------------------------
// Header Component
// ---------------------------------------------------------------------------

export default function Header() {
  const pathname = usePathname();
  const title = getPageTitle(pathname);
  const setMobileMenuOpen = useUIStore((s) => s.setMobileMenuOpen);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-6 h-14 bg-[#08090a] border-b border-[#1e2024]">
      {/* Left section: Hamburger (mobile) + Page title */}
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg text-[#8b8f99] hover:text-[#eaedf3] hover:bg-[#181a1d] transition-colors duration-150"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        <h1 className="text-base font-semibold tracking-tight text-[#eaedf3]">
          {title}
        </h1>
      </div>

      {/* Right section: Live indicator + Trade button + User avatar */}
      <div className="flex items-center gap-3">
        {/* Live indicator */}
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22c55e]" />
          </span>
          <span className="text-xs font-medium text-[#22c55e]">Live</span>
        </div>

        {/* Trade button */}
        <a
          href="https://www.delta.exchange"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1.5 bg-[#f7931a] hover:bg-[#ffaa3b] text-[#08090a] font-medium text-sm px-4 py-1.5 rounded-lg transition-colors duration-150"
        >
          Trade
          <ExternalLink size={13} />
        </a>

        {/* User avatar */}
        <button
          className="flex items-center justify-center w-8 h-8 rounded-full bg-[#181a1d] border border-[#1e2024] text-[#8b8f99] hover:text-[#eaedf3] hover:border-[#2a2d33] transition-colors duration-150"
          title="Account"
        >
          <User size={15} />
        </button>
      </div>
    </header>
  );
}
