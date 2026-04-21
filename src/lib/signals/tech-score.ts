// Technical sub-score — regime-adaptive composite of 10 indicators + 6 patterns.
// Returns 0-10 score with per-indicator breakdown for transparency.

import {
  calculateRSI,
  calculateMACD,
  calculateADX,
  calculateSMA,
  calculateBollingerBands,
  calculateStochastic,
  calculateWilliamsR,
  calculateCCI,
  calculateMFI,
  calculatePSAR,
  detectRegime,
  volumeConfirmationMultiplier,
  type Regime,
} from '@/lib/ta/indicators';
import { detectPatterns, type DetectedPattern } from '@/lib/ta/patterns';
import type { DeltaCandle } from '@/types/delta';

export interface IndicatorContribution {
  name: string;
  vote: number;       // -2 .. +2 raw directional vote
  weight: number;     // regime-adjusted weight applied to vote
  weighted: number;   // vote * weight
  reason: string;
}

export interface TechScoreResult {
  /** Final score on 0-10 scale (5 = neutral). */
  score: number;
  /** Tier label derived from score. */
  label: 'Strong Sell' | 'Sell' | 'Neutral' | 'Buy' | 'Strong Buy';
  regime: Regime;
  /** ADX value used to pick regime. */
  adx: number;
  /** Volume-confirmation multiplier applied to raw weighted sum. */
  volumeMultiplier: number;
  /** Every indicator's contribution for the UI and SIGNALS.md transparency. */
  contributions: IndicatorContribution[];
  /** Patterns that fired on the last candle. */
  patterns: DetectedPattern[];
  /** Raw weighted sum before scaling. */
  rawSum: number;
}

function tier(score: number): TechScoreResult['label'] {
  if (score <= 2.5) return 'Strong Sell';
  if (score <= 4.0) return 'Sell';
  if (score < 6.0) return 'Neutral';
  if (score < 7.5) return 'Buy';
  return 'Strong Buy';
}

// ---------------------------------------------------------------------------
// Regime-adaptive weights.
//   trending: MACD, SMA stack, PSAR get the bump (trend-following)
//   ranging:  RSI, Stoch, Williams %R, CCI, MFI, Bollinger get the bump
// ADX gets full weight when trending, half when ranging (it's a trend strength
// indicator — useless in a flat market).
// ---------------------------------------------------------------------------

const WEIGHTS = {
  trending: {
    RSI: 0.8,
    MACD: 1.2,
    ADX: 1.0,
    SMA: 1.2,
    Bollinger: 0.8,
    Stochastic: 0.8,
    'Williams %R': 0.8,
    CCI: 0.8,
    MFI: 0.8,
    'Parabolic SAR': 1.2,
  },
  ranging: {
    RSI: 1.2,
    MACD: 0.8,
    ADX: 0.5,
    SMA: 0.8,
    Bollinger: 1.2,
    Stochastic: 1.2,
    'Williams %R': 1.2,
    CCI: 1.2,
    MFI: 1.2,
    'Parabolic SAR': 0.8,
  },
} as const;

function last<T>(arr: T[]): T | undefined {
  return arr[arr.length - 1];
}

function lastNonNaN(arr: number[]): number {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (!isNaN(arr[i])) return arr[i];
  }
  return NaN;
}

// ---------------------------------------------------------------------------
// Per-indicator vote generators (each returns -2..+2 with one-line reason)
// ---------------------------------------------------------------------------

function voteRSI(rsi: number): { vote: number; reason: string } {
  if (rsi < 30) return { vote: 2, reason: `RSI ${rsi.toFixed(1)} — oversold, bounce likely` };
  if (rsi < 45) return { vote: 1, reason: `RSI ${rsi.toFixed(1)} — leaning bearish but not extreme` };
  if (rsi <= 55) return { vote: 0, reason: `RSI ${rsi.toFixed(1)} — neutral` };
  if (rsi <= 70) return { vote: -1, reason: `RSI ${rsi.toFixed(1)} — elevated, momentum building` };
  return { vote: -2, reason: `RSI ${rsi.toFixed(1)} — overbought, pullback risk` };
}

