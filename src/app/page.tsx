"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "@/components/icons";
import { AnimatedPage, AnimatedSection } from "@/lib/motion/components";
import { useDeltaTickers } from "@/hooks/use-delta-tickers";
import { useNews } from "@/hooks/use-news";
import { useAppStore } from "@/store/app-store";
import { TokenCard, TokenCardSkeleton } from "@/components/home/token-card";
import { NewsSummary } from "@/components/home/news-summary";
import { NewsFeed } from "@/components/home/news-feed";
import { CtaBanner } from "@/components/home/cta-banner";
import { TradeModal } from "@/components/shared/trade-modal";
import { timeAgo } from "@/lib/utils";

export default function HomePage() {
  const router = useRouter();
  const { tickers, isLoading: tickersLoading, mutate } = useDeltaTickers();
  const {
    summary,
    headlines,
    generatedAt,
    isLoading: newsLoading,
  } = useNews();
  const openTradeModal = useAppStore((s) => s.openTradeModal);

  const topTickers = (tickers ?? []).slice(0, 3);

  // Max volume across top 3 for relative volume bar
  const maxVolume = useMemo(
    () => Math.max(...topTickers.map((t: Record<string, unknown>) => Number(t.turnover_usd ?? 0)), 1),
    [topTickers]
  );

  // Last update timestamp
  const lastUpdated = useMemo(() => {
    if (topTickers.length === 0) return null;
    return new Date().toISOString();
  }, [topTickers]);

  return (
    <>
      <AnimatedPage className="space-y-8">
        {/* Page title + last updated */}
        <AnimatedSection>
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Daily Pulse</h1>
              <p className="text-sm text-text-secondary mt-1">
                Top tokens, AI insights, and market news
              </p>
            </div>
            {lastUpdated && !tickersLoading && (
              <button
                onClick={() => mutate()}
                className="flex items-center gap-1.5 text-[11px] text-text-tertiary hover:text-text-secondary transition-colors"
              >
                <RefreshCw className="size-3" />
                Updated {timeAgo(lastUpdated)}
              </button>
            )}
          </div>
          {/* Divider below header */}
          <div className="gradient-separator mt-4" />
        </AnimatedSection>

        {/* Top tokens grid */}
        <AnimatedSection>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {tickersLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <TokenCardSkeleton key={i} />
                ))
              : topTickers.map((ticker: Record<string, unknown>) => (
                  <TokenCard
                    key={ticker.symbol as string}
                    symbol={ticker.symbol as string}
                    name={(ticker.description as string) || (ticker.underlying_asset_symbol as string) || (ticker.symbol as string)}
                    price={Number(ticker.close ?? ticker.mark_price ?? 0)}
                    change24h={Number(ticker.mark_change_24h ?? ticker.ltp_change_24h ?? 0)}
                    fundingRate={Number(ticker.funding_rate ?? 0)}
                    volume24h={Number(ticker.turnover_usd ?? 0)}
                    maxVolume={maxVolume}
                    sentimentScore={Number(ticker.sentiment_score ?? 0.5)}
                    onMoreInfo={() =>
                      router.push(`/research?token=${ticker.symbol}`)
                    }
                    onTradeNow={() =>
                      openTradeModal(ticker.symbol as string)
                    }
                  />
                ))}
          </div>
        </AnimatedSection>

        {/* AI Market Summary */}
        <AnimatedSection>
          <NewsSummary
            summary={summary}
            generatedAt={generatedAt}
            isLoading={newsLoading}
          />
        </AnimatedSection>

        {/* News Feed */}
        <AnimatedSection>
          <NewsFeed headlines={headlines} isLoading={newsLoading} />
        </AnimatedSection>

        {/* CTA Banner */}
        <AnimatedSection>
          <CtaBanner />
        </AnimatedSection>
      </AnimatedPage>

      <TradeModal />
    </>
  );
}
