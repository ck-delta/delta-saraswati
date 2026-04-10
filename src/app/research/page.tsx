"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Zap } from "lucide-react";
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
  loading: () => <Skeleton className="h-[440px] w-full rounded-lg" />,
});

function ResearchContent() {
  const searchParams = useSearchParams();
  const initialToken = searchParams.get("token") || "BTCUSD";

  const [selectedToken, setSelectedToken] = useState(initialToken);
  const [resolution, setResolution] = useState("1d");

  const { tickers, isLoading: tickersLoading } = useDeltaTickers();
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
    <AnimatedPage className="space-y-6">
      {/* Header */}
      <AnimatedSection>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Research</h1>
            <p className="text-sm text-text-secondary">
              In-depth token analysis and market data
            </p>
          </div>
          <TokenSelector
            tokens={tokenList}
            selected={selectedToken}
            onSelect={setSelectedToken}
          />
        </div>
      </AnimatedSection>

      {/* Price Chart */}
      <AnimatedSection>
        <PriceChart
          symbol={selectedToken}
          resolution={resolution}
          onResolutionChange={setResolution}
        />
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
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[var(--shadow-glow-sm)]"
          onClick={() => openTradeModal(selectedToken)}
        >
          <Zap className="size-4 mr-1.5" />
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
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-[440px] w-full rounded-lg" />
        </div>
      }
    >
      <ResearchContent />
    </Suspense>
  );
}
