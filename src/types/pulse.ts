// AI Market Summary — new Daily Pulse structured shape.

export type SentimentBadge = 'BULLISH' | 'NEUTRAL' | 'BEARISH';

export interface PulseItem {
  /** Symbol or label — e.g. "BTC", "RAVE", "Bank of Korea…" */
  label: string;
  /** Optional price, only used in Market Pulse / Big Movers */
  price?: string;
  /** Optional change pct, only used in Market Pulse / Big Movers */
  changePct?: number;
  /** One-line reason written by Groq. */
  reason: string;
  /** Longer reasoning context revealed on hover. */
  detail?: string;
  sentiment: SentimentBadge;
  /** Optional extra chip shown after the reason, e.g. "AI: NEUTRAL 5.9". */
  tag?: string;
  /** Token symbol to route to on click (e.g. "BTCUSDT"). If set, row → /research?token=X. */
  symbol?: string;
  /** External URL to open on click (news items). Takes precedence over `symbol`. */
  url?: string;
  /** Source name for news/macro items (used with publishedAt for attribution). */
  source?: string;
  /** ISO timestamp of when a news item was published. */
  publishedAt?: string;
  /** Domain for favicon fetch on news/macro items. */
  sourceDomain?: string;
}

export interface MarketSummary {
  marketPulse: PulseItem[];
  bigMovers: PulseItem[];
  macroWatch: PulseItem[];
  derivativesInsight: PulseItem[];
  fundingExtremes: PulseItem[];
  volumeAnomalies: PulseItem[];
  oiChanges: PulseItem[];
}

export interface PulseCallouts {
  fearGreed: {
    value: number;
    label: string;
    prevValue: number | null;
    direction: 'up' | 'down' | 'flat';
  } | null;
  btcDominance: {
    value: number;
    marketCapPctChange24h: number;
  } | null;
  nextMacroEvents: {
    kind: string;
    label: string;
    countdown: string;   // "3d 4h"
    datetime: string;
  }[];
  /** Conditional alerts — only present when they fire. */
  alerts: {
    kind: 'funding-extreme' | 'pattern' | 'divergence';
    text: string;
  }[];
}

export interface PulseResponse {
  summary: MarketSummary;
  callouts: PulseCallouts;
  timestamp: number;
  stale?: boolean;
}
