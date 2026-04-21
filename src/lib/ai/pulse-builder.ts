// Build the hybrid AI Market Summary.
// - TypeScript selects which tokens/headlines/events to surface (deterministic).
// - Groq writes the one-line reasons.
// - Callouts are pure TypeScript.

import type { DeltaTicker } from '@/types/delta';
import type { NewsItem } from '@/types/news';
import type { TokenCardData } from '@/types/market';
import type { PulseCallouts, MarketSummary, SentimentBadge } from '@/types/pulse';
import type { FearGreedData } from '@/types/market';
import type { GlobalMarketData } from '@/lib/api/coingecko';
import type { AISignalResult } from '@/lib/signals/composite';
import type { AnnotatedNewsItem } from '@/lib/signals/news-score';
import { scoreFunding } from '@/lib/signals/deriv-score';
import { scoreHeadline } from '@/lib/signals/news-score';
import { nextEvents, countdownLabel } from '@/lib/macro/calendar';

// ---------------------------------------------------------------------------
// Inputs collected by the route (server-side)
// ---------------------------------------------------------------------------

export interface PulseInputs {
  perpetuals: TokenCardData[];
  rawTickers: DeltaTicker[];
  fearGreed: FearGreedData | null;
  prevFearGreed: number | null;
  news: NewsItem[];
  global: GlobalMarketData | null;
  /** Map of symbol -> AI Signal (already computed for top tokens). */
  aiSignals: Record<string, AISignalResult | null>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(n: number): string {
  if (n >= 1000) return `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n >= 0.01) return `$${n.toFixed(3)}`;
  return `$${n.toFixed(4)}`;
}

function fmtPct(n: number): string {
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
}

function signedDirection(score: number): SentimentBadge {
  if (score >= 6) return 'BULLISH';
  if (score <= 4) return 'BEARISH';
  return 'NEUTRAL';
}

// ---------------------------------------------------------------------------
// Callouts (pure TypeScript, no Groq needed)
// ---------------------------------------------------------------------------

export function buildCallouts(input: PulseInputs): PulseCallouts {
  // Fear & Greed
  let fearGreed: PulseCallouts['fearGreed'] = null;
  if (input.fearGreed) {
    const prev = input.prevFearGreed;
    let direction: 'up' | 'down' | 'flat' = 'flat';
    if (prev != null) {
      if (input.fearGreed.value > prev) direction = 'up';
      else if (input.fearGreed.value < prev) direction = 'down';
    }
    fearGreed = {
      value: input.fearGreed.value,
      label: input.fearGreed.classification,
      prevValue: prev,
      direction,
    };
  }

  // BTC dominance
  const btcDominance = input.global
    ? {
        value: input.global.btcDominance,
        marketCapPctChange24h: input.global.marketCapPctChange24h,
      }
    : null;

  // Fed/CPI events (top 2 upcoming)
  const now = new Date();
  const events = nextEvents(now).slice(0, 2);
  const nextMacroEvents = events.map((e) => ({
    kind: e.kind,
    label: e.label,
    countdown: countdownLabel(e.datetime, now),
    datetime: e.datetime,
  }));

  // Conditional alerts
  const alerts: PulseCallouts['alerts'] = [];

  // 1. Funding extremes — token with funding at p95 or p5
  for (const p of input.perpetuals) {
    const f = scoreFunding(p.fundingRate);
    if (f.score === -2) {
      alerts.push({
        kind: 'funding-extreme',
        text: `${p.symbol} funding at p${f.percentile.toFixed(0)} — crowded longs, squeeze risk`,
      });
      break; // one is enough
    } else if (f.score === 2) {
      alerts.push({
        kind: 'funding-extreme',
        text: `${p.symbol} funding at p${f.percentile.toFixed(0)} — crowded shorts, squeeze fuel`,
      });
      break;
    }
  }

  // 2. Divergence — top 3 tokens with |max - min| ≥ 4 across sub-scores
  for (const sym of Object.keys(input.aiSignals)) {
    const sig = input.aiSignals[sym];
    if (sig?.divergent) {
      alerts.push({
        kind: 'divergence',
        text: `${sym.replace(/USDT$/, '')} signals diverge — News ${sig.news.score}, Tech ${sig.technical.score}, Deriv ${sig.derivatives.score}`,
      });
      break;
    }
  }

  return { fearGreed, btcDominance, nextMacroEvents, alerts };
}

// ---------------------------------------------------------------------------
// Curated items — what to send to Groq for 1-line reasoning
// ---------------------------------------------------------------------------

export interface CuratedItem {
  bucket: 'marketPulse' | 'bigMovers' | 'macroWatch' | 'derivativesInsight';
  label: string;
  price?: string;
  changePct?: number;
  /** Factual context the LLM uses to write the reason. */
  context: string;
  /** Pre-computed sentiment hint (LLM can override). */
  hintSentiment?: SentimentBadge;
  /** Optional tag chip. */
  tag?: string;
}

export function curateItems(input: PulseInputs): CuratedItem[] {
  const items: CuratedItem[] = [];

  // ---- Market Pulse: BTC, ETH + top-volume 3rd token with AI Signal tag ----
  const topBySymbol: Record<string, TokenCardData | undefined> = {
    BTCUSDT: input.perpetuals.find((t) => t.symbol === 'BTCUSDT'),
    ETHUSDT: input.perpetuals.find((t) => t.symbol === 'ETHUSDT'),
    SOLUSDT: input.perpetuals.find((t) => t.symbol === 'SOLUSDT'),
  };
  for (const [sym, t] of Object.entries(topBySymbol)) {
    if (!t) continue;
    const sig = input.aiSignals[sym];
    const sigText = sig ? `AI Signal: ${sig.label} ${sig.score}/10 (${sig.technical.regime}).` : '';
    const regimeText = sig?.technical.regime === 'trending' ? 'trending regime' : 'ranging regime';
    items.push({
      bucket: 'marketPulse',
      label: t.underlying || sym.replace(/USDT$/, ''),
      price: formatPrice(t.price),
      changePct: t.priceChangePct24h,
      context: `${sym} 24h change ${fmtPct(t.priceChangePct24h)}, vol $${(t.turnoverUsd / 1e6).toFixed(0)}M. ${sigText} ${regimeText}. funding ${(t.fundingRate * 100).toFixed(3)}%.`,
      hintSentiment: sig ? signedDirection(sig.score) : t.priceChangePct24h >= 0 ? 'BULLISH' : 'BEARISH',
      tag: sig ? `${sig.label} ${sig.score.toFixed(1)}` : undefined,
    });
  }

  // ---- Big Movers: top 1 gainer + top 1 loser (outside the top 3) ----
  const candidates = input.perpetuals.filter((t) => !['BTCUSDT', 'ETHUSDT', 'SOLUSDT'].includes(t.symbol));
  const gainer = [...candidates].sort((a, b) => b.priceChangePct24h - a.priceChangePct24h)[0];
  const loser = [...candidates].sort((a, b) => a.priceChangePct24h - b.priceChangePct24h)[0];
  for (const t of [gainer, loser]) {
    if (!t || Math.abs(t.priceChangePct24h) < 1) continue;
    items.push({
      bucket: 'bigMovers',
      label: t.underlying || t.symbol.replace(/USDT$/, ''),
      price: formatPrice(t.price),
      changePct: t.priceChangePct24h,
      context: `${t.symbol} 24h change ${fmtPct(t.priceChangePct24h)}, vol $${(t.turnoverUsd / 1e6).toFixed(1)}M, funding ${(t.fundingRate * 100).toFixed(3)}%. ${t.fundingRate > 0.002 ? 'Aggressive long funding paying out.' : t.fundingRate < -0.002 ? 'Aggressive short funding paying out.' : 'Funding normal.'}`,
      hintSentiment: t.priceChangePct24h >= 0 ? 'BULLISH' : 'BEARISH',
    });
  }

  // ---- Macro Watch: highest-impact systemic/cross-asset headlines ----
  const annotated: AnnotatedNewsItem[] = input.news.slice(0, 20);
  const scored = annotated.map((n) => ({
    item: n,
    scored: scoreHeadline(n),
  }));
  // Keep only macro-relevant (breadth systemic or cross-asset)
  const macro = scored
    .filter((s) => ['systemic', 'cross-asset'].includes(s.scored.breadthTier))
    .sort((a, b) => b.scored.decayedImpact - a.scored.decayedImpact)
    .slice(0, 2);

  for (const { item, scored } of macro) {
    items.push({
      bucket: 'macroWatch',
      label: item.title,
      context: `Source: ${item.source}. Price impact tier: ${scored.priceImpactTier}. Forward: ${scored.forwardTier}.`,
      hintSentiment: scored.direction === 'bull' ? 'BULLISH' : scored.direction === 'bear' ? 'BEARISH' : 'NEUTRAL',
    });
  }
  // If no macro headlines, fall back to top-impact token-specific headlines
  if (macro.length === 0) {
    const fallback = scored
      .sort((a, b) => b.scored.decayedImpact - a.scored.decayedImpact)
      .slice(0, 2);
    for (const { item, scored } of fallback) {
      items.push({
        bucket: 'macroWatch',
        label: item.title,
        context: `Source: ${item.source}. Tier: ${scored.priceImpactTier}/${scored.breadthTier}/${scored.forwardTier}.`,
        hintSentiment: scored.direction === 'bull' ? 'BULLISH' : scored.direction === 'bear' ? 'BEARISH' : 'NEUTRAL',
      });
    }
  }

  // ---- Derivatives Insight: BTC / ETH perp state + any extreme ----
  const btcSig = input.aiSignals['BTCUSDT'];
  const btc = input.perpetuals.find((t) => t.symbol === 'BTCUSDT');
  if (btc) {
    items.push({
      bucket: 'derivativesInsight',
      label: 'BTC perp',
      context: `BTC funding ${(btc.fundingRate * 100).toFixed(4)}%, OI $${(btc.openInterestUsd / 1e6).toFixed(0)}M, positioning: ${btcSig?.derivatives.positioning ?? 'N/A'}. Funding percentile: p${scoreFunding(btc.fundingRate).percentile.toFixed(0)}.`,
      hintSentiment: btcSig ? signedDirection(btcSig.derivatives.score) : 'NEUTRAL',
      tag: btcSig?.derivatives.positioning,
    });
  }
  // Add second derivs row: most extreme funding across all perps
  const mostExtremeFunding = [...input.perpetuals].sort(
    (a, b) => Math.abs(b.fundingRate) - Math.abs(a.fundingRate),
  )[0];
  if (mostExtremeFunding && mostExtremeFunding.symbol !== 'BTCUSDT') {
    const s = scoreFunding(mostExtremeFunding.fundingRate);
    items.push({
      bucket: 'derivativesInsight',
      label: `${mostExtremeFunding.underlying || mostExtremeFunding.symbol.replace(/USDT$/, '')} funding`,
      context: `${mostExtremeFunding.symbol} funding ${(mostExtremeFunding.fundingRate * 100).toFixed(4)}% (p${s.percentile.toFixed(0)}). ${s.description}`,
      hintSentiment: s.score > 0 ? 'BULLISH' : s.score < 0 ? 'BEARISH' : 'NEUTRAL',
    });
  }

  return items;
}

// ---------------------------------------------------------------------------
// Groq prompt — asks the LLM to write one-line reasons for each curated item
// ---------------------------------------------------------------------------

export function buildGroqPrompt(items: CuratedItem[]): string {
  const list = items
    .map(
      (it, idx) =>
        `${idx + 1}. [${it.bucket}] ${it.label}${it.price ? ` at ${it.price}` : ''}${it.changePct != null ? ` ${fmtPct(it.changePct)}` : ''}\n   Context: ${it.context}\n   Hint: ${it.hintSentiment ?? 'UNKNOWN'}`,
    )
    .join('\n\n');

  return `You are Saraswati's market desk analyst. You write one-line reasons for a live market summary card.

For each item below, produce:
- reason: ONE short sentence (<= 14 words), plain English, no jargon, no repeating the price/ticker already shown.
- sentiment: BULLISH / NEUTRAL / BEARISH (you may override the hint if the context warrants).

Rules:
- Sentences must sound like a trader's quick note, not marketing copy.
- No vague phrases like "market is mixed" — say WHY.
- Use specific catalysts (volume, funding, level, news event) when present.
- If the item is a news headline, the "reason" is the market takeaway, not a restatement.

Respond ONLY as JSON:
{
  "items": [
    { "index": 1, "reason": "...", "sentiment": "BULLISH|NEUTRAL|BEARISH" },
    ...
  ]
}

INPUT:
${list}`;
}

// ---------------------------------------------------------------------------
// Merge Groq output back into structured MarketSummary
// ---------------------------------------------------------------------------

export function mergeIntoSummary(
  items: CuratedItem[],
  groqOutput: { items: { index: number; reason: string; sentiment: string }[] },
): MarketSummary {
  const byIdx: Record<number, { reason: string; sentiment: SentimentBadge }> = {};
  for (const r of groqOutput.items ?? []) {
    const sent = (r.sentiment || '').toUpperCase();
    const safe: SentimentBadge = sent === 'BULLISH' || sent === 'BEARISH' ? sent : 'NEUTRAL';
    byIdx[r.index] = { reason: r.reason?.trim() || 'No comment available.', sentiment: safe };
  }

  const summary: MarketSummary = {
    marketPulse: [],
    bigMovers: [],
    macroWatch: [],
    derivativesInsight: [],
  };

  items.forEach((it, idx) => {
    const g = byIdx[idx + 1];
    const reason = g?.reason ?? 'Data point (reason pending).';
    const sentiment = g?.sentiment ?? it.hintSentiment ?? 'NEUTRAL';
    summary[it.bucket].push({
      label: it.label,
      price: it.price,
      changePct: it.changePct,
      reason,
      sentiment,
      tag: it.tag,
    });
  });

  return summary;
}
