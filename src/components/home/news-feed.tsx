"use client";

import { useState } from "react";
import { ExternalLink, Newspaper, RefreshCw, Clock, ChevronDown, ChevronUp, Inbox } from "@/components/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedList, AnimatedListItem } from "@/lib/motion/components";
import { SentimentBadge } from "@/components/shared/sentiment-badge";
import { timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Headline {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  sentiment: "positive" | "negative" | "neutral";
  sentimentScore: number;
}

interface NewsFeedProps {
  headlines: Headline[];
  isLoading: boolean;
}

// Source logo — small colored dot with first letter as a simple fallback
function SourceIcon({ source }: { source: string }) {
  const colors: Record<string, string> = {
    CoinDesk: "#1D6AFF",
    CoinTelegraph: "#F7931A",
    Decrypt: "#00D395",
    "The Block": "#FF5C5C",
    NewsBTC: "#F59E0B",
  };
  const color = colors[source] || "#636366";
  const letter = source.charAt(0).toUpperCase();

  return (
    <div
      className="flex items-center justify-center size-5 rounded-md text-[9px] font-bold shrink-0"
      style={{ backgroundColor: `${color}22`, color }}
    >
      {letter}
    </div>
  );
}

function NewsFeedSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 pl-3">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-[85%]" />
            <div className="flex gap-3">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-3.5 w-14" />
            </div>
          </div>
          <Skeleton className="h-7 w-24 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

function getSentimentBorderColor(sentiment: string) {
  if (sentiment === "positive") return "border-l-gain/60";
  if (sentiment === "negative") return "border-l-loss/60";
  return "border-l-white/[0.08]";
}

export function NewsFeed({ headlines, isLoading }: NewsFeedProps) {
  const [showAll, setShowAll] = useState(false);
  const displayHeadlines = showAll ? headlines.slice(0, 15) : headlines.slice(0, 8);

  return (
    <div className="derivatives-card">
      <div className="px-7 py-7 space-y-5">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center size-7 rounded-lg bg-primary/10 shadow-[0_0_10px_rgba(245,158,11,0.08)]">
              <Newspaper className="size-3.5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary tracking-tight">
                Latest News
              </h2>
              <p className="text-[10px] text-text-tertiary flex items-center gap-1">
                Real-time crypto headlines with AI sentiment
                <span className="live-dot ml-0.5" />
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-text-tertiary rounded-full border border-white/[0.06] px-2.5 py-1 bg-white/[0.02]">
            <RefreshCw className="size-2.5" />
            <span>Just now</span>
          </div>
        </div>

        <div className="gradient-separator" />

        {isLoading ? (
          <NewsFeedSkeleton />
        ) : displayHeadlines.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <Inbox className="size-5 text-text-tertiary" />
            <p className="text-sm text-text-tertiary">No news headlines available.</p>
          </div>
        ) : (
          <>
            <AnimatedList className="space-y-0 divide-y divide-white/[0.04]">
              {displayHeadlines.map((headline) => (
                <AnimatedListItem key={headline.id}>
                  <a
                    href={headline.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "group flex items-start gap-3 rounded-xl py-4 px-4 -mx-1 transition-all duration-200",
                      "hover:bg-white/[0.035] hover:-translate-y-[1px] hover:shadow-[0_2px_12px_rgba(0,0,0,0.12)]",
                      "border-l-[3px]",
                      getSentimentBorderColor(headline.sentiment)
                    )}
                  >
                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Headline */}
                      <p className="text-[15px] font-semibold leading-snug text-[#F1F5F9] group-hover:text-white transition-colors line-clamp-2">
                        {headline.title}
                      </p>

                      {/* Meta row: source + time + read link */}
                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center gap-1.5">
                          <SourceIcon source={headline.source} />
                          <span className="text-[11px] font-medium text-[#94A3B8]">
                            {headline.source}
                          </span>
                        </div>

                        <span className="text-[#475569]">·</span>

                        <span className="flex items-center gap-1 text-[11px] text-[#94A3B8]/70 font-mono tabular-nums">
                          <Clock className="size-2.5" />
                          {timeAgo(headline.publishedAt)}
                        </span>

                        <span className="text-[#475569]">·</span>

                        {/* Read full story link */}
                        <span className="flex items-center gap-1 text-[10px] text-[#64748B] group-hover:text-primary/70 transition-colors">
                          Read
                          <ExternalLink className="size-2.5" />
                        </span>
                      </div>
                    </div>

                    {/* Sentiment badge — right side */}
                    <div className="shrink-0 pt-0.5">
                      <SentimentBadge
                        sentiment={headline.sentiment}
                        score={headline.sentimentScore}
                      />
                    </div>
                  </a>
                </AnimatedListItem>
              ))}
            </AnimatedList>

            {/* Show more / less */}
            {headlines.length > 8 && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setShowAll(!showAll);
                }}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-text-tertiary hover:text-primary transition-colors py-2.5 mt-2 rounded-xl border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.02]"
              >
                {showAll ? (
                  <>Show less <ChevronUp className="size-3.5" /></>
                ) : (
                  <>Show all {headlines.length} headlines <ChevronDown className="size-3.5" /></>
                )}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
