"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Zap, RefreshCw, BarChart3, Radio } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedPage, AnimatedSection } from "@/lib/motion/components";
import { useDeltaTickers } from "@/hooks/use-delta-tickers";
import { useTokenDetail } from "@/hooks/use-token-detail";
import { useAppStore } from "@/store/app-store";
import { TokenSelector } from "@/components/research/token-selector";
import { TokenStats } from "@/components/research/token-stats";
import { IndicatorsPanel } from "@/components/research/indicators-panel";
import { ResearchChat } from "@/components/research/research-chat";
import { TokenNews } from "@/components/research/token-news";
import { TradeModal } from "@/components/shared/trade-modal";

const PriceChart = dynamic(() => import("@/components/research/price-chart"), {
  ssr: false,
  loading: () => (
    <div className="kpi-card rounded-xl overflow-hidden">
      <Skeleton className="h-[460px] w-full" />
    </div>
  ),
});

function ResearchContent() {
  const searchParams = useSearchParams();
  const initialToken = searchParams.get("token") || "BTCUSD";

  const [selectedToken, setSelectedToken] = useState(initialToken);
  const [resolution, setResolution] = useState("1d");

  const { tickers, isLoading: tickersLoading } = useDeltaTickers("major");
  const { ticker, indicators, isLoading: detailLoading } = useTokenDetail(selectedToken);
  const openTradeModal = useAppStore((s) => s.openTradeModal);

  const tokenList = useMemo(
    () =>
      tickers.map((t: any) => ({
        symbol: t.symbol as string,
        description: (t.description || t.product_name || t.symbol) as string,
      })),
    [tickers]
  );

  return (
    <AnimatedPage className="space-y-7">
      {/* Header */}
      <AnimatedSection>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-xl bg-primary/10 shadow-[0_0_16px_rgba(245,158,11,0.08)]">
              <BarChart3 className="size-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary tracking-tight">Research</h1>
              <p className="text-xs text-text-tertiary mt-0.5">
                In-depth token analysis and market data
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <TokenSelector
              tokens={tokenList}
              selected={selectedToken}
              onSelect={setSelectedToken}
            />
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-text-tertiary">
              <Radio className="size-2.5" />
              <span>Live</span>
            </div>
          </div>
        </div>
        <div className="gradient-separator mt-5" />
      </AnimatedSection>

      {/* Price Chart — in a premium card wrapper */}
      <AnimatedSection>
        <div className="kpi-card rounded-xl overflow-hidden">
          <PriceChart
            symbol={selectedToken}
            resolution={resolution}
            onResolutionChange={setResolution}
          />
        </div>
      </AnimatedSection>

      {/* Token Stats Row */}
      <AnimatedSection>
        <TokenStats ticker={ticker} isLoading={detailLoading} />
      </AnimatedSection>

      {/* Indicators Panel */}
      <AnimatedSection>
        <IndicatorsPanel
          ticker={ticker}
          indicators={indicators}
          isLoading={detailLoading}
        />
      </AnimatedSection>

      {/* Research Chat */}
      <AnimatedSection>
        <ResearchChat symbol={selectedToken} />
      </AnimatedSection>

      {/* Token News */}
      <AnimatedSection>
        <TokenNews symbol={selectedToken} />
      </AnimatedSection>

      {/* Trade Now Button */}
      <AnimatedSection>
        <Button
          size="lg"
          className="w-full h-12 text-base font-bold text-primary-foreground rounded-2xl trade-btn-shine trade-cta-pulse hover:brightness-110 transition-all"
          onClick={() => openTradeModal(selectedToken)}
        >
          <Zap className="size-4.5 mr-2" />
          Trade {selectedToken} Now
        </Button>
      </AnimatedSection>

      <TradeModal />
    </AnimatedPage>
  );
}

export default function ResearchPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-7">
          <Skeleton className="h-10 w-48" />
          <div className="kpi-card rounded-xl overflow-hidden">
            <Skeleton className="h-[460px] w-full" />
          </div>
        </div>
      }
    >
      <ResearchContent />
    </Suspense>
  );
}
