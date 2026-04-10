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
      const defaultToken = allTickers.find(t => t.symbol === 'BTCUSDT')?.symbol ?? allTickers[0]?.symbol;
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
    <div className="flex flex-col h-full bg-[#0d0e10]">
      {/* Header */}
      <div className="p-4 border-b border-[#1e2024]">
        <h2 className="text-xs uppercase tracking-wider text-[#555a65] mb-2">
          Select Token
        </h2>

        {/* Selected token display / toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'w-full flex items-center justify-between gap-2 p-3 rounded-lg',
            'bg-[#111214] border border-[#1e2024] hover:border-[#2a2d33]',
            'transition-colors duration-150 cursor-pointer text-left',
          )}
        >
          {selectedData ? (
            <div className="flex flex-col gap-0.5 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#eaedf3] truncate">
                  {selectedData.symbol}
                </span>
                <span className="text-xs text-[#555a65] truncate">
                  {tokenInfo?.name ?? selectedData.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[#eaedf3]">
                  {formatPrice(selectedData.price)}
                </span>
                <span
                  className={cn(
                    'text-xs font-mono',
                    selectedData.priceChangePct24h >= 0
                      ? 'text-[#22c55e]'
                      : 'text-[#ef4444]',
                  )}
                >
                  {formatPercent(selectedData.priceChangePct24h)}
                </span>
              </div>
            </div>
          ) : (
            <span className="text-sm text-[#555a65]">Select a token...</span>
          )}
          <ChevronDown
            className={cn(
              'h-4 w-4 text-[#555a65] shrink-0 transition-transform duration-150',
              isOpen && 'rotate-180',
            )}
          />
        </button>
      </div>

      {/* Dropdown / Token list */}
      {isOpen && (
        <div className="flex flex-col flex-1 min-h-0">
          {/* Search input */}
          <div className="p-3 border-b border-[#1e2024]">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#555a65]" />
              <input
                placeholder="Search tokens..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                className="w-full pl-8 pr-8 h-8 text-sm bg-[#111214] border border-[#1e2024] rounded-lg text-[#eaedf3] placeholder-[#555a65] outline-none focus:border-[#f7931a]/50 transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#555a65] hover:text-[#eaedf3]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Token list */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-2">
              {loadingMarket ? (
                <div className="space-y-2 p-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-10 w-full rounded-lg bg-[#111214] animate-pulse" />
                  ))}
                </div>
              ) : filteredTokens.length === 0 ? (
                <p className="text-xs text-[#555a65] text-center py-4">
                  No tokens found
                </p>
              ) : (
                filteredTokens.map((token) => {
                  const info = TOKEN_INFO[token.symbol];
                  const isSelected = token.symbol === selectedToken;

                  return (
                    <button
                      key={token.symbol}
                      onClick={() => handleSelect(token.symbol)}
                      className={cn(
                        'w-full flex items-center justify-between p-2.5 rounded-lg text-left',
                        'transition-colors duration-150 cursor-pointer',
                        isSelected
                          ? 'bg-[#f7931a]/8 text-[#f7931a] border-l-2 border-[#f7931a]'
                          : 'text-[#8b8f99] hover:bg-[#111214] hover:text-[#eaedf3]',
                      )}
                    >
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              'text-sm font-medium truncate',
                              isSelected ? 'text-[#f7931a]' : 'text-[#eaedf3]',
                            )}
                          >
                            {token.symbol}
                          </span>
                          {info && (
                            <span className="text-[10px] text-[#555a65] truncate">
                              {info.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-0.5 shrink-0">
                        <span
                          className={cn(
                            'text-xs font-mono',
                            isSelected ? 'text-[#f7931a]' : 'text-[#eaedf3]',
                          )}
                        >
                          {formatPrice(token.price)}
                        </span>
                        <span
                          className={cn(
                            'text-[10px] font-mono',
                            token.priceChangePct24h >= 0
                              ? 'text-[#22c55e]'
                              : 'text-[#ef4444]',
                          )}
                        >
                          {formatPercent(token.priceChangePct24h)}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* When closed, show a compact scrollable list */}
      {!isOpen && (
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            {loadingMarket ? (
              <div className="space-y-2 p-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-8 w-full rounded-lg bg-[#111214] animate-pulse" />
                ))}
              </div>
            ) : (
              allTickers
                .filter((t) => t.symbol.endsWith('USD') || t.symbol.endsWith('USDT'))
                .slice(0, 20)
                .map((token) => {
                  const isSelected = token.symbol === selectedToken;
                  return (
                    <button
                      key={token.symbol}
                      onClick={() => handleSelect(token.symbol)}
                      className={cn(
                        'w-full flex items-center justify-between p-2 rounded-lg text-left',
                        'transition-colors duration-150 cursor-pointer',
                        isSelected
                          ? 'bg-[#f7931a]/8 border-l-2 border-[#f7931a] text-[#f7931a]'
                          : 'text-[#8b8f99] hover:bg-[#111214] hover:text-[#eaedf3]',
                      )}
                    >
                      <span
                        className={cn(
                          'text-xs truncate',
                          isSelected ? 'text-[#f7931a] font-medium' : '',
                        )}
                      >
                        {token.symbol}
                      </span>
                      <span
                        className={cn(
                          'text-[10px] font-mono shrink-0',
                          token.priceChangePct24h >= 0
                            ? 'text-[#22c55e]'
                            : 'text-[#ef4444]',
                        )}
                      >
                        {formatPercent(token.priceChangePct24h)}
                      </span>
                    </button>
                  );
                })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
