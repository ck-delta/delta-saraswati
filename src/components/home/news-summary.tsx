"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { timeAgo } from "@/lib/utils";
import {
  Sparkles, Clock, AlertCircle, RefreshCw,
  Activity, Rocket, Globe, Zap,
} from "lucide-react";

interface NewsSummaryProps {
  summary: string | null;
  generatedAt: string | null;
  isLoading: boolean;
  onRegenerate?: () => void;
}

// Section config: icon, accent color, border color
const SECTION_CONFIG: Record<string, { icon: typeof Activity; accent: string; border: string; bg: string }> = {
  "Market Pulse": { icon: Activity, accent: "text-info", border: "border-l-info/40", bg: "bg-info/5" },
  "Big Movers": { icon: Rocket, accent: "text-primary", border: "border-l-primary/40", bg: "bg-primary/5" },
  "Macro Watch": { icon: Globe, accent: "text-emerald-400", border: "border-l-emerald-400/40", bg: "bg-emerald-400/5" },
  "Signal": { icon: Zap, accent: "text-amber-400", border: "border-l-amber-400/40", bg: "bg-amber-400/5" },
};

function formatInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  // Match **bold**, _italic_, ↑/↓ arrows, [bullish]/[bearish]/[neutral] tags
  const regex = /\*\*(.+?)\*\*|_(.+?)_|\[(bullish|bearish|neutral)\]|([↑↓])([\d.]+%)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[1]) {
      // **bold**
      parts.push(
        <strong key={match.index} className="font-semibold text-text-primary">
          {match[1]}
        </strong>
      );
    } else if (match[2]) {
      // _italic_
      parts.push(
        <em key={match.index} className="italic text-primary/90">
          {match[2]}
        </em>
      );
    } else if (match[3]) {
      // [bullish] / [bearish] / [neutral] tags
      const tag = match[3];
      const tagColor = tag === "bullish" ? "text-gain bg-gain/10 border-gain/20"
        : tag === "bearish" ? "text-loss bg-loss/10 border-loss/20"
        : "text-text-tertiary bg-white/[0.04] border-white/[0.06]";
      parts.push(
        <span key={match.index} className={`ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider border ${tagColor}`}>
          {tag}
        </span>
      );
    } else if (match[4] && match[5]) {
      // ↑1.5% or ↓0.7%
      const isUp = match[4] === "↑";
      parts.push(
        <span key={match.index} className={`font-mono font-semibold ${isUp ? "text-gain-text" : "text-loss-text"}`}>
          {match[4]}{match[5]}
        </span>
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
  const elements: React.ReactNode[] = [];
  let currentSection = "";

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed === "") continue;

    // Section titles: **Market Pulse** etc.
    const sectionMatch = trimmed.match(/^\*\*(.+?)\*\*$/);
    if (sectionMatch) {
      const title = sectionMatch[1];
      currentSection = title;
      const config = SECTION_CONFIG[title] || SECTION_CONFIG["Market Pulse"];
      const Icon = config.icon;

      // Add separator between sections (not before first)
      if (elements.length > 0) {
        elements.push(
          <div key={`sep-${i}`} className="gradient-separator my-3" />
        );
      }

      elements.push(
        <div key={`header-${i}`} className="flex items-center gap-2 mb-2">
          <div className={`flex items-center justify-center size-5 rounded ${config.bg}`}>
            <Icon className={`size-3 ${config.accent}`} />
          </div>
          <span className={`text-[11px] font-bold uppercase tracking-[0.08em] ${config.accent}`}>
            {title}
          </span>
        </div>
      );
      continue;
    }

    // Bullet points
    const bulletMatch = trimmed.match(/^[-•]\s+(.*)/);
    if (bulletMatch) {
      const config = SECTION_CONFIG[currentSection] || SECTION_CONFIG["Market Pulse"];
      elements.push(
        <div key={i} className={`flex gap-2 pl-1 py-1.5 border-l-2 ${config.border} ml-2 rounded-r`}>
          <span className="text-[13px] leading-relaxed text-text-secondary pl-2">
            {formatInline(bulletMatch[1])}
          </span>
        </div>
      );
      continue;
    }

    // Italic-only lines (signal takeaway)
    const italicMatch = trimmed.match(/^_(.+)_$/);
    if (italicMatch) {
      elements.push(
        <div key={i} className="relative mt-2 rounded-xl overflow-hidden">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/[0.08] via-orange-500/[0.05] to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent" />
          <div className="relative px-4 py-3 border border-amber-500/15 rounded-xl">
            {/* AI Signal badge */}
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="size-3 text-amber-400" />
              <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-amber-400">AI Signal</span>
            </div>
            <p className="text-[13px] italic leading-relaxed font-medium text-amber-200/90">
              {formatInline(italicMatch[1])}
            </p>
          </div>
        </div>
      );
      continue;
    }

    // Regular text (non-italic signal or takeaway)
    if (currentSection === "Signal") {
      elements.push(
        <div key={i} className="relative mt-2 rounded-xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/[0.08] via-orange-500/[0.05] to-transparent" />
          <div className="relative px-4 py-3 border border-amber-500/15 rounded-xl">
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="size-3 text-amber-400" />
              <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-amber-400">AI Signal</span>
            </div>
            <p className="text-[13px] leading-relaxed font-medium text-amber-200/90">
              {formatInline(trimmed)}
            </p>
          </div>
        </div>
      );
    } else {
      elements.push(
        <p key={i} className="text-[13px] leading-relaxed text-text-secondary">
          {formatInline(trimmed)}
        </p>
      );
    }
  }

  return <div className="space-y-0.5">{elements}</div>;
}

export function NewsSummary({ summary, generatedAt, isLoading, onRegenerate }: NewsSummaryProps) {
  return (
    <div className="kpi-card rounded-xl">
      <div className="p-5 md:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center size-7 rounded-lg bg-info/10 shadow-[0_0_10px_rgba(59,130,246,0.08)]">
              <Sparkles className="size-3.5 text-info" />
            </div>
            <div>
              <span className="text-sm font-bold text-text-primary tracking-tight">
                AI Market Summary
              </span>
              <p className="text-[10px] text-text-tertiary">Powered by live Delta Exchange data</p>
            </div>
          </div>
        </div>

        <div className="gradient-separator" />

        {/* Content */}
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[90%]" />
            <Skeleton className="h-4 w-24 mt-2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[80%]" />
            <Skeleton className="h-16 w-full mt-2 rounded-xl" />
          </div>
        ) : summary ? (
          <div>
            <RenderSummary text={summary} />

            {/* Footer */}
            <div className="gradient-separator mt-4 mb-3" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[10px] text-text-tertiary">
                <Clock className="size-2.5" />
                <span>AI Generated</span>
                {generatedAt && (
                  <>
                    <span className="text-text-tertiary/40">•</span>
                    <span>{timeAgo(generatedAt)}</span>
                  </>
                )}
              </div>
              {onRegenerate && (
                <button
                  onClick={onRegenerate}
                  className="flex items-center gap-1 text-[10px] text-text-tertiary hover:text-primary transition-colors"
                >
                  <RefreshCw className="size-2.5" />
                  Regenerate
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <AlertCircle className="size-5 text-text-tertiary" />
            <p className="text-sm text-text-tertiary">No market summary available yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
