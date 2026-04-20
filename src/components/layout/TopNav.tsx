'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, Search, User, X } from 'lucide-react';

// ---------------------------------------------------------------------------
// Navigation items
// ---------------------------------------------------------------------------

const NAV_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'Research', href: '/research' },
  { label: 'Chat', href: '/chat' },
] as const;

function isActiveRoute(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname.startsWith(href);
}

// ---------------------------------------------------------------------------
// Orange "D" badge
// ---------------------------------------------------------------------------

function DeltaBadge() {
  return (
    <div
      className="flex items-center justify-center flex-shrink-0 font-bold select-none"
      style={{
        width: 28,
        height: 28,
        background: 'var(--brand-bg)',
        color: 'var(--text-on-bg)',
        borderRadius: 'var(--radius-md)',
        fontSize: 15,
        letterSpacing: '-0.02em',
      }}
      aria-hidden
    >
      D
    </div>
  );
}

// ---------------------------------------------------------------------------
// Desktop nav link (center section)
// ---------------------------------------------------------------------------

function NavLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className="relative flex items-center h-14 text-sm font-medium transition-colors duration-150"
      style={{
        padding: '0 16px',
        color: active ? 'var(--brand-text)' : 'var(--text-secondary)',
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.color = 'var(--text-primary)';
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.color = 'var(--text-secondary)';
      }}
    >
      {label}
      {active && (
        <span
          aria-hidden
          className="absolute left-0 right-0 -bottom-px h-0.5"
          style={{ background: 'var(--brand-bg)' }}
        />
      )}
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Top Nav
// ---------------------------------------------------------------------------

export default function TopNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header
        className="sticky top-0 z-50 flex items-center h-14 px-4 md:px-6"
        style={{
          background: 'var(--bg-header)',
          borderBottom: '1px solid var(--divider-primary)',
        }}
      >
        {/* ──── Left: brand ──── */}
        <Link
          href="/"
          className="flex items-center gap-2.5 shrink-0"
          aria-label="Saraswati home"
        >
          <DeltaBadge />
          <span
            className="text-sm font-semibold tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            Saraswati
          </span>
        </Link>

        {/* ──── Center: nav links (desktop) ──── */}
        <nav className="hidden lg:flex items-center ml-8 h-full">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              active={isActiveRoute(pathname, item.href)}
            />
          ))}
        </nav>

        {/* ──── Right: search + profile (+ mobile hamburger) ──── */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Search pill (desktop) */}
          <div
            className="hidden md:flex items-center gap-2 px-3 h-9 w-64"
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--divider-primary)',
              borderRadius: 'var(--radius-pill)',
            }}
          >
            <Search size={14} style={{ color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              placeholder="Search BTC, ETH..."
              className="flex-1 bg-transparent text-sm outline-none border-0 placeholder:opacity-70"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>

          {/* Profile placeholder */}
          <button
            className="flex items-center justify-center transition-colors duration-150"
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-pill)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--bg-tertiary)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--bg-secondary)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
            aria-label="Account"
          >
            <User size={15} />
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="lg:hidden flex items-center justify-center transition-colors duration-150"
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-secondary)',
            }}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      {/* ──── Mobile menu dropdown ──── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed top-14 left-0 right-0 z-40 animate-fade-in"
          style={{
            background: 'var(--bg-header)',
            borderBottom: '1px solid var(--divider-primary)',
          }}
        >
          <nav className="flex flex-col px-2 py-2">
            {NAV_ITEMS.map((item) => {
              const active = isActiveRoute(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center h-11 px-3 text-sm font-medium transition-colors duration-150"
                  style={{
                    borderRadius: 'var(--radius-md)',
                    background: active ? 'var(--brand-bg-muted)' : 'transparent',
                    color: active ? 'var(--brand-text)' : 'var(--text-secondary)',
                  }}
                >
                  {item.label}
                </Link>
              );
            })}

            {/* Mobile search */}
            <div
              className="flex md:hidden items-center gap-2 mt-2 px-3 h-9"
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--divider-primary)',
                borderRadius: 'var(--radius-pill)',
              }}
            >
              <Search size={14} style={{ color: 'var(--text-tertiary)' }} />
              <input
                type="text"
                placeholder="Search BTC, ETH..."
                className="flex-1 bg-transparent text-sm outline-none border-0"
                style={{ color: 'var(--text-primary)' }}
              />
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
