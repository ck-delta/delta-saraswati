// Derivatives sub-score — positioning + funding percentile + basis.
// All three are contrarian signals. Returns 0-10 with 5 = neutral.

import calibration from './funding-calibration.json';

export type PositioningLabel =
  | 'Long Buildup'
  | 'Short Buildup'
  | 'Short Covering'
  | 'Long Unwinding'
  | 'Undetermined';

export interface DerivScoreResult {
  score: number;
  label: 'Strong Sell' | 'Sell' | 'Neutral' | 'Buy' | 'Strong Buy';
  positioning: PositioningLabel;
  positioningScore: number;     // -2 .. +2
  fundingRate: number;          // raw decimal from Delta ticker
  fundingScore: number;         // -2 .. +2
  fundingPercentile: number;    // 0..100 where this rate sits in 30d BTC+ETH distribution
  basis: number | null;         // spot-perp basis as decimal (e.g. 0.0012 = 0.12%)
  basisScore: number;           // -1 .. +1
  rawSum: number;
  reasoning: string[];
}

function tier(score: number): DerivScoreResult['label'] {
  if (score <= 2.5) return 'Strong Sell';
  if (score <= 4.0) return 'Sell';
  if (score < 6.0) return 'Neutral';
  if (score < 7.5) return 'Buy';
  return 'Strong Buy';
}

// ---------------------------------------------------------------------------
// Positioning: compare price delta vs OI delta over the lookback window
// ---------------------------------------------------------------------------

export function classifyPositioning(
  priceNow: number,
  pricePrior: number,
  oiNow: number,
  oiPrior: number,
): { label: PositioningLabel; score: number; description: string } {
  if (pricePrior === 0 || oiPrior === 0) {
    return { label: 'Undetermined', score: 0, description: 'Insufficient history to classify' };
  }
  const priceUp = priceNow > pricePrior;
  const oiUp = oiNow > oiPrior;

  // Apply a dead-zone: require ≥0.3% move in BOTH price and OI, else undetermined.
  // Prevents flipping on noise.
  const priceMovePct = Math.abs((priceNow - pricePrior) / pricePrior);
  const oiMovePct = Math.abs((oiNow - oiPrior) / oiPrior);
  if (priceMovePct < 0.003 || oiMovePct < 0.003) {
    return { label: 'Undetermined', score: 0, description: 'Price/OI move too small to classify' };
  }

  if (priceUp && oiUp) return { label: 'Long Buildup', score: 2, description: 'OI rising with price — fresh longs entering' };
  if (priceUp && !oiUp) return { label: 'Short Covering', score: 1, description: 'Price rising as OI drops — shorts exiting' };
  if (!priceUp && oiUp) return { label: 'Short Buildup', score: -2, description: 'OI rising as price falls — fresh shorts' };
  return { label: 'Long Unwinding', score: -1, description: 'Price falling as OI drops — longs exiting' };
}

// ---------------------------------------------------------------------------
// Funding rate: contrarian scoring using percentiles from 30d BTC+ETH history
// ---------------------------------------------------------------------------

export function scoreFunding(fundingRate: number): {
  score: number;
  percentile: number;
  description: string;
} {
  const { p5, p20, p80, p95 } = calibration.combined_btc_eth;

  // Estimate percentile by linear interpolation of the known percentile points.
  // Not perfect but good enough for UI display.
  let percentile: number;
  if (fundingRate <= p5) percentile = 5 * (fundingRate / p5);
  else if (fundingRate <= p20) percentile = 5 + ((fundingRate - p5) / (p20 - p5)) * 15;
  else if (fundingRate <= p80) percentile = 20 + ((fundingRate - p20) / (p80 - p20)) * 60;
  else if (fundingRate <= p95) percentile = 80 + ((fundingRate - p80) / (p95 - p80)) * 15;
  else percentile = Math.min(100, 95 + ((fundingRate - p95) / Math.abs(p95)) * 5);
  percentile = Math.max(0, Math.min(100, percentile));

  if (fundingRate >= p95) return { score: -2, percentile, description: `Funding ${(fundingRate * 100).toFixed(3)}% at p${percentile.toFixed(0)} — crowded longs, contrarian bearish` };
  if (fundingRate >= p80) return { score: -1, percentile, description: `Funding ${(fundingRate * 100).toFixed(3)}% at p${percentile.toFixed(0)} — elevated longs` };
  if (fundingRate > p20) return { score: 0, percentile, description: `Funding ${(fundingRate * 100).toFixed(3)}% at p${percentile.toFixed(0)} — neutral range` };
  if (fundingRate > p5) return { score: 1, percentile, description: `Funding ${(fundingRate * 100).toFixed(3)}% at p${percentile.toFixed(0)} — elevated shorts` };
  return { score: 2, percentile, description: `Funding ${(fundingRate * 100).toFixed(3)}% at p${percentile.toFixed(0)} — crowded shorts, contrarian bullish` };
}

// ---------------------------------------------------------------------------
// Basis (spot-perp spread): persistent premium = retail long bias (bearish contrarian)
// ---------------------------------------------------------------------------

export function scoreBasis(spotPrice: number, markPrice: number): {
  score: number;
  basis: number;
  description: string;
} {
  if (!spotPrice || !markPrice) return { score: 0, basis: 0, description: 'Basis: insufficient data' };
  const basis = (markPrice - spotPrice) / spotPrice;
  if (basis >= 0.0005) return { score: -1, basis, description: `Basis +${(basis * 100).toFixed(3)}% — perp premium (long bias)` };
  if (basis <= -0.0005) return { score: 1, basis, description: `Basis ${(basis * 100).toFixed(3)}% — perp discount (short bias / fear)` };
  return { score: 0, basis, description: `Basis ${(basis * 100).toFixed(3)}% — flat` };
}

// ---------------------------------------------------------------------------
// Combine
// ---------------------------------------------------------------------------

export interface DerivScoreInput {
  priceNow: number;
  pricePrior: number;   // 6h ago
  oiNow: number;
  oiPrior: number;      // 6h ago
  fundingRate: number;
  spotPrice: number;
  markPrice: number;
}

export function calculateDerivScore(input: DerivScoreInput): DerivScoreResult {
  const pos = classifyPositioning(input.priceNow, input.pricePrior, input.oiNow, input.oiPrior);
  const fund = scoreFunding(input.fundingRate);
  const basis = scoreBasis(input.spotPrice, input.markPrice);

  const rawSum = pos.score + fund.score + basis.score;
  // Max possible: 2 + 2 + 1 = 5 (or -5)
  const normalised = Math.max(-1, Math.min(1, rawSum / 5));
  const score = Math.max(0, Math.min(10, 5 + normalised * 5));

  return {
    score: Number(score.toFixed(2)),
    label: tier(score),
    positioning: pos.label,
    positioningScore: pos.score,
    fundingRate: input.fundingRate,
    fundingScore: fund.score,
    fundingPercentile: Number(fund.percentile.toFixed(1)),
    basis: basis.basis,
    basisScore: basis.score,
    rawSum,
    reasoning: [pos.description, fund.description, basis.description],
  };
}
