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
    }
  }, [searchParams, selectedToken, selectToken]);

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
    <div className="flex flex-col lg:flex-row h-full min-h-0">
      {/* Left sidebar -- Token Selector */}
      <aside className="w-full lg:w-64 shrink-0 border-b lg:border-b-0 lg:border-r border-[#1e2024] bg-[#0d0e10] max-h-[220px] lg:max-h-none overflow-hidden flex flex-col">
        <TokenSelector />
      </aside>

      {/* Main content area */}
      <div className="flex-1 min-w-0 overflow-y-auto bg-[#08090a]">
        <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-5">
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
    <div className="flex flex-col lg:flex-row h-full min-h-0">
      <aside className="w-full lg:w-64 shrink-0 border-b lg:border-b-0 lg:border-r border-[#1e2024] bg-[#0d0e10]">
        <div className="p-4 space-y-3">
          <div className="h-3 w-20 rounded bg-[#1e2024] animate-pulse" />
          <div className="h-10 w-full rounded-lg bg-[#111214] animate-pulse" />
          <div className="h-9 w-full rounded-lg bg-[#111214] animate-pulse" />
          <div className="h-9 w-full rounded-lg bg-[#111214] animate-pulse" />
          <div className="h-9 w-full rounded-lg bg-[#111214] animate-pulse" />
        </div>
      </aside>
      <div className="flex-1 min-w-0 p-6 space-y-5 bg-[#08090a]">
        <div className="h-48 w-full rounded-xl bg-[#111214] animate-pulse" />
        <div className="h-[400px] w-full rounded-xl bg-[#111214] animate-pulse" />
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
