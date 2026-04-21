// Technical Analysis Indicators
// Pure functions — no external dependencies.
// All operate on arrays of closing prices (number[]) unless noted.

// ---------------------------------------------------------------------------
// Simple Moving Average
// ---------------------------------------------------------------------------

/**
 * Simple Moving Average.
 * Returns an array of the same length as `data`.
 * Indices before the first full window are NaN.
 */
export function calculateSMA(data: number[], period: number): number[] {
  const result: number[] = new Array(data.length).fill(NaN);
  if (data.length < period || period <= 0) return result;

  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  result[period - 1] = sum / period;

  for (let i = period; i < data.length; i++) {
    sum += data[i] - data[i - period];
    result[i] = sum / period;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Exponential Moving Average
// ---------------------------------------------------------------------------

/**
 * Exponential Moving Average.
 * Uses the standard multiplier: 2 / (period + 1).
 * Seeds the first value with the SMA of the first `period` points.
 * Indices before the seed are NaN.
 */
export function calculateEMA(data: number[], period: number): number[] {
  const result: number[] = new Array(data.length).fill(NaN);
  if (data.length < period || period <= 0) return result;

  // Seed with SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  const smaFirst = sum / period;
  result[period - 1] = smaFirst;

  const k = 2 / (period + 1);

  for (let i = period; i < data.length; i++) {
    result[i] = data[i] * k + result[i - 1] * (1 - k);
  }

  return result;
}

// ---------------------------------------------------------------------------
// RSI (Relative Strength Index)
// ---------------------------------------------------------------------------

/**
 * Standard RSI.
 * Uses Wilder's smoothing method (exponential moving average of gains/losses).
 *
 * @param closes - Array of closing prices.
 * @param period - Lookback period (default 14).
 * @returns Array of same length; first `period` values are NaN.
 */
export function calculateRSI(closes: number[], period = 14): number[] {
  const result: number[] = new Array(closes.length).fill(NaN);
  if (closes.length < period + 1) return result;

  // Calculate price changes
  const changes: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    changes.push(closes[i] - closes[i - 1]);
  }

  // First average gain and loss (simple average of first `period` changes)
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 0; i < period; i++) {
    if (changes[i] >= 0) avgGain += changes[i];
    else avgLoss += Math.abs(changes[i]);
  }
  avgGain /= period;
  avgLoss /= period;

  // First RSI value at index = period
  if (avgLoss === 0) {
    result[period] = 100;
  } else {
    const rs = avgGain / avgLoss;
    result[period] = 100 - 100 / (1 + rs);
  }

  // Subsequent values: Wilder's smoothing
  for (let i = period; i < changes.length; i++) {
    const change = changes[i];
    const gain = change >= 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    if (avgLoss === 0) {
      result[i + 1] = 100;
    } else {
      const rs = avgGain / avgLoss;
      result[i + 1] = 100 - 100 / (1 + rs);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// MACD (Moving Average Convergence Divergence)
// ---------------------------------------------------------------------------

export interface MACDResult {
  macd: number[];
  signal: number[];
  histogram: number[];
}

/**
 * MACD indicator.
 *
 * @param closes - Array of closing prices.
 * @param fast   - Fast EMA period (default 12).
 * @param slow   - Slow EMA period (default 26).
 * @param sig    - Signal EMA period (default 9).
 */
export function calculateMACD(
  closes: number[],
  fast = 12,
  slow = 26,
  sig = 9,
): MACDResult {
  const len = closes.length;
  const macd: number[] = new Array(len).fill(NaN);
  const signal: number[] = new Array(len).fill(NaN);
  const histogram: number[] = new Array(len).fill(NaN);

  if (len < slow) return { macd, signal, histogram };

  const emaFast = calculateEMA(closes, fast);
  const emaSlow = calculateEMA(closes, slow);

  // MACD line = fast EMA - slow EMA (valid from index slow-1 onward)
  for (let i = 0; i < len; i++) {
    if (!isNaN(emaFast[i]) && !isNaN(emaSlow[i])) {
      macd[i] = emaFast[i] - emaSlow[i];
    }
  }

  // Signal line = EMA of MACD values
  // We need to compute EMA only on the non-NaN portion of the MACD array
  const macdValid: number[] = [];
  const macdValidStart: number[] = []; // maps macdValid index -> original index
  for (let i = 0; i < len; i++) {
    if (!isNaN(macd[i])) {
      macdValid.push(macd[i]);
      macdValidStart.push(i);
    }
  }

  if (macdValid.length >= sig) {
    const signalEma = calculateEMA(macdValid, sig);
    for (let j = 0; j < macdValid.length; j++) {
      if (!isNaN(signalEma[j])) {
        const origIdx = macdValidStart[j];
        signal[origIdx] = signalEma[j];
        histogram[origIdx] = macd[origIdx] - signalEma[j];
      }
    }
  }

  return { macd, signal, histogram };
}

// ---------------------------------------------------------------------------
// Bollinger Bands
// ---------------------------------------------------------------------------

export interface BollingerBandsResult {
  upper: number[];
  middle: number[];
  lower: number[];
}

/**
 * Bollinger Bands.
 *
 * @param closes - Array of closing prices.
 * @param period - SMA period (default 20).
 * @param stdDev - Number of standard deviations (default 2).
 */
export function calculateBollingerBands(
  closes: number[],
  period = 20,
  stdDev = 2,
): BollingerBandsResult {
  const len = closes.length;
  const upper: number[] = new Array(len).fill(NaN);
  const middle: number[] = new Array(len).fill(NaN);
  const lower: number[] = new Array(len).fill(NaN);

  if (len < period) return { upper, middle, lower };

  const sma = calculateSMA(closes, period);

  for (let i = period - 1; i < len; i++) {
    const slice = closes.slice(i - period + 1, i + 1);
    const mean = sma[i];
    let sumSq = 0;
    for (let j = 0; j < slice.length; j++) {
      const diff = slice[j] - mean;
      sumSq += diff * diff;
    }
    const sd = Math.sqrt(sumSq / period);

    middle[i] = mean;
    upper[i] = mean + stdDev * sd;
    lower[i] = mean - stdDev * sd;
  }

  return { upper, middle, lower };
}

// ---------------------------------------------------------------------------
// ADX (Average Directional Index) — Wilder's smoothing
// ---------------------------------------------------------------------------

export interface ADXResult {
  adx: number[];
  plusDI: number[];
  minusDI: number[];
}

export function calculateADX(
  highs: number[],
  lows: number[],
  closes: number[],
  period = 14,
): ADXResult {
  const len = closes.length;
  const adx: number[] = new Array(len).fill(NaN);
  const plusDI: number[] = new Array(len).fill(NaN);
  const minusDI: number[] = new Array(len).fill(NaN);

  if (len < period * 2 + 1) return { adx, plusDI, minusDI };

  const tr: number[] = new Array(len).fill(0);
  const plusDM: number[] = new Array(len).fill(0);
  const minusDM: number[] = new Array(len).fill(0);

  for (let i = 1; i < len; i++) {
    const up = highs[i] - highs[i - 1];
    const dn = lows[i - 1] - lows[i];
    plusDM[i] = up > dn && up > 0 ? up : 0;
    minusDM[i] = dn > up && dn > 0 ? dn : 0;
    tr[i] = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1]),
    );
  }

  // Wilder's smoothing: first = sum of first `period`, then prev - prev/period + curr
  let smoothTR = 0;
  let smoothPlus = 0;
  let smoothMinus = 0;
  for (let i = 1; i <= period; i++) {
    smoothTR += tr[i];
    smoothPlus += plusDM[i];
    smoothMinus += minusDM[i];
  }

  const dx: number[] = [];
  const firstIdx = period;
  plusDI[firstIdx] = smoothTR === 0 ? 0 : (100 * smoothPlus) / smoothTR;
  minusDI[firstIdx] = smoothTR === 0 ? 0 : (100 * smoothMinus) / smoothTR;
  const diSum0 = plusDI[firstIdx] + minusDI[firstIdx];
  dx.push(diSum0 === 0 ? 0 : (100 * Math.abs(plusDI[firstIdx] - minusDI[firstIdx])) / diSum0);

  for (let i = period + 1; i < len; i++) {
    smoothTR = smoothTR - smoothTR / period + tr[i];
    smoothPlus = smoothPlus - smoothPlus / period + plusDM[i];
    smoothMinus = smoothMinus - smoothMinus / period + minusDM[i];

    plusDI[i] = smoothTR === 0 ? 0 : (100 * smoothPlus) / smoothTR;
    minusDI[i] = smoothTR === 0 ? 0 : (100 * smoothMinus) / smoothTR;
    const diSum = plusDI[i] + minusDI[i];
    dx.push(diSum === 0 ? 0 : (100 * Math.abs(plusDI[i] - minusDI[i])) / diSum);
  }

  // ADX = Wilder's smoothed DX
  if (dx.length < period) return { adx, plusDI, minusDI };
  let adxVal = 0;
  for (let i = 0; i < period; i++) adxVal += dx[i];
  adxVal /= period;
  adx[firstIdx + period - 1] = adxVal;
  for (let i = period; i < dx.length; i++) {
    adxVal = (adxVal * (period - 1) + dx[i]) / period;
    adx[firstIdx + i] = adxVal;
  }

  return { adx, plusDI, minusDI };
}

