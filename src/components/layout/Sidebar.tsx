'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Search,
  MessageCircle,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
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
  { label: 'Daily Pulse', href: '/', icon: Home },
  { label: 'Research', href: '/research', icon: Search },
  { label: 'Chat', href: '/chat', icon: MessageCircle },
] as const;

// ---------------------------------------------------------------------------
// Shared sidebar content (used by both desktop & mobile)
// ---------------------------------------------------------------------------

function SidebarContent({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();
  const { theme, toggleTheme, toggleSidebar } = useUIStore();

  return (
    <>
      {/* ---- Logo ---- */}
      <div className="flex items-center gap-2.5 px-4 h-14 border-b" style={{ borderColor: 'var(--sidebar-border)' }}>
        <img
          src="/logo.svg"
          alt="Delta Saraswati"
          width={32}
          height={32}
          className="flex-shrink-0 w-8 h-8"
        />
        {!collapsed && (
          <span className="text-sm font-semibold tracking-wide" style={{ color: 'var(--foreground)' }}>
            Saraswati
          </span>
        )}
      </div>

      {/* ---- Navigation ---- */}
      <nav className="flex-1 flex flex-col gap-1 px-2 py-4">
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
                transition-smooth transition-colors duration-150
                ${isActive
                  ? 'bg-delta-surface text-delta-accent'
                  : 'text-delta-text-secondary hover:bg-delta-surface hover:text-[var(--foreground)]'
                }
              `}
              title={collapsed ? item.label : undefined}
            >
              {isActive && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-delta-accent"
                  aria-hidden
                />
              )}

              <Icon
                size={20}
                className={`flex-shrink-0 ${isActive ? 'text-delta-accent' : ''}`}
              />

              {!collapsed && (
                <span className="text-sm font-medium truncate">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ---- Bottom controls ---- */}
      <div className="flex flex-col gap-1 px-2 pb-4 border-t pt-3" style={{ borderColor: 'var(--sidebar-border)' }}>
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-delta-text-secondary hover:bg-delta-surface hover:text-[var(--foreground)] transition-smooth transition-colors duration-150"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? (
            <Sun size={20} className="flex-shrink-0" />
          ) : (
            <Moon size={20} className="flex-shrink-0" />
          )}
          {!collapsed && (
            <span className="text-sm font-medium">
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </span>
          )}
        </button>

        {/* Collapse toggle — only on desktop */}
        {onNavigate === undefined && (
          <button
            onClick={toggleSidebar}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-delta-text-secondary hover:bg-delta-surface hover:text-[var(--foreground)] transition-smooth transition-colors duration-150"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight size={20} className="flex-shrink-0" />
            ) : (
              <ChevronLeft size={20} className="flex-shrink-0" />
            )}
            {!collapsed && (
              <span className="text-sm font-medium">Collapse</span>
            )}
          </button>
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Desktop Sidebar (hidden on mobile)
// ---------------------------------------------------------------------------

export default function Sidebar() {
  const { sidebarCollapsed, hydrated, hydrate } = useUIStore();

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  const width = sidebarCollapsed ? 'w-16' : 'w-60';

  return (
    <aside
      className={`${width} hidden md:flex flex-shrink-0 h-screen sticky top-0 flex-col border-r transition-[width] duration-200 ease-in-out`}
      style={{
        backgroundColor: 'var(--sidebar)',
        borderColor: 'var(--sidebar-border)',
      }}
    >
      <SidebarContent collapsed={sidebarCollapsed} />
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Mobile Sidebar (Sheet overlay, visible only on mobile)
// ---------------------------------------------------------------------------

export function MobileSidebar() {
  const mobileMenuOpen = useUIStore((s) => s.mobileMenuOpen);
  const setMobileMenuOpen = useUIStore((s) => s.setMobileMenuOpen);

  return (
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SheetContent
        side="left"
        showCloseButton={false}
        className="w-64 p-0 flex flex-col"
        style={{
          backgroundColor: 'var(--sidebar)',
          borderColor: 'var(--sidebar-border)',
        }}
      >
        <SheetTitle className="sr-only">Navigation menu</SheetTitle>
        <SidebarContent collapsed={false} onNavigate={() => setMobileMenuOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