function voteMACD(macd: number, signal: number, hist: number, prevHist: number): { vote: number; reason: string } {
  const rising = hist > prevHist;
  const falling = hist < prevHist;
  if (macd > signal && hist > 0 && rising) return { vote: 2, reason: 'MACD bullish cross with rising histogram' };
  if (macd > signal && hist > 0) return { vote: 1, reason: 'MACD above signal, bullish' };
  if (macd < signal && hist < 0 && falling) return { vote: -2, reason: 'MACD bearish cross with falling histogram' };
  if (macd < signal && hist < 0) return { vote: -1, reason: 'MACD below signal, bearish' };
  return { vote: 0, reason: 'MACD near signal line, mixed' };
}

function voteADX(adx: number, plusDI: number, minusDI: number): { vote: number; reason: string } {
  if (adx < 20) return { vote: 0, reason: `ADX ${adx.toFixed(1)} — weak trend` };
  if (plusDI > minusDI) return { vote: 1, reason: `ADX ${adx.toFixed(1)} — trending bullish (+DI > -DI)` };
  return { vote: -1, reason: `ADX ${adx.toFixed(1)} — trending bearish (-DI > +DI)` };
}

function voteSMA(price: number, s20: number, s50: number, s200: number): { vote: number; reason: string } {
  const aboveCount = [s20, s50, s200].filter((s) => !isNaN(s) && price > s).length;
  if (aboveCount === 3) return { vote: 2, reason: 'Price above SMA 20/50/200 — bullish structure' };
  if (aboveCount === 2) return { vote: 1, reason: 'Price above 2 of 3 SMAs — mostly bullish' };
  if (aboveCount === 1) return { vote: -1, reason: 'Price below most SMAs — bearish pressure' };
  return { vote: -2, reason: 'Price below SMA 20/50/200 — bearish structure' };
}

function voteBollinger(price: number, upper: number, middle: number, lower: number): { vote: number; reason: string } {
  const range = upper - lower;
  if (range === 0) return { vote: 0, reason: 'Bollinger: flat bands' };
  // %B: where in the band price sits (0 = lower, 1 = upper)
  const pctB = (price - lower) / range;
  if (pctB <= 0.05) return { vote: 2, reason: 'Price at/below lower Bollinger band — oversold' };
  if (pctB <= 0.25) return { vote: 1, reason: 'Price near lower Bollinger band' };
  if (pctB >= 0.95) return { vote: -2, reason: 'Price at/above upper Bollinger band — overbought' };
  if (pctB >= 0.75) return { vote: -1, reason: 'Price near upper Bollinger band' };
  return { vote: 0, reason: 'Price inside Bollinger bands — neutral' };
}

function voteStoch(k: number, d: number): { vote: number; reason: string } {
  if (k < 20 && k > d) return { vote: 2, reason: `Stoch %K ${k.toFixed(1)} — oversold, turning up` };
  if (k < 20) return { vote: 1, reason: `Stoch %K ${k.toFixed(1)} — oversold zone` };
  if (k > 80 && k < d) return { vote: -2, reason: `Stoch %K ${k.toFixed(1)} — overbought, turning down` };
  if (k > 80) return { vote: -1, reason: `Stoch %K ${k.toFixed(1)} — overbought zone` };
  return { vote: 0, reason: `Stoch %K ${k.toFixed(1)} — neutral` };
}

function voteWilliams(w: number): { vote: number; reason: string } {
  if (w <= -80) return { vote: 2, reason: `Williams %R ${w.toFixed(1)} — oversold` };
  if (w <= -60) return { vote: 1, reason: `Williams %R ${w.toFixed(1)} — leaning bullish` };
  if (w >= -20) return { vote: -2, reason: `Williams %R ${w.toFixed(1)} — overbought` };
  if (w >= -40) return { vote: -1, reason: `Williams %R ${w.toFixed(1)} — leaning bearish` };
  return { vote: 0, reason: `Williams %R ${w.toFixed(1)} — neutral` };
}

