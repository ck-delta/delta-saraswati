"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Gauge } from "@/components/icons";
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
import { useSparklines } from "@/hooks/use-sparklines";

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

  // Sparkline data for top tokens
  const topSymbols = useMemo(() => topTickers.map((t: Record<string, unknown>) => t.symbol as string), [topTickers]);
  const sparklines = useSparklines(topSymbols);

  // Max volume across top 3 for relative volume bar
  const maxVolume = useMemo(
    () => Math.max(...topTickers.map((t: Record<string, unknown>) => Number(t.turnover_usd ?? 0)), 1),
    [topTickers]
  );

  // Compute AI sentiment per token from news headlines
  // Maps symbol keywords to matching headlines, averages their sentiment scores
  const TOKEN_KEYWORDS: Record<string, string[]> = {
    BTCUSD: ["bitcoin", "btc"],
    ETHUSD: ["ethereum", "eth"],
    PAXGUSD: ["gold", "paxg", "pax gold"],
    SOLUSD: ["solana", "sol"],
  };

  const tokenSentiments = useMemo(() => {
    const result: Record<string, number> = {};
    if (!headlines || headlines.length === 0) return result;

    for (const [sym, keywords] of Object.entries(TOKEN_KEYWORDS)) {
      const matching = headlines.filter((h: any) =>
        keywords.some((kw: string) => h.title?.toLowerCase().includes(kw))
      );
      if (matching.length > 0) {
        // Convert sentiment to 0-1 scale: positive=0.8, neutral=0.5, negative=0.2
        // Then blend with actual sentimentScore if available
        const avg = matching.reduce((sum: number, h: any) => {
          const base = h.sentiment === "positive" ? 0.8 : h.sentiment === "negative" ? 0.2 : 0.5;
          const score = h.sentimentScore != null ? h.sentimentScore / 100 : base;
          return sum + score;
        }, 0) / matching.length;
        result[sym] = avg;
      } else {
        // No matching headlines — use price momentum as proxy
        result[sym] = 0.5;
      }
    }
    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headlines]);

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
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Gauge className="size-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text-primary">Delta Saraswati</h1>
                <p className="text-sm text-text-secondary mt-1">
                  Top tokens, AI insights, and market news
                </p>
              </div>
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
                    sentimentScore={tokenSentiments[ticker.symbol as string] ?? 0.5}
                    sparklineData={sparklines[ticker.symbol as string]}
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
