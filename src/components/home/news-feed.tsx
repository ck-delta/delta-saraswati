"use client";

import { ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedList, AnimatedListItem } from "@/lib/motion/components";
import { SentimentBadge } from "@/components/shared/sentiment-badge";
import { timeAgo } from "@/lib/utils";
import { Newspaper } from "lucide-react";

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

function NewsFeedSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function NewsFeed({ headlines, isLoading }: NewsFeedProps) {
  const displayHeadlines = headlines.slice(0, 10);

  return (
    <Card>
      <CardContent className="space-y-3">
        {/* Section label */}
        <div className="flex items-center gap-2">
          <Newspaper className="size-3.5 text-text-secondary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
            Latest News
          </span>
        </div>

        <div className="gradient-separator" />

        {isLoading ? (
          <NewsFeedSkeleton />
        ) : displayHeadlines.length === 0 ? (
          <p className="text-sm text-text-tertiary py-4 text-center">
            No news headlines available.
          </p>
        ) : (
          <AnimatedList className="space-y-1">
            {displayHeadlines.map((headline) => (
              <AnimatedListItem key={headline.id}>
                <a
                  href={headline.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-3 rounded-lg px-2 py-2 -mx-2 transition-colors hover:bg-muted/50"
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="text-sm text-text-primary leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                      {headline.title}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-tertiary">
                        {headline.source}
                      </span>
                      <span className="text-text-tertiary">·</span>
                      <span className="text-xs text-text-tertiary">
                        {timeAgo(headline.publishedAt)}
                      </span>
                      <ExternalLink className="size-2.5 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <SentimentBadge
                    sentiment={headline.sentiment}
                    score={headline.sentimentScore}
                  />
                </a>
              </AnimatedListItem>
            ))}
          </AnimatedList>
        )}
      </CardContent>
    </Card>
  );
}
