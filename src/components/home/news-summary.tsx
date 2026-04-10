"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { timeAgo } from "@/lib/utils";
import { Sparkles } from "@/components/icons";

interface NewsSummaryProps {
  summary: string | null;
  generatedAt: string | null;
  isLoading: boolean;
}

function formatInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*|_(.+?)_|\*(.+?)\*/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[1]) {
      parts.push(
        <strong key={match.index} className="font-semibold text-text-primary">
          {match[1]}
        </strong>
      );
    } else if (match[2] || match[3]) {
      parts.push(
        <em key={match.index} className="italic text-primary/80">
          {match[2] || match[3]}
        </em>
      );
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length === 0 ? text : <>{parts}</>;
}

function RenderSummary({ text }: { text: string }) {
  const lines = text.split("\n");

  return (
    <div className="space-y-0.5">
      {lines.map((line, i) => {
        const trimmed = line.trim();

        if (trimmed === "") {
          return <div key={i} className="h-1.5" />;
        }

        // Section titles: **Market Pulse**
        const sectionMatch = trimmed.match(/^\*\*(.+?)\*\*$/);
        if (sectionMatch) {
          return (
            <p key={i} className="text-xs font-semibold uppercase tracking-wider text-primary/70 mt-3 first:mt-0 mb-1">
              {sectionMatch[1]}
            </p>
          );
        }

        // Bullet points
        const bulletMatch = trimmed.match(/^[-•]\s+(.*)/);
        if (bulletMatch) {
          return (
            <div key={i} className="flex gap-2.5 pl-0.5 py-0.5">
              <span className="text-primary/60 mt-0.5 text-xs shrink-0">▸</span>
              <span className="text-sm leading-relaxed text-text-secondary">
                {formatInline(bulletMatch[1])}
              </span>
            </div>
          );
        }

        // Italic-only lines (signal/takeaway) — _text here_
        const italicMatch = trimmed.match(/^_(.+)_$/);
        if (italicMatch) {
          return (
            <div key={i} className="mt-2 rounded-lg border border-primary/10 bg-primary/5 px-3 py-2">
              <p className="text-sm italic text-primary/90">
                {formatInline(italicMatch[1])}
              </p>
            </div>
          );
        }

        // Regular text
        return (
          <p key={i} className="text-sm leading-relaxed text-text-secondary">
            {formatInline(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

export function NewsSummary({ summary, generatedAt, isLoading }: NewsSummaryProps) {
  return (
    <Card className="card-elevated">
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-3.5 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            AI Market Summary
          </span>
        </div>

        <div className="gradient-separator" />

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[90%]" />
            <Skeleton className="h-4 w-[75%]" />
            <Skeleton className="h-4 w-[60%]" />
          </div>
        ) : summary ? (
          <div>
            <RenderSummary text={summary} />
            {generatedAt && (
              <p className="mt-3 text-[10px] text-text-tertiary">
                Generated {timeAgo(generatedAt)}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-text-tertiary">
            No market summary available yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
