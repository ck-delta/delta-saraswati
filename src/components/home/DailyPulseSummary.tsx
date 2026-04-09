'use client';

import { useMarketStore } from '@/stores/market-store';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * AI-generated daily market summary card.
 * Renders the summary text (with basic markdown) and bullet highlights.
 */
export default function DailyPulseSummary() {
  const dailyPulse = useMarketStore((s) => s.dailyPulse);
  const loading = useMarketStore((s) => s.loadingDailyPulse);
  const error = useMarketStore((s) => s.errorDailyPulse);
  const fetchDailyPulse = useMarketStore((s) => s.fetchDailyPulse);

  return (
    <div className="rounded-xl border border-[#2a2a32] bg-[#1a1a1f] p-5 animate-fade-in">
      {/* ---- Header ---- */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Sparkle icon */}
          <svg
            className="h-5 w-5 text-[#fd7d02]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
            />
          </svg>
          <h2 className="text-base font-semibold text-white">Daily Pulse</h2>
        </div>

        {/* Refresh button */}
        <button
          onClick={() => fetchDailyPulse()}
          disabled={loading}
          className="flex h-7 w-7 items-center justify-center rounded-md text-[#9ca3af] transition-colors hover:bg-[#222228] hover:text-white disabled:opacity-40"
          aria-label="Refresh daily pulse"
        >
          <svg
            className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
            />
          </svg>
        </button>
      </div>

      {/* ---- Content ---- */}
      <div className="mt-4">
        {loading && !dailyPulse ? (
          <DailyPulseLoading />
        ) : error && !dailyPulse ? (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <p className="text-sm text-[#9ca3af]">Could not load market summary</p>
            <button
              onClick={() => fetchDailyPulse()}
              className="text-xs text-[#fd7d02] hover:underline"
            >
              Try again
            </button>
          </div>
        ) : dailyPulse ? (
          <>
            {/* Summary paragraph(s) — supports **bold** and newlines */}
            <div className="space-y-2 text-sm leading-relaxed text-[#d1d5db]">
              {renderMarkdown(dailyPulse.summary)}
            </div>

            {/* Bullet highlights */}
            {dailyPulse.highlights.length > 0 && (
              <ul className="mt-4 space-y-2">
                {dailyPulse.highlights.map((highlight, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#d1d5db]">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#fd7d02]" />
                    <span>{renderInlineMarkdown(highlight)}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : null}
      </div>

      {/* ---- Footer disclaimer ---- */}
      <div className="mt-4 flex items-center gap-1.5 border-t border-[#2a2a32] pt-3">
        <div className="h-1.5 w-1.5 rounded-full bg-[#fd7d02] animate-pulse-dot" />
        <span className="text-[10px] text-[#6b7280]">
          Powered by AI — not financial advice
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Simple markdown renderer for the summary
// ---------------------------------------------------------------------------

/** Render paragraph text with basic markdown: **bold** and newlines */
function renderMarkdown(text: string) {
  const paragraphs = text.split(/\n{2,}/);
  return paragraphs.map((para, i) => (
    <p key={i}>{renderInlineMarkdown(para)}</p>
  ));
}

/** Render inline **bold** markers */
function renderInlineMarkdown(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

// ---------------------------------------------------------------------------
// Shimmer loading skeleton
// ---------------------------------------------------------------------------

function DailyPulseLoading() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-11/12" />
      <Skeleton className="h-4 w-4/5" />
      <div className="pt-2" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="pt-2" />
      <div className="flex items-start gap-2">
        <Skeleton className="mt-1 h-2 w-2 rounded-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
      <div className="flex items-start gap-2">
        <Skeleton className="mt-1 h-2 w-2 rounded-full" />
        <Skeleton className="h-4 w-3/5" />
      </div>
      <div className="flex items-start gap-2">
        <Skeleton className="mt-1 h-2 w-2 rounded-full" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    </div>
  );
}
