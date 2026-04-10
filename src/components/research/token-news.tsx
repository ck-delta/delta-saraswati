"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedList, AnimatedListItem } from "@/lib/motion/components";
import { useNews } from "@/hooks/use-news";
import { timeAgo } from "@/lib/utils";
import { Newspaper, ExternalLink, Clock, Globe, Inbox } from "@/components/icons";

interface TokenNewsProps {
  symbol: string;
}

export function TokenNews({ symbol }: TokenNewsProps) {
  const { headlines, isLoading } = useNews();

  // Extract base token name from symbol (BTCUSD -> BTC, Bitcoin)
  const tokenNames = useMemo(() => {
    const base = symbol.replace(/USD$|USDT$/, "");
    const nameMap: Record<string, string[]> = {
      BTC: ["bitcoin", "btc"],
      ETH: ["ethereum", "eth", "ether"],
      SOL: ["solana", "sol"],
      DOGE: ["dogecoin", "doge"],
      XRP: ["xrp", "ripple"],
      AVAX: ["avalanche", "avax"],
      LINK: ["chainlink", "link"],
      ADA: ["cardano", "ada"],
      DOT: ["polkadot", "dot"],
      BNB: ["bnb", "binance coin"],
      PAXG: ["gold", "paxg", "pax gold"],
    };
    return nameMap[base] || [base.toLowerCase()];
  }, [symbol]);

  const filtered = useMemo(() => {
    if (!headlines?.length) return [];
    return headlines.filter((h: any) =>
      tokenNames.some((name) => h.title.toLowerCase().includes(name))
    );
  }, [headlines, tokenNames]);

  // Also show general crypto news if no token-specific news
  const displayNews = filtered.length > 0 ? filtered.slice(0, 5) : (headlines || []).slice(0, 3);
  const isTokenSpecific = filtered.length > 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-[90%]" />
          <Skeleton className="h-3 w-[80%]" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="kpi-card rounded-2xl">
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center size-7 rounded-lg bg-primary/10 shadow-[0_0_8px_rgba(245,158,11,0.08)]">
            <Newspaper className="size-3.5 text-primary" />
          </div>
          <span className="text-sm font-bold uppercase tracking-wider text-primary">
            {isTokenSpecific
              ? `${symbol.replace(/USD$/, "")} News`
              : "Latest Market News"}
          </span>
        </div>

        <div className="gradient-separator" />

        {displayNews.length === 0 ? (
          <div className="flex flex-col items-center py-4">
            <Inbox className="size-5 text-text-tertiary mb-1.5" />
            <p className="text-sm text-text-tertiary">
              No recent news for this token.
            </p>
          </div>
        ) : (
          <AnimatedList fast className="space-y-0 divide-y divide-white/[0.04]">
            {displayNews.map((headline: any) => (
              <AnimatedListItem key={headline.id || headline.title}>
                <a
                  href={headline.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-3 rounded-lg px-3 py-3.5 -mx-1 transition-all hover:bg-white/[0.03]"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-[#F1F5F9] leading-snug line-clamp-2 group-hover:text-white transition-colors">
                      {headline.title}
                    </p>
                    <div className="flex items-center gap-2.5 mt-1.5">
                      <span className="flex items-center gap-1 text-[11px] text-[#94A3B8]">
                        <Globe className="size-3 shrink-0" />
                        {headline.source}
                      </span>
                      <span className="text-[#475569]">·</span>
                      <span className="flex items-center gap-1 text-[11px] text-[#94A3B8] font-mono tabular-nums">
                        <Clock className="size-3 shrink-0" />
                        {timeAgo(headline.publishedAt)}
                      </span>
                      <span className="text-[#475569]">·</span>
                      <span
                        className={`text-[11px] font-bold ${
                          headline.sentiment === "positive"
                            ? "text-gain"
                            : headline.sentiment === "negative"
                              ? "text-loss"
                              : "text-[#94A3B8]"
                        }`}
                      >
                        {headline.sentiment === "positive"
                          ? "Bullish"
                          : headline.sentiment === "negative"
                            ? "Bearish"
                            : "Neutral"}
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="size-3.5 text-[#475569] mt-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </AnimatedListItem>
            ))}
          </AnimatedList>
        )}
      </div>
    </div>
  );
}
