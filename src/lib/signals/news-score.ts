// News sub-score — tradermonty Market News Analyst framework, crypto-adapted.
// Impact = (PriceImpact × Breadth) × Forward, decayed by age (12h half-life).
// Per-token aggregation: sum decayed impacts of matching headlines → sigmoid → 0-10.

import type { NewsItem } from '@/types/news';

export type PriceImpactTier = 'severe' | 'major' | 'moderate' | 'minor' | 'negligible';
export type BreadthTier = 'systemic' | 'cross-asset' | 'sector-wide' | 'token-specific';
export type ForwardTier = 'regime-change' | 'trend-confirmation' | 'isolated' | 'contrary';
export type Direction = 'bull' | 'bear' | 'neutral';

export interface ScoredHeadline {
  title: string;
  source: string;
  publishedAt: number;  // normalised to ms timestamp
  direction: Direction;
  priceImpactTier: PriceImpactTier;
  breadthTier: BreadthTier;
  forwardTier: ForwardTier;
  rawImpact: number;        // points before decay
  decayedImpact: number;    // after age decay
  signedDecayedImpact: number; // decayedImpact × direction (positive for bull, negative for bear)
  affectedTokens: string[];
}

export interface NewsScoreResult {
  score: number;                // 0-10 per token
  label: 'Strong Sell' | 'Sell' | 'Neutral' | 'Buy' | 'Strong Buy';
  tokenSymbol: string;
  matched: ScoredHeadline[];
  aggregatedImpact: number;     // sum of signed decayed impacts
}

const POINTS: Record<PriceImpactTier, number> = {
  severe: 10,
  major: 7,
  moderate: 4,
  minor: 2,
  negligible: 1,
};

const BREADTH_MULT: Record<BreadthTier, number> = {
  systemic: 3,
  'cross-asset': 2,
  'sector-wide': 1.5,
  'token-specific': 1,
};

const FORWARD_MULT: Record<ForwardTier, number> = {
  'regime-change': 1.5,
  'trend-confirmation': 1.25,
  isolated: 1.0,
  contrary: 0.75,
};

export const HALF_LIFE_HOURS = 12;

// ---------------------------------------------------------------------------
// Token → keyword map for matching. Cheap heuristic; Groq can override via
// `affectedTokens` field when available.
// ---------------------------------------------------------------------------

const TOKEN_KEYWORDS: Record<string, string[]> = {
  BTCUSDT: ['bitcoin', 'btc', 'satoshi', 'btc-usd', 'btcusd'],
  ETHUSDT: ['ethereum', 'eth', 'vitalik', 'ether', 'eth-usd', 'ethusd'],
  SOLUSDT: ['solana', 'sol', 'sol-usd'],
  XRPUSDT: ['xrp', 'ripple'],
  DOGEUSDT: ['dogecoin', 'doge'],
  PAXGUSDT: ['pax gold', 'paxg', 'gold'],
};

function tier(score: number): NewsScoreResult['label'] {
  if (score <= 2.5) return 'Strong Sell';
  if (score <= 4.0) return 'Sell';
  if (score < 6.0) return 'Neutral';
  if (score < 7.5) return 'Buy';
  return 'Strong Buy';
}

function toMs(publishedAt: string | number): number {
  if (typeof publishedAt === 'number') return publishedAt;
  const t = Date.parse(publishedAt);
  return isNaN(t) ? Date.now() : t;
}

function ageDecay(publishedAtMs: number, nowMs = Date.now()): number {
  const ageHours = Math.max(0, (nowMs - publishedAtMs) / 3_600_000);
  return Math.pow(0.5, ageHours / HALF_LIFE_HOURS);
}

// ---------------------------------------------------------------------------
// Classification fallback when Groq annotations aren't available.
// Uses sentimentScore + simple heuristics. Avoids blocking render when Groq
// is rate-limited.
// ---------------------------------------------------------------------------

