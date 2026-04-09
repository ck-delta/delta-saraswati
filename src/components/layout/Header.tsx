'use client';

import { usePathname } from 'next/navigation';
import { User, Plus } from 'lucide-react';

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

  return (
    <header
      className="sticky top-0 z-30 flex items-center justify-between px-6 h-14 border-b backdrop-blur-sm"
      style={{
        backgroundColor: 'var(--sidebar)',
        borderColor: 'var(--sidebar-border)',
      }}
    >
      {/* Left: Page title */}
      <div className="flex items-center gap-3">
        <h1 className="text-base font-semibold" style={{ color: 'var(--foreground)' }}>
          {title}
        </h1>

        {/* Live indicator */}
        <div className="flex items-center gap-1.5 ml-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-delta-buy opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-delta-buy" />
          </span>
          <span className="text-xs font-medium text-delta-buy">Live</span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Deposit button (mock) */}
        <button
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors duration-150 hover:opacity-90"
          style={{
            backgroundColor: 'var(--primary)',
            color: 'var(--primary-foreground)',
          }}
        >
          <Plus size={14} />
          Deposit
        </button>

        {/* User avatar placeholder */}
        <button
          className="flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-150"
          style={{
            backgroundColor: 'var(--secondary)',
            color: 'var(--muted-foreground)',
          }}
          title="Account"
        >
          <User size={16} />
        </button>
      </div>
    </header>
  );
}
