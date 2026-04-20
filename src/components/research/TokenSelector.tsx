'use client';

import { useEffect, useState, useMemo } from 'react';
import { useMarketStore } from '@/stores/market-store';
import { useResearchStore } from '@/stores/research-store';
import { TOKEN_INFO } from '@/lib/constants';
import { formatPrice, formatPercent } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Search, ChevronDown, X } from 'lucide-react';

export function TokenSelector() {
  const { allTickers, loadingMarket, fetchMarketData } = useMarketStore();
  const { selectedToken, selectToken } = useResearchStore();

  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (allTickers.length === 0 && !loadingMarket) {
      fetchMarketData();
    }
  }, [allTickers.length, loadingMarket, fetchMarketData]);

  useEffect(() => {
    if (!selectedToken && allTickers.length > 0) {
      const defaultToken =
        allTickers.find((t) => t.symbol === 'BTCUSDT')?.symbol ??
        allTickers[0]?.symbol;
      if (defaultToken) selectToken(defaultToken);
    }
  }, [selectedToken, allTickers.length, selectToken, allTickers]);

  const filteredTokens = useMemo(() => {
    const perps = allTickers.filter(
      (t) => t.symbol.endsWith('USD') || t.symbol.endsWith('USDT'),
    );
    if (!search.trim()) return perps;
    const q = search.toLowerCase();
    return perps.filter(
      (t) =>
        t.symbol.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q) ||
        t.underlying.toLowerCase().includes(q),
    );
  }, [allTickers, search]);

  const selectedData = useMemo(
    () => allTickers.find((t) => t.symbol === selectedToken),
    [allTickers, selectedToken],
  );

  const tokenInfo = selectedToken ? TOKEN_INFO[selectedToken] : null;

  function handleSelect(symbol: string) {
    selectToken(symbol);
    setIsOpen(false);
    setSearch('');
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="p-4"
        style={{ borderBottom: '1px solid var(--divider-primary)' }}
      >
        <h2
          className="text-xs uppercase tracking-wider mb-2"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Select Token
        </h2>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'w-full flex items-center justify-between gap-2 p-3',
            'transition-colors duration-150 cursor-pointer text-left',
          )}
          style={{
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            outline: isOpen ? '1px solid var(--brand-border)' : 'none',
          }}
          onMouseEnter={(e) => {
            if (!isOpen)
              e.currentTarget.style.background = 'var(--bg-tertiary)';
          }}
          onMouseLeave={(e) => {
            if (!isOpen)
              e.currentTarget.style.background = 'var(--bg-secondary)';
          }}
        >
          {selectedData ? (
            <div className="flex flex-col gap-0.5 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="text-sm font-semibold truncate"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {selectedData.symbol}
                </span>
                <span
                  className="text-xs truncate"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  {tokenInfo?.name ?? selectedData.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-mono-num"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {formatPrice(selectedData.price)}
                </span>
                <span
                  className="text-xs font-mono-num"
                  style={{
                    color:
                      selectedData.priceChangePct24h >= 0
                        ? 'var(--positive-text)'
                        : 'var(--negative-text)',
                  }}
                >
                  {formatPercent(selectedData.priceChangePct24h)}
                </span>
              </div>
            </div>
          ) : (
            <span
              className="text-sm"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Select a token...
            </span>
          )}
          <ChevronDown
            className={cn(
              'h-4 w-4 shrink-0 transition-transform duration-150',
              isOpen && 'rotate-180',
            )}
            style={{ color: 'var(--text-tertiary)' }}
          />
        </button>
      </div>

      {/* Search */}
      {isOpen && (
        <div
          className="p-3"
          style={{ borderBottom: '1px solid var(--divider-primary)' }}
        >
          <div className="relative">
            <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5"
              style={{ color: 'var(--text-tertiary)' }}
            />
            <input
              placeholder="Search tokens..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="w-full pl-8 pr-8 h-8 text-sm outline-none"
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--divider-primary)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-tertiary)' }}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Token list */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          {loadingMarket ? (
            <div className="space-y-2 p-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-10 w-full rounded-md animate-pulse"
                  style={{ background: 'var(--bg-secondary)' }}
                />
              ))}
            </div>
          ) : filteredTokens.length === 0 ? (
            <p
              className="text-xs text-center py-4"
              style={{ color: 'var(--text-tertiary)' }}
            >
              No tokens found
            </p>
          ) : (
            (isOpen ? filteredTokens : filteredTokens.slice(0, 20)).map(
              (token) => {
                const info = TOKEN_INFO[token.symbol];
                const isSelected = token.symbol === selectedToken;

                return (
                  <button
                    key={token.symbol}
                    onClick={() => handleSelect(token.symbol)}
                    className={cn(
                      'w-full flex items-center justify-between p-2.5 text-left',
                      'transition-colors duration-150 cursor-pointer',
                    )}
                    style={{
                      borderRadius: 'var(--radius-md)',
                      background: isSelected
                        ? 'var(--brand-bg-muted)'
                        : 'transparent',
                      borderLeft: isSelected
                        ? '2px solid var(--brand-bg)'
                        : '2px solid transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected)
                        e.currentTarget.style.background =
                          'var(--bg-secondary)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected)
                        e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="text-sm font-medium truncate"
                          style={{
                            color: isSelected
                              ? 'var(--brand-text)'
                              : 'var(--text-primary)',
                          }}
                        >
                          {token.symbol}
                        </span>
                        {info && (
                          <span
                            className="text-[10px] truncate"
                            style={{ color: 'var(--text-tertiary)' }}
                          >
                            {info.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-0.5 shrink-0">
                      <span
                        className="text-xs font-mono-num"
                        style={{
                          color: isSelected
                            ? 'var(--brand-text)'
                            : 'var(--text-primary)',
                        }}
                      >
                        {formatPrice(token.price)}
                      </span>
                      <span
                        className="text-[10px] font-mono-num"
                        style={{
                          color:
                            token.priceChangePct24h >= 0
                              ? 'var(--positive-text)'
                              : 'var(--negative-text)',
                        }}
                      >
                        {formatPercent(token.priceChangePct24h)}
                      </span>
                    </div>
                  </button>
                );
              },
            )
          )}
        </div>
      </div>
    </div>
  );
}