// ---------------------------------------------------------------------------
// Stochastic Oscillator — %K and %D
// ---------------------------------------------------------------------------

export interface StochasticResult {
  k: number[];
  d: number[];
}

export function calculateStochastic(
  highs: number[],
  lows: number[],
  closes: number[],
  kPeriod = 14,
  kSmooth = 3,
  dPeriod = 3,
): StochasticResult {
  const len = closes.length;
  const rawK: number[] = new Array(len).fill(NaN);
  const k: number[] = new Array(len).fill(NaN);
  const d: number[] = new Array(len).fill(NaN);

  for (let i = kPeriod - 1; i < len; i++) {
    let hi = -Infinity;
    let lo = Infinity;
    for (let j = i - kPeriod + 1; j <= i; j++) {
      if (highs[j] > hi) hi = highs[j];
      if (lows[j] < lo) lo = lows[j];
    }
    const range = hi - lo;
    rawK[i] = range === 0 ? 50 : ((closes[i] - lo) / range) * 100;
  }

  // %K = SMA of rawK over kSmooth
  for (let i = kPeriod - 1 + kSmooth - 1; i < len; i++) {
    let sum = 0;
    for (let j = i - kSmooth + 1; j <= i; j++) sum += rawK[j];
    k[i] = sum / kSmooth;
  }

  // %D = SMA of %K over dPeriod
  for (let i = kPeriod - 1 + kSmooth - 1 + dPeriod - 1; i < len; i++) {
    let sum = 0;
    for (let j = i - dPeriod + 1; j <= i; j++) sum += k[j];
    d[i] = sum / dPeriod;
  }

  return { k, d };
}