function heuristicClassify(item: NewsItem): {
  direction: Direction;
  priceImpactTier: PriceImpactTier;
  breadthTier: BreadthTier;
  forwardTier: ForwardTier;
  affectedTokens: string[];
} {
  const title = item.title.toLowerCase();
  let direction: Direction = 'neutral';
  if (item.sentiment === 'positive') direction = 'bull';
  else if (item.sentiment === 'negative') direction = 'bear';
  else if (item.sentimentScore != null) {
    if (item.sentimentScore >= 60) direction = 'bull';
    else if (item.sentimentScore <= 40) direction = 'bear';
  }

  // Price-impact heuristic: strong words → major; mild → minor.
  let priceImpactTier: PriceImpactTier = 'moderate';
  if (/hack|exploit|crashes|plummets|surges|skyrocket|emergency|approve.*etf|ban/.test(title)) {
    priceImpactTier = 'severe';
  } else if (/rallies|drops|falls|rises|gains|loses|announces|partnership/.test(title)) {
    priceImpactTier = 'moderate';
  } else {
    priceImpactTier = 'minor';
  }

  // Breadth heuristic
  let breadthTier: BreadthTier = 'token-specific';
  if (/fomc|fed|cpi|recession|macro|stocks|gold|bonds|dollar|global|systemic/.test(title)) {
    breadthTier = 'systemic';
  } else if (/crypto|market|altcoins|defi|regulation|sec/.test(title)) {
    breadthTier = 'cross-asset';
  } else if (/bitcoin|ethereum|solana/.test(title) && /other|lead|follow/.test(title)) {
    breadthTier = 'sector-wide';
  }

  // Forward-looking heuristic
  let forwardTier: ForwardTier = 'isolated';
  if (/etf|approval|ban|regulation|halving|fork|upgrade|pivot/.test(title)) {
    forwardTier = 'regime-change';
  } else if (/continues|momentum|trend/.test(title)) {
    forwardTier = 'trend-confirmation';
  } else if (/despite|however|contrary/.test(title)) {
    forwardTier = 'contrary';
  }

  // Affected tokens via keyword matching
  const affectedTokens: string[] = [];
  for (const [symbol, kws] of Object.entries(TOKEN_KEYWORDS)) {
    if (kws.some((kw) => title.includes(kw))) affectedTokens.push(symbol);
  }

  return { direction, priceImpactTier, breadthTier, forwardTier, affectedTokens };
}

// ---------------------------------------------------------------------------
// Public: score a single headline
// ---------------------------------------------------------------------------

export interface AnnotatedNewsItem extends NewsItem {
  priceImpactTier?: PriceImpactTier;
  breadthTier?: BreadthTier;
  forwardTier?: ForwardTier;
  direction?: Direction;
  affectedTokens?: string[];
}

export function scoreHeadline(item: AnnotatedNewsItem, nowMs = Date.now()): ScoredHeadline {
  const fb = heuristicClassify(item);
  const priceImpactTier = item.priceImpactTier ?? fb.priceImpactTier;
  const breadthTier = item.breadthTier ?? fb.breadthTier;
  const forwardTier = item.forwardTier ?? fb.forwardTier;
  const direction = item.direction ?? fb.direction;
  const affectedTokens = item.affectedTokens ?? fb.affectedTokens;
  const publishedAtMs = toMs(item.publishedAt);

  const rawImpact = POINTS[priceImpactTier] * BREADTH_MULT[breadthTier] * FORWARD_MULT[forwardTier];
  const decayedImpact = rawImpact * ageDecay(publishedAtMs, nowMs);
  const signed = direction === 'bull' ? decayedImpact : direction === 'bear' ? -decayedImpact : 0;

  return {
    title: item.title,
    source: item.source,
    publishedAt: publishedAtMs,
    direction,
    priceImpactTier,
    breadthTier,
    forwardTier,
    rawImpact,
    decayedImpact,
    signedDecayedImpact: signed,
    affectedTokens,
  };
}

// ---------------------------------------------------------------------------
// Public: per-token aggregation
// ---------------------------------------------------------------------------

export function calculateNewsScore(
  tokenSymbol: string,
  headlines: AnnotatedNewsItem[],
  nowMs = Date.now(),
): NewsScoreResult {
  const scored = headlines.map((h) => scoreHeadline(h, nowMs));
  const matched = scored.filter((s) => s.affectedTokens.includes(tokenSymbol));

  if (matched.length === 0) {
    return {
      score: 5.0,
      label: 'Neutral',
      tokenSymbol,
      matched: [],
      aggregatedImpact: 0,
    };
  }

  const agg = matched.reduce((s, m) => s + m.signedDecayedImpact, 0);

  // Sigmoid-style scaling: saturate at ~±45 impact points → 0 or 10.
  // 45 = 10 pts × 3 breadth × 1.5 forward → single "maximum severity" headline at t=0.
  const SATURATION = 45;
  const normalised = Math.tanh(agg / SATURATION); // -1 .. +1
  const score = Math.max(0, Math.min(10, 5 + normalised * 5));

  return {
    score: Number(score.toFixed(2)),
    label: tier(score),
    tokenSymbol,
    matched,
    aggregatedImpact: Number(agg.toFixed(2)),
  };
}
