// Candlestick & chart pattern detection.
// Operates on arrays of OHLC candles. Returns the detected patterns with
// directional bias (bull / bear) and a confidence 0-1.

import type { DeltaCandle } from '@/types/delta';

export type PatternDirection = 'bull' | 'bear';

export interface DetectedPattern {
  name: string;
  direction: PatternDirection;
  confidence: number;
  atIndex: number;
}

interface OHLC {
  open: number;
  high: number;
  low: number;
  close: number;
}

function toOHLC(c: DeltaCandle): OHLC {
  return {
    open: Number(c.open),
    high: Number(c.high),
    low: Number(c.low),
    close: Number(c.close),
  };
}

// ---------------------------------------------------------------------------
// Hammer / Inverted Hammer (bullish reversal, at support)
// ---------------------------------------------------------------------------

function isHammer(c: OHLC): boolean {
  const body = Math.abs(c.close - c.open);
  const range = c.high - c.low;
  if (range === 0) return false;
  const lowerWick = Math.min(c.open, c.close) - c.low;
  const upperWick = c.high - Math.max(c.open, c.close);
  return (
    body / range < 0.35 &&
    lowerWick >= 2 * body &&
    upperWick < body * 0.5
  );
}

// ---------------------------------------------------------------------------
// Shooting Star (bearish reversal, at resistance)
// ---------------------------------------------------------------------------

function isShootingStar(c: OHLC): boolean {
  const body = Math.abs(c.close - c.open);
  const range = c.high - c.low;
  if (range === 0) return false;
  const upperWick = c.high - Math.max(c.open, c.close);
  const lowerWick = Math.min(c.open, c.close) - c.low;
  return (
    body / range < 0.35 &&
    upperWick >= 2 * body &&
    lowerWick < body * 0.5
  );
}

// ---------------------------------------------------------------------------
// Bullish / Bearish Engulfing
// ---------------------------------------------------------------------------

function isBullishEngulfing(prev: OHLC, curr: OHLC): boolean {
  return (
    prev.close < prev.open && // prev red
    curr.close > curr.open && // curr green
    curr.open <= prev.close &&
    curr.close >= prev.open &&
    Math.abs(curr.close - curr.open) > Math.abs(prev.close - prev.open)
  );
}

function isBearishEngulfing(prev: OHLC, curr: OHLC): boolean {
  return (
    prev.close > prev.open && // prev green
    curr.close < curr.open && // curr red
    curr.open >= prev.close &&
    curr.close <= prev.open &&
    Math.abs(curr.close - curr.open) > Math.abs(prev.close - prev.open)
  );
}

// ---------------------------------------------------------------------------
// Morning / Evening Star (3-candle reversal)
// ---------------------------------------------------------------------------

function isMorningStar(a: OHLC, b: OHLC, c: OHLC): boolean {
  const aBody = Math.abs(a.close - a.open);
  const bBody = Math.abs(b.close - b.open);
  const cBody = Math.abs(c.close - c.open);
  const aRed = a.close < a.open;
  const cGreen = c.close > c.open;
  const bSmall = bBody < aBody * 0.4;
  return aRed && cGreen && bSmall && c.close >= (a.open + a.close) / 2 && cBody > bBody;
}

function isEveningStar(a: OHLC, b: OHLC, c: OHLC): boolean {
  const aBody = Math.abs(a.close - a.open);
  const bBody = Math.abs(b.close - b.open);
  const cBody = Math.abs(c.close - c.open);
  const aGreen = a.close > a.open;
  const cRed = c.close < c.open;
  const bSmall = bBody < aBody * 0.4;
  return aGreen && cRed && bSmall && c.close <= (a.open + a.close) / 2 && cBody > bBody;
}

// ---------------------------------------------------------------------------
// Double Top / Double Bottom (approximation on recent swing highs/lows)
// ---------------------------------------------------------------------------

function detectDoubleTop(candles: OHLC[]): boolean {
  if (candles.length < 20) return false;
  const window = candles.slice(-20);
  const highs = window.map((c) => c.high);
  const maxIdx1 = highs.indexOf(Math.max(...highs));
  // find second peak at least 5 bars away
  let maxIdx2 = -1;
  let max2 = -Infinity;
  for (let i = 0; i < highs.length; i++) {
    if (Math.abs(i - maxIdx1) < 5) continue;
    if (highs[i] > max2) {
      max2 = highs[i];
      maxIdx2 = i;
    }
  }
  if (maxIdx2 === -1) return false;
  const peak1 = highs[maxIdx1];
  const peak2 = max2;
  const similar = Math.abs(peak1 - peak2) / peak1 < 0.015; // within 1.5%
  const recent = Math.max(maxIdx1, maxIdx2) >= 15;
  const lastClose = window[window.length - 1].close;
  return similar && recent && lastClose < Math.min(peak1, peak2) * 0.98;
}