// ---------------------------------------------------------------------------
// Williams %R
// ---------------------------------------------------------------------------

export function calculateWilliamsR(
  highs: number[],
  lows: number[],
  closes: number[],
  period = 14,
): number[] {
  const len = closes.length;
  const out: number[] = new Array(len).fill(NaN);
  for (let i = period - 1; i < len; i++) {
    let hi = -Infinity;
    let lo = Infinity;
    for (let j = i - period + 1; j <= i; j++) {
      if (highs[j] > hi) hi = highs[j];
      if (lows[j] < lo) lo = lows[j];
    }
    const range = hi - lo;
    out[i] = range === 0 ? -50 : ((hi - closes[i]) / range) * -100;
  }
  return out;
}

// ---------------------------------------------------------------------------
// CCI (Commodity Channel Index)
// ---------------------------------------------------------------------------

export function calculateCCI(
  highs: number[],
  lows: number[],
  closes: number[],
  period = 20,
): number[] {
  const len = closes.length;
  const out: number[] = new Array(len).fill(NaN);
  const tp: number[] = new Array(len);
  for (let i = 0; i < len; i++) tp[i] = (highs[i] + lows[i] + closes[i]) / 3;

  for (let i = period - 1; i < len; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) sum += tp[j];
    const sma = sum / period;

    let meanDev = 0;
    for (let j = i - period + 1; j <= i; j++) meanDev += Math.abs(tp[j] - sma);
    meanDev /= period;

    out[i] = meanDev === 0 ? 0 : (tp[i] - sma) / (0.015 * meanDev);
  }
  return out;
}

// ---------------------------------------------------------------------------
// MFI (Money Flow Index) — volume-weighted RSI
// ---------------------------------------------------------------------------

