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
    <Card>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Newspaper className="size-3.5 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            {isTokenSpecific
              ? `${symbol.replace(/USD$/, "")} News`
              : "Latest Market News"}
          </span>
        </div>

        <div className="gradient-separator" />

        {displayNews.length === 0 ? (
          <div className="flex flex-col items-center py-2">
            <Inbox className="size-5 text-text-tertiary mb-1" />
            <p className="text-xs text-text-tertiary">
              No recent news for this token.
            </p>
          </div>
        ) : (
          <AnimatedList fast className="space-y-2">
            {displayNews.map((headline: any) => (
              <AnimatedListItem key={headline.id || headline.title}>
                <a
                  href={headline.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-2 rounded-md px-2 py-1.5 -mx-2 transition-colors hover:bg-elevated"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-text-primary leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                      {headline.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="flex items-center gap-1 text-[10px] text-text-tertiary">
                        <Globe className="size-2.5 shrink-0" />
                        {headline.source}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-text-tertiary">
                        <Clock className="size-2.5 shrink-0" />
                        {timeAgo(headline.publishedAt)}
                      </span>
                      <span
                        className={`text-[10px] font-medium ${
                          headline.sentiment === "positive"
                            ? "text-gain"
                            : headline.sentiment === "negative"
                              ? "text-loss"
                              : "text-text-tertiary"
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
                  <ExternalLink className="size-3 text-text-tertiary mt-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </AnimatedListItem>
            ))}
          </AnimatedList>
        )}
      </CardContent>
    </Card>
  );
}