function voteCCI(cci: number): { vote: number; reason: string } {
  if (cci <= -200) return { vote: 2, reason: `CCI ${cci.toFixed(0)} — extreme oversold` };
  if (cci <= -100) return { vote: 1, reason: `CCI ${cci.toFixed(0)} — oversold` };
  if (cci >= 200) return { vote: -2, reason: `CCI ${cci.toFixed(0)} — extreme overbought` };
  if (cci >= 100) return { vote: -1, reason: `CCI ${cci.toFixed(0)} — overbought` };
  return { vote: 0, reason: `CCI ${cci.toFixed(0)} — neutral` };
}

function voteMFI(mfi: number): { vote: number; reason: string } {
  if (mfi < 20) return { vote: 2, reason: `MFI ${mfi.toFixed(1)} — oversold, money flowing out exhausted` };
  if (mfi < 40) return { vote: 1, reason: `MFI ${mfi.toFixed(1)} — weak money flow` };
  if (mfi > 80) return { vote: -2, reason: `MFI ${mfi.toFixed(1)} — overbought, money flow exhausted` };
  if (mfi > 60) return { vote: -1, reason: `MFI ${mfi.toFixed(1)} — strong money flow, extended` };
  return { vote: 0, reason: `MFI ${mfi.toFixed(1)} — neutral` };
}

function votePSAR(price: number, sar: number, trendUp: boolean, prevTrendUp: boolean): { vote: number; reason: string } {
  if (trendUp && !prevTrendUp) return { vote: 2, reason: 'PSAR flipped below price — trend flip bullish' };
  if (!trendUp && prevTrendUp) return { vote: -2, reason: 'PSAR flipped above price — trend flip bearish' };
  if (trendUp) return { vote: 1, reason: `PSAR below price at ${sar.toFixed(2)} — uptrend continuing` };
  return { vote: -1, reason: `PSAR above price at ${sar.toFixed(2)} — downtrend continuing` };
}

// ---------------------------------------------------------------------------
// Main scorer
// ---------------------------------------------------------------------------