export function calculateMFI(
  highs: number[],
  lows: number[],
  closes: number[],
  volumes: number[],
  period = 14,
): number[] {
  const len = closes.length;
  const out: number[] = new Array(len).fill(NaN);
  if (len < period + 1) return out;

  const tp: number[] = new Array(len);
  const mf: number[] = new Array(len);
  for (let i = 0; i < len; i++) {
    tp[i] = (highs[i] + lows[i] + closes[i]) / 3;
    mf[i] = tp[i] * volumes[i];
  }

  for (let i = period; i < len; i++) {
    let posMF = 0;
    let negMF = 0;
    for (let j = i - period + 1; j <= i; j++) {
      if (tp[j] > tp[j - 1]) posMF += mf[j];
      else if (tp[j] < tp[j - 1]) negMF += mf[j];
    }
    if (negMF === 0) out[i] = 100;
    else {
      const ratio = posMF / negMF;
      out[i] = 100 - 100 / (1 + ratio);
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Parabolic SAR (J. Welles Wilder)
// ---------------------------------------------------------------------------

export interface PSARResult {
  psar: number[];
  /** True = uptrend (dots below price), False = downtrend (dots above). */
  trendUp: boolean[];
}

export function calculatePSAR(
  highs: number[],
  lows: number[],
  accelStart = 0.02,
  accelIncrement = 0.02,
  accelMax = 0.2,
): PSARResult {
  const len = highs.length;
  const psar: number[] = new Array(len).fill(NaN);
  const trendUp: boolean[] = new Array(len).fill(false);
  if (len < 2) return { psar, trendUp };

  let up = highs[1] > highs[0];
  let ep = up ? highs[0] : lows[0];
  let sar = up ? lows[0] : highs[0];
  let af = accelStart;

  psar[0] = sar;
  trendUp[0] = up;

  for (let i = 1; i < len; i++) {
    sar = sar + af * (ep - sar);

    if (up) {
      sar = Math.min(sar, lows[i - 1], i >= 2 ? lows[i - 2] : lows[i - 1]);
      if (lows[i] < sar) {
        up = false;
        sar = ep;
        ep = lows[i];
        af = accelStart;
      } else if (highs[i] > ep) {
        ep = highs[i];
        af = Math.min(af + accelIncrement, accelMax);
      }
    } else {
      sar = Math.max(sar, highs[i - 1], i >= 2 ? highs[i - 2] : highs[i - 1]);
      if (highs[i] > sar) {
        up = true;
        sar = ep;
        ep = highs[i];
        af = accelStart;
      } else if (lows[i] < ep) {
        ep = lows[i];
        af = Math.min(af + accelIncrement, accelMax);
      }
    }

    psar[i] = sar;
    trendUp[i] = up;
  }

  return { psar, trendUp };
}

// ---------------------------------------------------------------------------
// OBV (On-Balance Volume) — used internally for divergence detection
// ---------------------------------------------------------------------------

export function calculateOBV(closes: number[], volumes: number[]): number[] {
  const len = closes.length;
  const out: number[] = new Array(len).fill(0);
  for (let i = 1; i < len; i++) {
    if (closes[i] > closes[i - 1]) out[i] = out[i - 1] + volumes[i];
    else if (closes[i] < closes[i - 1]) out[i] = out[i - 1] - volumes[i];
    else out[i] = out[i - 1];
  }
  return out;
}

// ---------------------------------------------------------------------------
// Regime classifier — trending vs ranging via ADX
// ---------------------------------------------------------------------------

export type Regime = 'trending' | 'ranging';

export function detectRegime(adx: number, trendingThreshold = 25): Regime {
  return adx >= trendingThreshold ? 'trending' : 'ranging';
}

// ---------------------------------------------------------------------------
// Volume confirmation matrix multiplier (tradermonty framework)
// ---------------------------------------------------------------------------

/**
 * Returns a multiplier 0.8–1.2 applied to the final tech score based on
 * whether volume is confirming the price move.
 *
 *   price↑ vol↑  → 1.2 (healthy uptrend)
 *   price↑ vol↓  → 0.8 (weak uptrend, dampen bullishness)
 *   price↓ vol↑  → 1.2 (healthy downtrend, dampen weak sell signal strength)
 *   price↓ vol↓  → 0.8 (selling exhaustion — less reliable)
 *
 * Uses 3-period SMA of volume vs 10-period SMA to decide "volume rising".
 */
export function volumeConfirmationMultiplier(
  closes: number[],
  volumes: number[],
  lookback = 3,
): number {
  const len = closes.length;
  if (len < 11) return 1;

  const priceUp = closes[len - 1] > closes[len - 1 - lookback];
  const recentVol = volumes.slice(-lookback).reduce((a, b) => a + b, 0) / lookback;
  const baselineVol = volumes.slice(-10).reduce((a, b) => a + b, 0) / 10;
  const volUp = recentVol > baselineVol;

  if (priceUp && volUp) return 1.2;
  if (priceUp && !volUp) return 0.8;
  if (!priceUp && volUp) return 1.2;
  return 0.8;
}
