// AI Signal composite aggregator.
// Equal-weight mean of News / Technical / Derivatives.
// Confidence = agreement-based (stdev across the three sub-scores).

import type { NewsScoreResult } from './news-score';
import type { TechScoreResult } from './tech-score';
import type { DerivScoreResult } from './deriv-score';

export type SignalTier = 'Strong Sell' | 'Sell' | 'Neutral' | 'Buy' | 'Strong Buy';

export interface AISignalResult {
  /** 0-10 composite. */
  score: number;
  /** Tier label. */
  label: SignalTier;
  /** 50-95 %, based on agreement between sub-scores. */
  confidence: number;
  /** True when |max - min| ≥ 4 across the three sub-scores. */
  divergent: boolean;
  /** Direction as a single adjective, suitable for icons/colors. */
  direction: 'bull' | 'bear' | 'neutral';
  /** The three constituent scores. */
  news: { score: number; label: SignalTier };
  technical: { score: number; label: SignalTier; regime: 'trending' | 'ranging' };
  derivatives: { score: number; label: SignalTier; positioning: string };
  /** 1-3 bullet reasons derived from strongest contributors. */
  reasoning: string[];
}

function tier(score: number): SignalTier {
  if (score <= 2.5) return 'Strong Sell';
  if (score <= 4.0) return 'Sell';
  if (score < 6.0) return 'Neutral';
  if (score < 7.5) return 'Buy';
  return 'Strong Buy';
}

function directionOf(score: number): 'bull' | 'bear' | 'neutral' {
  if (score >= 6) return 'bull';
  if (score <= 4) return 'bear';
  return 'neutral';
}

function stdev(vals: number[]): number {
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const v = vals.reduce((s, x) => s + (x - mean) ** 2, 0) / vals.length;
  return Math.sqrt(v);
}

export function aggregateAISignal(
  news: NewsScoreResult,
  tech: TechScoreResult,
  deriv: DerivScoreResult,
): AISignalResult {
  const scores = [news.score, tech.score, deriv.score];
  const composite = scores.reduce((a, b) => a + b, 0) / 3;

  // Agreement-based confidence.
  // Max possible stdev across three 0-10 values centered around their mean is bounded.
  // Empirically a stdev of 2.5 indicates near-maximal disagreement; use that as the
  // "zero agreement" ceiling.
  const sd = stdev(scores);
  const agreement = Math.max(0, 1 - sd / 2.5);
  const confidence = Math.round(50 + agreement * 45);

  // Divergent flag: any pair of sub-scores differs by ≥ 4.
  const divergent = Math.max(...scores) - Math.min(...scores) >= 4;

  // Reasoning: surface the strongest single contributor per constituent.
  const reasoning: string[] = [];

  // News: show net impact + top matched headline
  if (news.matched.length > 0) {
    const top = [...news.matched].sort((a, b) => Math.abs(b.signedDecayedImpact) - Math.abs(a.signedDecayedImpact))[0];
    const dirWord = top.direction === 'bull' ? 'bullish' : top.direction === 'bear' ? 'bearish' : 'neutral';
    reasoning.push(`News: ${news.matched.length} headline(s), lead ${dirWord} — "${top.title.slice(0, 70)}${top.title.length > 70 ? '…' : ''}"`);
  } else {
    reasoning.push('News: no token-specific headlines in recent feed (default neutral 5.0)');
  }

  // Technical: strongest absolute contributor
  if (tech.contributions.length > 0) {
    const strongest = [...tech.contributions].sort((a, b) => Math.abs(b.weighted) - Math.abs(a.weighted))[0];
    reasoning.push(`Technical (${tech.regime}): ${strongest.reason}`);
  }

  // Derivatives: positioning verdict
  reasoning.push(`Derivatives: ${deriv.positioning} · funding p${deriv.fundingPercentile.toFixed(0)}`);

  return {
    score: Number(composite.toFixed(2)),
    label: tier(composite),
    confidence,
    divergent,
    direction: directionOf(composite),
    news: { score: news.score, label: news.label },
    technical: { score: tech.score, label: tech.label, regime: tech.regime },
    derivatives: { score: deriv.score, label: deriv.label, positioning: deriv.positioning },
    reasoning,
  };
}
