'use client';

import { Suspense, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useResearchStore } from '@/stores/research-store';
import { useMarketStore } from '@/stores/market-store';
import { TokenSelector } from '@/components/research/TokenSelector';
import { ResearchPanel } from '@/components/research/ResearchPanel';
import { PriceChart } from '@/components/research/PriceChart';
import { OrderBookPanel } from '@/components/research/OrderBookPanel';
import { ResearchChatBox } from '@/components/research/ResearchChatBox';

function ResearchContent() {
  const searchParams = useSearchParams();

  const {
    selectedToken,
    candles,
    loadingCandles,
    selectToken,
    fetchCandles,
  } = useResearchStore();

  const { allTickers, fetchMarketData } = useMarketStore();

  useEffect(() => {
    if (allTickers.length === 0) {
      fetchMarketData();
    }
  }, [allTickers.length, fetchMarketData]);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam && tokenParam !== selectedToken) {
      selectToken(tokenParam.toUpperCase());
    } else if (!selectedToken && allTickers.length > 0) {
      const defaultToken = allTickers.find((t) => t.symbol === 'BTCUSDT')
        ? 'BTCUSDT'
        : allTickers[0]?.symbol;
      if (defaultToken) selectToken(defaultToken);
    }
  }, [searchParams, selectedToken, selectToken, allTickers]);

  const handleTimeRangeChange = useCallback(
    (range: string) => {
      if (!selectedToken) return;
      const resolutionMap: Record<string, string> = {
        '7d': '1h',
        '1m': '4h',
        '3m': '1d',
      };
      const resolution = resolutionMap[range] ?? '1h';
      fetchCandles(selectedToken, resolution);
    },
    [selectedToken, fetchCandles],
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: token selector */}
        <aside
          className="w-full lg:w-64 shrink-0 max-h-[360px] lg:max-h-[calc(100vh-8rem)] overflow-hidden flex flex-col"
          style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--bg-secondary)',
            borderRadius: 'var(--radius-2xl)',
          }}
        >
          <TokenSelector />
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-5">
          <ResearchPanel />

          <PriceChart
            candles={candles}
            symbol={selectedToken ?? ''}
            loading={loadingCandles}
            onTimeRangeChange={handleTimeRangeChange}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <OrderBookPanel />
            {selectedToken && <ResearchChatBox tokenSymbol={selectedToken} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function ResearchFallback() {
  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-6">
      <div className="flex flex-col lg:flex-row gap-6">
        <aside
          className="w-full lg:w-64 shrink-0 p-4 space-y-3"
          style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--bg-secondary)',
            borderRadius: 'var(--radius-2xl)',
          }}
        >
          <div
            className="h-3 w-20 rounded animate-pulse"
            style={{ background: 'var(--bg-secondary)' }}
          />
          <div
            className="h-10 w-full rounded-md animate-pulse"
            style={{ background: 'var(--bg-secondary)' }}
          />
          <div
            className="h-9 w-full rounded-md animate-pulse"
            style={{ background: 'var(--bg-secondary)' }}
          />
        </aside>
        <div className="flex-1 space-y-5">
          <div
            className="h-48 w-full rounded-2xl animate-pulse"
            style={{ background: 'var(--bg-primary)' }}
          />
          <div
            className="h-[400px] w-full rounded-2xl animate-pulse"
            style={{ background: 'var(--bg-primary)' }}
          />
        </div>
      </div>
    </div>
  );
}

export default function ResearchPage() {
  return (
    <Suspense fallback={<ResearchFallback />}>
      <ResearchContent />
    </Suspense>
  );
}