function detectDoubleBottom(candles: OHLC[]): boolean {
  if (candles.length < 20) return false;
  const window = candles.slice(-20);
  const lows = window.map((c) => c.low);
  const minIdx1 = lows.indexOf(Math.min(...lows));
  let minIdx2 = -1;
  let min2 = Infinity;
  for (let i = 0; i < lows.length; i++) {
    if (Math.abs(i - minIdx1) < 5) continue;
    if (lows[i] < min2) {
      min2 = lows[i];
      minIdx2 = i;
    }
  }
  if (minIdx2 === -1) return false;
  const trough1 = lows[minIdx1];
  const trough2 = min2;
  const similar = Math.abs(trough1 - trough2) / trough1 < 0.015;
  const recent = Math.max(minIdx1, minIdx2) >= 15;
  const lastClose = window[window.length - 1].close;
  return similar && recent && lastClose > Math.max(trough1, trough2) * 1.02;
}

// ---------------------------------------------------------------------------
// Flag detection (bull flag / bear flag)
// A strong up-move followed by a shallow pullback consolidation = bull flag.
// ---------------------------------------------------------------------------

function detectBullFlag(candles: OHLC[]): boolean {
  if (candles.length < 12) return false;
  const recent = candles.slice(-12);
  const poleStart = recent[0].close;
  const poleEnd = recent[4].close;
  const poleGain = (poleEnd - poleStart) / poleStart;
  if (poleGain < 0.08) return false; // need ≥8% run-up
  // flag: next 7 candles consolidate within 40% retrace
  const flag = recent.slice(5, 12);
  const flagHigh = Math.max(...flag.map((c) => c.high));
  const flagLow = Math.min(...flag.map((c) => c.low));
  const flagRange = flagHigh - flagLow;
  const poleRange = poleEnd - poleStart;
  if (flagRange > poleRange * 0.5) return false;
  // last close near flag high = breakout imminent
  return recent[11].close >= flagHigh * 0.97;
}

function detectBearFlag(candles: OHLC[]): boolean {
  if (candles.length < 12) return false;
  const recent = candles.slice(-12);
  const poleStart = recent[0].close;
  const poleEnd = recent[4].close;
  const poleLoss = (poleEnd - poleStart) / poleStart;
  if (poleLoss > -0.08) return false;
  const flag = recent.slice(5, 12);
  const flagHigh = Math.max(...flag.map((c) => c.high));
  const flagLow = Math.min(...flag.map((c) => c.low));
  const flagRange = flagHigh - flagLow;
  const poleRange = Math.abs(poleEnd - poleStart);
  if (flagRange > poleRange * 0.5) return false;
  return recent[11].close <= flagLow * 1.03;
}

// ---------------------------------------------------------------------------
// Main entry
// ---------------------------------------------------------------------------

export function detectPatterns(candles: DeltaCandle[]): DetectedPattern[] {
  const ohlc = candles.map(toOHLC);
  const results: DetectedPattern[] = [];
  const n = ohlc.length;
  if (n < 3) return results;

  const lastIdx = n - 1;
  const last = ohlc[lastIdx];
  const prev = ohlc[lastIdx - 1];

  // Single-candle patterns (last candle)
  if (isHammer(last)) {
    results.push({ name: 'Hammer', direction: 'bull', confidence: 0.7, atIndex: lastIdx });
  }
  if (isShootingStar(last)) {
    results.push({ name: 'Shooting Star', direction: 'bear', confidence: 0.7, atIndex: lastIdx });
  }

  // Two-candle
  if (isBullishEngulfing(prev, last)) {
    results.push({ name: 'Bullish Engulfing', direction: 'bull', confidence: 0.8, atIndex: lastIdx });
  }
  if (isBearishEngulfing(prev, last)) {
    results.push({ name: 'Bearish Engulfing', direction: 'bear', confidence: 0.8, atIndex: lastIdx });
  }

  // Three-candle
  if (n >= 3) {
    const a = ohlc[lastIdx - 2];
    const b = ohlc[lastIdx - 1];
    const c = ohlc[lastIdx];
    if (isMorningStar(a, b, c)) {
      results.push({ name: 'Morning Star', direction: 'bull', confidence: 0.85, atIndex: lastIdx });
    }
    if (isEveningStar(a, b, c)) {
      results.push({ name: 'Evening Star', direction: 'bear', confidence: 0.85, atIndex: lastIdx });
    }
  }

  // Multi-bar patterns
  if (detectDoubleTop(ohlc)) {
    results.push({ name: 'Double Top', direction: 'bear', confidence: 0.75, atIndex: lastIdx });
  }
  if (detectDoubleBottom(ohlc)) {
    results.push({ name: 'Double Bottom', direction: 'bull', confidence: 0.75, atIndex: lastIdx });
  }
  if (detectBullFlag(ohlc)) {
    results.push({ name: 'Bull Flag', direction: 'bull', confidence: 0.7, atIndex: lastIdx });
  }
  if (detectBearFlag(ohlc)) {
    results.push({ name: 'Bear Flag', direction: 'bear', confidence: 0.7, atIndex: lastIdx });
  }

  return results;
}
