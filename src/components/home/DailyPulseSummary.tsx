'use client';

import { useMarketStore } from '@/stores/market-store';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * AI Daily Pulse — Delta-styled summary card with orange left stripe.
 */
export default function DailyPulseSummary() {
  const dailyPulse = useMarketStore((s) => s.dailyPulse);
  const loading = useMarketStore((s) => s.loadingDailyPulse);
  const error = useMarketStore((s) => s.errorDailyPulse);
  const fetchDailyPulse = useMarketStore((s) => s.fetchDailyPulse);

  return (
    <div
      className="p-5"
      style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--bg-secondary)',
        borderLeft: '4px solid var(--brand-bg)',
        borderRadius: 'var(--radius-2xl)',
      }}
    >
      {/* ---- Header ---- */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2
            className="text-sm font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            Daily Market Pulse
          </h2>
          <span
            className="inline-flex items-center text-[10px] font-semibold uppercase tracking-wider"
            style={{
              padding: '2px 6px',
              background: 'var(--brand-bg-muted)',
              color: 'var(--brand-text)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            AI
          </span>
        </div>

        <button
          onClick={() => fetchDailyPulse()}
          disabled={loading}
          className="flex h-7 w-7 items-center justify-center transition-colors duration-150"
          style={{
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-tertiary)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-secondary)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-tertiary)';
          }}
          aria-label="Refresh daily pulse"
        >
          <svg
            className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`}
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

      {/* ---- Body ---- */}
      <div className="mt-4">
        {loading && !dailyPulse ? (
          <DailyPulseLoading />
        ) : error && !dailyPulse ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Could not load market summary
            </p>
            <button
              onClick={() => fetchDailyPulse()}
              className="text-xs hover:underline"
              style={{ color: 'var(--brand-text)' }}
            >
              Try again
            </button>
          </div>
        ) : dailyPulse ? (
          <>
            <div
              className="space-y-2 text-sm leading-relaxed"
              style={{ color: 'var(--text-primary)' }}
            >
              {renderMarkdown(dailyPulse.summary)}
            </div>

            {dailyPulse.highlights.length > 0 && (
              <ul className="mt-4 space-y-2">
                {dailyPulse.highlights.map((highlight, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-sm"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <span
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: 'var(--brand-bg)' }}
                    />
                    <span>{renderInlineMarkdown(highlight)}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : null}
      </div>

      {/* ---- Footer ---- */}
      <div
        className="mt-4 pt-3"
        style={{ borderTop: '1px solid var(--divider-primary)' }}
      >
        <span
          className="text-[11px]"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Updated now &middot; AI-generated &middot; Not financial advice
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Markdown helpers
// ---------------------------------------------------------------------------

function renderMarkdown(text: string) {
  const paragraphs = text.split(/\n{2,}/);
  return paragraphs.map((para, i) => (
    <p key={i}>{renderInlineMarkdown(para)}</p>
  ));
}

function renderInlineMarkdown(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong
          key={i}
          className="font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function DailyPulseLoading() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-11/12" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}
