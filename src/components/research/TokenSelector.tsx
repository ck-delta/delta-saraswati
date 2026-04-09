'use client';

import { useEffect, useState, useMemo } from 'react';
import { useMarketStore } from '@/stores/market-store';
import { useResearchStore } from '@/stores/research-store';
import { TOKEN_INFO } from '@/lib/constants';
import { formatPrice, formatPercent } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, ChevronDown, X } from 'lucide-react';

export function TokenSelector() {
  const { allTickers, loadingMarket, fetchMarketData } = useMarketStore();
  const { selectedToken, selectToken } = useResearchStore();

  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Fetch tickers on mount if not loaded
  useEffect(() => {
    if (allTickers.length === 0 && !loadingMarket) {
      fetchMarketData();
    }
  }, [allTickers.length, loadingMarket, fetchMarketData]);

  // Default to BTCUSD if nothing selected and tickers are loaded
  useEffect(() => {
    if (!selectedToken && allTickers.length > 0) {
      selectToken('BTCUSD');
    }
  }, [selectedToken, allTickers.length, selectToken]);

  // Filter perpetual futures and apply search
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

  // Find selected token data for the header display
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
      <div className="p-4 border-b border-[#2a2a32]">
        <h2 className="text-xs uppercase tracking-wider text-[#6b7280] mb-2">
          Research Token
        </h2>

        {/* Selected token display / toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'w-full flex items-center justify-between gap-2 p-3 rounded-lg',
            'bg-[#1a1a1f] border border-[#2a2a32] hover:border-[#fd7d02]/50',
            'transition-colors cursor-pointer text-left',
          )}
        >
          {selectedData ? (
            <div className="flex flex-col gap-0.5 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white truncate">
                  {selectedData.symbol}
                </span>
                <span className="text-xs text-[#6b7280] truncate">
                  {tokenInfo?.name ?? selectedData.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-white">
                  {formatPrice(selectedData.price)}
                </span>
                <span
                  className={cn(
                    'text-xs font-mono',
                    selectedData.priceChangePct24h >= 0
                      ? 'text-[#00c076]'
                      : 'text-[#ff4d4f]',
                  )}
                >
                  {formatPercent(selectedData.priceChangePct24h)}
                </span>
              </div>
            </div>
          ) : (
            <span className="text-sm text-[#6b7280]">Select a token...</span>
          )}
          <ChevronDown
            className={cn(
              'h-4 w-4 text-[#6b7280] shrink-0 transition-transform',
              isOpen && 'rotate-180',
            )}
          />
        </button>
      </div>

      {/* Dropdown / Token list */}
      {isOpen && (
        <div className="flex flex-col flex-1 min-h-0">
          {/* Search input */}
          <div className="p-3 border-b border-[#2a2a32]">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6b7280]" />
              <Input
                placeholder="Search tokens..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-8 h-8 text-xs bg-[#1a1a1f] border-[#2a2a32] text-white placeholder:text-[#6b7280] focus-visible:ring-[#fd7d02]/50"
                autoFocus
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Token list */}
          <ScrollArea className="flex-1">
            <div className="p-2">
              {loadingMarket ? (
                <div className="space-y-2 p-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full bg-[#2a2a32]" />
                  ))}
                </div>
              ) : filteredTokens.length === 0 ? (
                <p className="text-xs text-[#6b7280] text-center py-4">
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
                        'w-full flex items-center justify-between p-2.5 rounded-md text-left',
                        'hover:bg-[#222228] transition-colors cursor-pointer',
                        isSelected && 'bg-[#222228] border border-[#fd7d02]/30',
                      )}
                    >
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-white truncate">
                            {token.symbol}
                          </span>
                          {info && (
                            <span className="text-[10px] text-[#6b7280] truncate">
                              {info.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-0.5 shrink-0">
                        <span className="text-xs font-mono text-white">
                          {formatPrice(token.price)}
                        </span>
                        <span
                          className={cn(
                            'text-[10px] font-mono',
                            token.priceChangePct24h >= 0
                              ? 'text-[#00c076]'
                              : 'text-[#ff4d4f]',
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
          </ScrollArea>
        </div>
      )}

      {/* When closed, show a compact scrollable list */}
      {!isOpen && (
        <ScrollArea className="flex-1">
          <div className="p-2">
            {loadingMarket ? (
              <div className="space-y-2 p-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full bg-[#2a2a32]" />
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
                        'w-full flex items-center justify-between p-2 rounded-md text-left',
                        'hover:bg-[#222228] transition-colors cursor-pointer',
                        isSelected && 'bg-[#222228] border-l-2 border-[#fd7d02]',
                      )}
                    >
                      <span
                        className={cn(
                          'text-xs truncate',
                          isSelected ? 'text-white font-medium' : 'text-[#9ca3af]',
                        )}
                      >
                        {token.symbol}
                      </span>
                      <span
                        className={cn(
                          'text-[10px] font-mono shrink-0',
                          token.priceChangePct24h >= 0
                            ? 'text-[#00c076]'
                            : 'text-[#ff4d4f]',
                        )}
                      >
                        {formatPercent(token.priceChangePct24h)}
                      </span>
                    </button>
                  );
                })
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
