"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { timeAgo } from "@/lib/utils";
import {
  Sparkles, Clock, AlertCircle, RefreshCw,
  Activity, Rocket, Globe, Zap, BarChart3,
} from "lucide-react";

interface NewsSummaryProps {
  summary: string | null;
  generatedAt: string | null;
  isLoading: boolean;
  onRegenerate?: () => void;
}

const SECTION_CONFIG: Record<string, { icon: typeof Activity; accent: string; border: string; bg: string }> = {
  "Market Pulse": { icon: Activity, accent: "text-[#60A5FA]", border: "border-l-[#3B82F6]/40", bg: "bg-[#3B82F6]/8" },
  "Big Movers": { icon: Rocket, accent: "text-primary", border: "border-l-primary/40", bg: "bg-primary/8" },
  "Macro Watch": { icon: Globe, accent: "text-[#34D399]", border: "border-l-[#34D399]/40", bg: "bg-[#34D399]/8" },
  "Derivatives Insight": { icon: BarChart3, accent: "text-[#A78BFA]", border: "border-l-[#8B5CF6]/40", bg: "bg-[#8B5CF6]/8" },
  "Signal": { icon: Zap, accent: "text-amber-400", border: "border-l-amber-400/40", bg: "bg-amber-400/8" },
};

// Left column sections
const LEFT_SECTIONS = new Set(["Market Pulse", "Big Movers"]);
// Right column sections
const RIGHT_SECTIONS = new Set(["Macro Watch", "Derivatives Insight", "Signal"]);

function formatInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*|_(.+?)_|\[(bullish|bearish|neutral)\]|([↑↓])([\d.]+%)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    if (match[1]) {
      parts.push(<strong key={match.index} className="font-semibold text-[#F1F5F9]">{match[1]}</strong>);
    } else if (match[2]) {
      parts.push(<em key={match.index} className="italic text-primary/90">{match[2]}</em>);
    } else if (match[3]) {
      const tag = match[3];
      const tagColor = tag === "bullish" ? "text-[#22C55E] bg-[#22C55E]/10 border-[#22C55E]/20"
        : tag === "bearish" ? "text-[#F87171] bg-[#F87171]/10 border-[#F87171]/20"
        : "text-[#94A3B8] bg-white/[0.04] border-white/[0.06]";
      parts.push(<span key={match.index} className={`ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${tagColor}`}>{tag}</span>);
    } else if (match[4] && match[5]) {
      const isUp = match[4] === "↑";
      parts.push(<span key={match.index} className={`font-mono font-bold ${isUp ? "text-[#22C55E] glow-green" : "text-[#F87171] glow-red"}`}>{match[4]}{match[5]}</span>);
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.length === 0 ? text : <>{parts}</>;
}

// Parse summary into sections
interface Section {
  title: string;
  items: { type: "bullet" | "signal" | "text"; content: string }[];
}

function parseSections(text: string): Section[] {
  const lines = text.split("\n");
  const sections: Section[] = [];
  let current: Section | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const sectionMatch = trimmed.match(/^\*\*(.+?)\*\*$/);
    if (sectionMatch) {
      current = { title: sectionMatch[1], items: [] };
      sections.push(current);
      continue;
    }

    if (!current) {
      current = { title: "Market Pulse", items: [] };
      sections.push(current);
    }

    const bulletMatch = trimmed.match(/^[-•]\s+(.*)/);
    if (bulletMatch) {
      current.items.push({ type: "bullet", content: bulletMatch[1] });
    } else if (trimmed.startsWith("_") && trimmed.endsWith("_")) {
      current.items.push({ type: "signal", content: trimmed.slice(1, -1) });
    } else if (current.title === "Signal") {
      current.items.push({ type: "signal", content: trimmed });
    } else {
      current.items.push({ type: "text", content: trimmed });
    }
  }
  return sections;
}

