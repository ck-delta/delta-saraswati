'use client';

// Asset hero — the large identity card at the top of /research. Single
// horizontal row: big logo · name · price · 24h change · tagline.

import TokenLogo, { getBrand } from '@/components/shared/TokenLogo';
import { TOKEN_INFO } from '@/lib/constants';
import { formatPrice, formatPercent } from '@/lib/format';
import type { TokenCardData } from '@/types/market';

interface Props {
  symbol: string;
  token?: TokenCardData | null;
}

export default function AssetHero({ symbol, token }: Props) {
  const underlying = symbol.replace(/USDT?$/, '');
  const info = TOKEN_INFO[symbol];
  const displayName = info?.name ?? underlying;
  const tagline = info?.tagline ?? '';
  const brand = getBrand(underlying);

  const price = token?.price ?? 0;
  const changePct = token?.priceChangePct24h ?? 0;
  const isUp = changePct >= 0;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border px-5 lg:px-7 py-5"
      style={{
        background: `linear-gradient(135deg, ${brand.bgTint} 0%, rgba(19,20,24,0.6) 45%, rgba(16,17,20,1) 100%)`,
        borderColor: 'rgba(255,255,255,0.06)',
        boxShadow: `0 1px 0 rgba(255,255,255,0.02) inset, 0 20px 48px -28px ${brand.glow}`,
      }}
    >
      {/* Brand accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: `linear-gradient(90deg, transparent 0%, ${brand.color} 50%, transparent 100%)`,
          opacity: 0.7,
          boxShadow: `0 0 14px ${brand.glow}`,
        }}
      />
      {/* Corner halo */}
      <div
        className="absolute top-0 right-0 w-72 h-48 pointer-events-none"
        style={{ background: `radial-gradient(circle at 100% 0%, ${brand.glow} 0%, transparent 65%)` }}
      />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center gap-5 lg:gap-7">
        {/* Logo */}
        <div className="flex-shrink-0">
          <TokenLogo underlying={underlying} size={64} />
        </div>

        {/* Name + tagline */}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h1
              className="text-2xl lg:text-3xl font-black text-[#eaedf3] tracking-tight leading-none"
              style={{ textShadow: `0 0 30px ${brand.glow}` }}
            >
              {displayName}
            </h1>
            <span className="text-xs font-mono-num font-bold px-2 py-0.5 rounded"
              style={{ background: 'rgba(255,255,255,0.04)', color: '#94A3B8', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              {symbol}
            </span>
          </div>
          {tagline && (
            <p className="text-[13px] text-[#8b8f99] mt-1 max-w-2xl leading-relaxed">
              {tagline}
            </p>
          )}
        </div>

        {/* Price + change */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span
            className="font-mono-num text-[28px] lg:text-[32px] font-black text-[#eaedf3] leading-none tracking-tight"
            style={{ textShadow: '0 2px 12px rgba(0,0,0,0.4)' }}
          >
            {price > 0 ? formatPrice(price) : '—'}
          </span>
          <span
            className="font-mono-num text-sm font-bold"
            style={{ color: isUp ? '#4ADE80' : '#F87171' }}
          >
            {price > 0 ? `${isUp ? '↑' : '↓'}${Math.abs(changePct).toFixed(2)}% 24h` : ''}
          </span>
        </div>
      </div>
    </div>
  );
}