export function calculateTechScore(candles: DeltaCandle[]): TechScoreResult | null {
  if (candles.length < 50) return null;

  const closes = candles.map((c) => Number(c.close));
  const highs = candles.map((c) => Number(c.high));
  const lows = candles.map((c) => Number(c.low));
  const volumes = candles.map((c) => Number(c.volume) || 0);

  // Indicators
  const rsiArr = calculateRSI(closes, 14);
  const macdRes = calculateMACD(closes, 12, 26, 9);
  const adxRes = calculateADX(highs, lows, closes, 14);
  const sma20 = calculateSMA(closes, 20);
  const sma50 = calculateSMA(closes, 50);
  const sma200 = closes.length >= 200 ? calculateSMA(closes, 200) : new Array(closes.length).fill(NaN);
  const boll = calculateBollingerBands(closes, 20, 2);
  const stoch = calculateStochastic(highs, lows, closes, 14, 3, 3);
  const willR = calculateWilliamsR(highs, lows, closes, 14);
  const cci = calculateCCI(highs, lows, closes, 20);
  const mfi = calculateMFI(highs, lows, closes, volumes, 14);
  const psar = calculatePSAR(highs, lows);

  const rsi = lastNonNaN(rsiArr);
  const macdVal = lastNonNaN(macdRes.macd);
  const signalVal = lastNonNaN(macdRes.signal);
  const histVal = lastNonNaN(macdRes.histogram);
  const prevHist = macdRes.histogram[macdRes.histogram.length - 2] ?? histVal;
  const adxVal = lastNonNaN(adxRes.adx);
  const plusDI = lastNonNaN(adxRes.plusDI);
  const minusDI = lastNonNaN(adxRes.minusDI);
  const s20 = lastNonNaN(sma20);
  const s50 = lastNonNaN(sma50);
  const s200 = lastNonNaN(sma200);
  const upper = lastNonNaN(boll.upper);
  const middle = lastNonNaN(boll.middle);
  const lower = lastNonNaN(boll.lower);
  const kVal = lastNonNaN(stoch.k);
  const dVal = lastNonNaN(stoch.d);
  const wrVal = lastNonNaN(willR);
  const cciVal = lastNonNaN(cci);
  const mfiVal = lastNonNaN(mfi);
  const sarVal = last(psar.psar) ?? NaN;
  const sarUp = last(psar.trendUp) ?? false;
  const prevSarUp = psar.trendUp[psar.trendUp.length - 2] ?? sarUp;
  const price = closes[closes.length - 1];

  const regime = detectRegime(isNaN(adxVal) ? 0 : adxVal);
  const w = WEIGHTS[regime];

  const contributions: IndicatorContribution[] = [];

  function push(name: keyof typeof w, vote: number, reason: string) {
    const weight = w[name];
    contributions.push({ name, vote, weight, weighted: vote * weight, reason });
  }

  if (!isNaN(rsi)) { const v = voteRSI(rsi); push('RSI', v.vote, v.reason); }
  if (!isNaN(macdVal) && !isNaN(signalVal)) { const v = voteMACD(macdVal, signalVal, histVal, prevHist); push('MACD', v.vote, v.reason); }
  if (!isNaN(adxVal)) { const v = voteADX(adxVal, plusDI, minusDI); push('ADX', v.vote, v.reason); }
  if (!isNaN(s20) && !isNaN(s50)) { const v = voteSMA(price, s20, s50, s200); push('SMA', v.vote, v.reason); }
  if (!isNaN(upper)) { const v = voteBollinger(price, upper, middle, lower); push('Bollinger', v.vote, v.reason); }
  if (!isNaN(kVal)) { const v = voteStoch(kVal, dVal); push('Stochastic', v.vote, v.reason); }
  if (!isNaN(wrVal)) { const v = voteWilliams(wrVal); push('Williams %R', v.vote, v.reason); }
  if (!isNaN(cciVal)) { const v = voteCCI(cciVal); push('CCI', v.vote, v.reason); }
  if (!isNaN(mfiVal)) { const v = voteMFI(mfiVal); push('MFI', v.vote, v.reason); }
  if (!isNaN(sarVal)) { const v = votePSAR(price, sarVal, sarUp, prevSarUp); push('Parabolic SAR', v.vote, v.reason); }

  // Patterns contribute directly at ±2 weighted by confidence
  const patterns = detectPatterns(candles);
  let patternWeighted = 0;
  for (const p of patterns) {
    const dir = p.direction === 'bull' ? 1 : -1;
    patternWeighted += dir * 2 * p.confidence;
  }

  // Raw sum
  const indicatorWeighted = contributions.reduce((s, c) => s + c.weighted, 0);
  const rawSum = indicatorWeighted + patternWeighted;

  // Max possible: sum of |2 * weight| for all indicators + 2 * patterns (we cap pattern influence)
  const maxPossible = contributions.reduce((s, c) => s + 2 * c.weight, 0) + 4; // allow up to 2 confirmed patterns
  const normalised = Math.max(-1, Math.min(1, rawSum / maxPossible)); // -1 .. +1

  // Volume multiplier
  const volMult = volumeConfirmationMultiplier(closes, volumes);
  const adjusted = normalised * volMult;

  // Scale to 0-10 with 5 = neutral
  const score = Math.max(0, Math.min(10, 5 + adjusted * 5));

  return {
    score: Number(score.toFixed(2)),
    label: tier(score),
    regime,
    adx: isNaN(adxVal) ? 0 : Number(adxVal.toFixed(1)),
    volumeMultiplier: volMult,
    contributions,
    patterns,
    rawSum: Number(rawSum.toFixed(3)),
  };
}
