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

// ---------------------------------------------------------------------------
// Navigation items
// ---------------------------------------------------------------------------

const NAV_ITEMS = [
  { label: 'Daily Pulse', href: '/', icon: Home },
  { label: 'Research', href: '/research', icon: Search },
  { label: 'Chat', href: '/chat', icon: MessageCircle },
] as const;

// ---------------------------------------------------------------------------
// Sidebar Component
// ---------------------------------------------------------------------------

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, sidebarCollapsed, hydrated, toggleTheme, toggleSidebar, hydrate } =
    useUIStore();

  // Hydrate UI state from localStorage on mount
  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  const width = sidebarCollapsed ? 'w-16' : 'w-60';

  return (
    <aside
      className={`${width} flex-shrink-0 h-screen sticky top-0 flex flex-col border-r transition-[width] duration-200 ease-in-out`}
      style={{
        backgroundColor: 'var(--sidebar)',
        borderColor: 'var(--sidebar-border)',
      }}
    >
      {/* ---- Logo ---- */}
      <div className="flex items-center gap-2.5 px-4 h-14 border-b" style={{ borderColor: 'var(--sidebar-border)' }}>
        {/* Delta triangle logo */}
        <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-delta-accent">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M8 2L14 14H2L8 2Z" fill="white" />
          </svg>
        </div>
        {!sidebarCollapsed && (
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
              className={`
                group relative flex items-center gap-3 rounded-lg px-3 py-2.5
                transition-colors duration-150
                ${isActive
                  ? 'bg-delta-surface text-delta-accent'
                  : 'text-delta-text-secondary hover:bg-delta-surface hover:text-[var(--foreground)]'
                }
              `}
              title={sidebarCollapsed ? item.label : undefined}
            >
              {/* Active indicator bar */}
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

              {!sidebarCollapsed && (
                <span className="text-sm font-medium truncate">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ---- Bottom controls ---- */}
      <div className="flex flex-col gap-1 px-2 pb-4 border-t pt-3" style={{ borderColor: 'var(--sidebar-border)' }}>
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-delta-text-secondary hover:bg-delta-surface hover:text-[var(--foreground)] transition-colors duration-150"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? (
            <Sun size={20} className="flex-shrink-0" />
          ) : (
            <Moon size={20} className="flex-shrink-0" />
          )}
          {!sidebarCollapsed && (
            <span className="text-sm font-medium">
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </span>
          )}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-delta-text-secondary hover:bg-delta-surface hover:text-[var(--foreground)] transition-colors duration-150"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? (
            <ChevronRight size={20} className="flex-shrink-0" />
          ) : (
            <ChevronLeft size={20} className="flex-shrink-0" />
          )}
          {!sidebarCollapsed && (
            <span className="text-sm font-medium">Collapse</span>
          )}
        </button>
      </div>
    </aside>
  );
}