function RenderSection({ section }: { section: Section }) {
  const config = SECTION_CONFIG[section.title] || SECTION_CONFIG["Market Pulse"];
  const Icon = config.icon;
  const isSignal = section.title === "Signal";

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className={`flex items-center justify-center size-7 rounded-lg ${config.bg}`}>
          <Icon className={`size-3.5 ${config.accent}`} />
        </div>
        <span className={`text-[12px] font-bold uppercase tracking-[0.08em] ${config.accent}`}>
          {section.title}
        </span>
      </div>

      {/* Items */}
      <div className="space-y-1.5">
        {section.items.map((item, i) => {
          if (item.type === "signal") {
            return (
              <div key={i} className="relative rounded-xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/[0.08] via-orange-500/[0.04] to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent" />
                <div className="relative px-4 py-3 border border-amber-500/15 rounded-xl">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Sparkles className="size-3 text-amber-400" />
                    <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-amber-400">AI Signal</span>
                  </div>
                  <p className="text-[14px] italic leading-relaxed font-medium text-amber-200/90">
                    {formatInline(item.content)}
                  </p>
                </div>
              </div>
            );
          }

          if (item.type === "bullet") {
            return (
              <div key={i} className={`flex gap-2 pl-1 py-1.5 border-l-2 ${config.border} ml-1 rounded-r hover:bg-white/[0.02] transition-colors`}>
                <span className="text-[14px] leading-relaxed text-[#94A3B8] pl-2">
                  {formatInline(item.content)}
                </span>
              </div>
            );
          }

          return (
            <p key={i} className="text-[14px] leading-relaxed text-[#94A3B8]">
              {formatInline(item.content)}
            </p>
          );
        })}
      </div>
    </div>
  );
}

export function NewsSummary({ summary, generatedAt, isLoading, onRegenerate }: NewsSummaryProps) {
  const sections = summary ? parseSections(summary) : [];
  const leftSections = sections.filter(s => LEFT_SECTIONS.has(s.title));
  const rightSections = sections.filter(s => RIGHT_SECTIONS.has(s.title));

  // If parsing doesn't split cleanly, put first half left, second half right
  if (leftSections.length === 0 && rightSections.length === 0 && sections.length > 0) {
    const mid = Math.ceil(sections.length / 2);
    leftSections.push(...sections.slice(0, mid));
    rightSections.push(...sections.slice(mid));
  }

  return (
    <div className="kpi-card rounded-2xl">
      <div className="p-6 md:p-7">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center size-8 rounded-xl bg-[#3B82F6]/12 shadow-[0_0_12px_rgba(59,130,246,0.10)]">
              <Sparkles className="size-4 text-[#60A5FA]" />
            </div>
            <div>
              <span className="text-sm font-bold text-[#F1F5F9] tracking-tight">
                AI Market Summary
              </span>
              <p className="text-[10px] text-[#64748B] flex items-center gap-1.5 mt-0.5">
                <span className="live-dot" />
                Powered by live Delta Exchange data
              </p>
            </div>
          </div>
          {generatedAt && !isLoading && (
            <div className="flex items-center gap-1.5 text-[10px] text-[#64748B]">
              <Clock className="size-2.5" />
              <span>{timeAgo(generatedAt)}</span>
            </div>
          )}
        </div>

        <div className="gradient-separator mb-5" />

        {/* Content */}
        {isLoading ? (
          <div className="grid md:grid-cols-[3fr_2fr] gap-6">
            <div className="space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[90%]" />
              <Skeleton className="h-4 w-24 mt-3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[80%]" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[85%]" />
              <Skeleton className="h-16 w-full mt-3 rounded-xl" />
            </div>
          </div>
        ) : summary ? (
          <>
            {/* 2-column layout */}
            <div className="grid md:grid-cols-[3fr_2fr] gap-0">
              {/* Left column: Market Pulse + Big Movers */}
              <div className="space-y-5 pr-6 md:border-r md:border-white/[0.06]">
                {leftSections.map((section, i) => (
                  <div key={section.title}>
                    {i > 0 && <div className="gradient-separator mb-4" />}
                    <RenderSection section={section} />
                  </div>
                ))}
              </div>

              {/* Right column: Macro Watch + Signal */}
              <div className="space-y-5 pl-0 md:pl-6 pt-5 md:pt-0">
                {rightSections.map((section, i) => (
                  <div key={section.title}>
                    {i > 0 && <div className="gradient-separator mb-4" />}
                    <RenderSection section={section} />
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="gradient-separator mt-5 mb-3" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[10px] text-[#64748B]">
                <Sparkles className="size-2.5 text-[#60A5FA]" />
                <span>AI Generated</span>
                {generatedAt && (
                  <>
                    <span className="text-[#475569]">•</span>
                    <span>{timeAgo(generatedAt)}</span>
                  </>
                )}
              </div>
              {onRegenerate && (
                <button onClick={onRegenerate} className="flex items-center gap-1 text-[10px] text-[#64748B] hover:text-primary transition-colors">
                  <RefreshCw className="size-2.5" />
                  Regenerate
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <AlertCircle className="size-5 text-[#64748B]" />
            <p className="text-sm text-[#64748B]">No market summary available yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
