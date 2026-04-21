'use client';

// Inline SVG token logos. Zero network calls, pixel-perfect at any size.
// Brand colors match the official reference hex codes.

import type { FC } from 'react';

export interface BrandInfo {
  color: string;
  bgTint: string;   // subtle background tint for the logo tile
  glow: string;     // radial halo color (for card corner)
}

export const TOKEN_BRANDS: Record<string, BrandInfo> = {
  BTC: { color: '#F7931A', bgTint: 'rgba(247,147,26,0.12)', glow: 'rgba(247,147,26,0.25)' },
  ETH: { color: '#627EEA', bgTint: 'rgba(98,126,234,0.12)', glow: 'rgba(98,126,234,0.25)' },
  SOL: { color: '#9945FF', bgTint: 'rgba(153,69,255,0.12)', glow: 'rgba(153,69,255,0.25)' },
  PAXG: { color: '#E5B73B', bgTint: 'rgba(229,183,59,0.12)', glow: 'rgba(229,183,59,0.22)' },
  XRP: { color: '#00AAE4', bgTint: 'rgba(0,170,228,0.12)', glow: 'rgba(0,170,228,0.22)' },
  DOGE: { color: '#C2A633', bgTint: 'rgba(194,166,51,0.12)', glow: 'rgba(194,166,51,0.22)' },
};

export const DEFAULT_BRAND: BrandInfo = {
  color: '#8b8f99',
  bgTint: 'rgba(139,143,153,0.10)',
  glow: 'rgba(139,143,153,0.15)',
};

export function getBrand(underlying: string | undefined): BrandInfo {
  if (!underlying) return DEFAULT_BRAND;
  return TOKEN_BRANDS[underlying.toUpperCase()] ?? DEFAULT_BRAND;
}

// ---------------------------------------------------------------------------
// Individual token SVGs
// ---------------------------------------------------------------------------

const BTC: FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="16" fill="#F7931A" />
    <path
      d="M23.19 14.02c.32-2.12-1.28-3.26-3.47-4.02l.71-2.85-1.73-.43-.69 2.77c-.46-.11-.92-.22-1.38-.33l.7-2.79-1.73-.43-.71 2.85c-.37-.09-.74-.17-1.1-.26l-.01-.01-2.39-.6-.46 1.85s1.28.29 1.26.31c.7.17.83.64.81 1.01l-.82 3.25c.05.01.11.03.18.06l-.18-.05-1.14 4.58c-.09.21-.3.53-.78.41.02.02-1.26-.31-1.26-.31l-.86 1.98 2.26.56c.42.11.83.21 1.24.32l-.72 2.88 1.73.43.71-2.85c.47.13.93.25 1.39.36l-.71 2.84 1.74.43.72-2.87c2.95.56 5.17.33 6.11-2.33.76-2.14-.04-3.38-1.6-4.18 1.13-.26 1.98-1.01 2.21-2.56zm-3.96 5.55c-.54 2.14-4.16.99-5.33.7l.95-3.82c1.17.29 4.94.87 4.38 3.12zm.54-5.58c-.49 1.95-3.5.96-4.48.72l.86-3.46c.97.24 4.12.7 3.62 2.74z"
      fill="#FFFFFF"
    />
  </svg>
);

const ETH: FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="16" fill="#627EEA" />
    <g fill="#FFFFFF" fillRule="nonzero">
      <path fillOpacity=".602" d="M16.498 4v8.87l7.497 3.35z" />
      <path d="M16.498 4L9 16.22l7.498-3.35z" />
      <path fillOpacity=".602" d="M16.498 21.968v6.027L24 17.616z" />
      <path d="M16.498 27.995v-6.028L9 17.616z" />
      <path fillOpacity=".2" d="M16.498 20.573l7.497-4.353-7.497-3.348z" />
      <path fillOpacity=".602" d="M9 16.22l7.498 4.353v-7.701z" />
    </g>
  </svg>
);

const SOL: FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="16" fill="#000000" />
    <defs>
      <linearGradient id="sol-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#9945FF" />
        <stop offset="100%" stopColor="#14F195" />
      </linearGradient>
    </defs>
    <path d="M9.93 20.33a.6.6 0 0 1 .42-.17h12.8c.27 0 .4.33.22.52l-2.5 2.5a.6.6 0 0 1-.42.17H7.65c-.27 0-.4-.33-.22-.52l2.5-2.5z" fill="url(#sol-grad)"/>
    <path d="M9.93 8.83a.6.6 0 0 1 .42-.17h12.8c.27 0 .4.33.22.52l-2.5 2.5a.6.6 0 0 1-.42.17H7.65c-.27 0-.4-.33-.22-.52l2.5-2.5z" fill="url(#sol-grad)"/>
    <path d="M22.07 14.54a.6.6 0 0 0-.42-.17H8.85c-.27 0-.4.33-.22.52l2.5 2.5a.6.6 0 0 0 .42.17h12.8c.27 0 .4-.33.22-.52l-2.5-2.5z" fill="url(#sol-grad)"/>
  </svg>
);

const PAXG: FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="16" fill="#E5B73B" />
    <path d="M16 7L22 13L16 19L10 13Z" fill="#FFFFFF" opacity="0.9" />
    <path d="M10 13L16 19L22 13L22 21L16 25L10 21Z" fill="#FFFFFF" opacity="0.5" />
  </svg>
);

const XRP: FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="16" fill="#00AAE4" />
    <path d="M22 10 L16 14 L10 10 L11.5 8.5 L16 11.5 L20.5 8.5 Z" fill="#FFFFFF" />
    <path d="M22 22 L16 18 L10 22 L11.5 23.5 L16 20.5 L20.5 23.5 Z" fill="#FFFFFF" />
  </svg>
);

const DOGE: FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <circle cx="16" cy="16" r="16" fill="#C2A633" />
    <text x="16" y="22" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#FFFFFF" fontFamily="serif">Ð</text>
  </svg>
);

const TOKEN_SVG: Record<string, FC<{ size: number }>> = {
  BTC, ETH, SOL, PAXG, XRP, DOGE,
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface Props {
  /** Underlying symbol e.g. BTC, ETH, SOL, or any uppercase string. */
  underlying: string;
  size?: number;
}

export default function TokenLogo({ underlying, size = 36 }: Props) {
  const Svg = TOKEN_SVG[underlying.toUpperCase()];
  const brand = getBrand(underlying);

  if (Svg) {
    return (
      <div
        className="flex items-center justify-center rounded-xl shrink-0"
        style={{
          width: size + 4,
          height: size + 4,
          background: brand.bgTint,
          border: `1px solid ${brand.color}33`,
          boxShadow: `0 0 12px ${brand.glow}, inset 0 1px 0 rgba(255,255,255,0.05)`,
        }}
      >
        <Svg size={size} />
      </div>
    );
  }

  // Fallback: first letter in brand-tinted tile
  const letter = underlying.charAt(0).toUpperCase();
  return (
    <div
      className="flex items-center justify-center rounded-xl shrink-0 font-bold"
      style={{
        width: size + 4,
        height: size + 4,
        background: brand.bgTint,
        border: `1px solid ${brand.color}33`,
        color: brand.color,
        fontSize: size * 0.45,
        boxShadow: `0 0 12px ${brand.glow}, inset 0 1px 0 rgba(255,255,255,0.05)`,
      }}
    >
      {letter}
    </div>
  );
}
