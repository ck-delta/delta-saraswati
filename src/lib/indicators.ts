// Technical indicator calculations from OHLC candle data

export function calculateRSI(closes: number[], period = 14): number | null {
  if (closes.length < period + 1) return null;

  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) avgGain += change;
    else avgLoss += Math.abs(change);
  }

  avgGain /= period;
  avgLoss /= period;

  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) {
      avgGain = (avgGain * (period - 1) + change) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(change)) / period;
    }
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export function calculateEMA(data: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const ema: number[] = [data[0]];
  for (let i = 1; i < data.length; i++) {
    ema.push(data[i] * k + ema[i - 1] * (1 - k));
  }
  return ema;
}

export function calculateMACD(closes: number[], fast = 12, slow = 26, signal = 9) {
  if (closes.length < slow + signal) return null;

  const emaFast = calculateEMA(closes, fast);
  const emaSlow = calculateEMA(closes, slow);
  const macdLine = emaFast.map((v, i) => v - emaSlow[i]);
  const signalLine = calculateEMA(macdLine.slice(slow - 1), signal);

  const lastMacd = macdLine[macdLine.length - 1];
  const lastSignal = signalLine[signalLine.length - 1];
  const histogram = lastMacd - lastSignal;

  // Previous histogram for signal classification
  const prevMacd = macdLine[macdLine.length - 2];
  const prevSignal = signalLine[signalLine.length - 2];
  const prevHistogram = prevMacd - prevSignal;

  return {
    value: lastMacd,
    signal: lastSignal,
    histogram,
    prevHistogram,
  };
}

// Classify MACD into actionable signal
export function classifyMACD(macd: { value: number; signal: number; histogram: number; prevHistogram: number }): string {
  const { value, signal, histogram, prevHistogram } = macd;
  if (value > signal && histogram > 0 && histogram > prevHistogram) return "Strong Buy";
  if (value > signal) return "Buy";
  if (value < signal && histogram < 0 && histogram < prevHistogram) return "Strong Sell";
  return "Sell";
}

export function calculateSMA(data: number[], period: number): number | null {
  if (data.length < period) return null;
  const slice = data.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

// ADX (Average Directional Index) using Wilder's smoothing
export function calculateADX(
  highs: number[],
  lows: number[],
  closes: number[],
  period = 14
): { adx: number; plusDI: number; minusDI: number } | null {
  const len = highs.length;
  if (len < period * 2 + 1) return null;

  // Step 1: Calculate +DM, -DM, and True Range
  const plusDM: number[] = [];
  const minusDM: number[] = [];
  const tr: number[] = [];

  for (let i = 1; i < len; i++) {
    const upMove = highs[i] - highs[i - 1];
    const downMove = lows[i - 1] - lows[i];

    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);

    tr.push(Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    ));
  }

  // Step 2: Wilder's smoothing (first value = sum of period, then smooth)
  function wilderSmooth(data: number[], p: number): number[] {
    const result: number[] = [];
    let sum = 0;
    for (let i = 0; i < p; i++) sum += data[i];
    result.push(sum);
    for (let i = p; i < data.length; i++) {
      result.push(result[result.length - 1] - result[result.length - 1] / p + data[i]);
    }
    return result;
  }

  const smoothPlusDM = wilderSmooth(plusDM, period);
  const smoothMinusDM = wilderSmooth(minusDM, period);
  const smoothTR = wilderSmooth(tr, period);

  // Step 3: +DI, -DI, DX
  const dx: number[] = [];
  let lastPlusDI = 0;
  let lastMinusDI = 0;

  for (let i = 0; i < smoothTR.length; i++) {
    if (smoothTR[i] === 0) {
      dx.push(0);
      continue;
    }
    const pdi = 100 * smoothPlusDM[i] / smoothTR[i];
    const mdi = 100 * smoothMinusDM[i] / smoothTR[i];
    lastPlusDI = pdi;
    lastMinusDI = mdi;
    const sum = pdi + mdi;
    dx.push(sum === 0 ? 0 : 100 * Math.abs(pdi - mdi) / sum);
  }

  if (dx.length < period) return null;

  // Step 4: Smooth DX → ADX
  const adxSmoothed = wilderSmooth(dx, period);
  const adxValue = adxSmoothed[adxSmoothed.length - 1] / period;

  return {
    adx: adxValue,
    plusDI: lastPlusDI,
    minusDI: lastMinusDI,
  };
}

// Classic Pivot Points from previous day's OHLC
export function calculatePivotPoints(
  prevHigh: number,
  prevLow: number,
  prevClose: number
): { pivot: number; r1: number; r2: number; s1: number; s2: number } {
  const pivot = (prevHigh + prevLow + prevClose) / 3;
  return {
    pivot,
    r1: 2 * pivot - prevLow,
    r2: pivot + (prevHigh - prevLow),
    s1: 2 * pivot - prevHigh,
    s2: pivot - (prevHigh - prevLow),
  };
}

// Generate a one-line trend summary from price vs SMAs
export function generateTrendSummary(
  price: number,
  sma20: number | null,
  sma50: number | null,
  sma200: number | null
): string {
  if (!sma20 || !sma50 || !sma200) return "Insufficient data for trend analysis.";

  const aboveAll = price > sma20 && price > sma50 && price > sma200;
  const belowAll = price < sma20 && price < sma50 && price < sma200;
  const goldenCross = sma50 > sma200;
  const nearSma20 = Math.abs((price - sma20) / sma20) < 0.02;

  if (aboveAll && goldenCross) {
    return "Strong uptrend — price above all SMAs with golden cross. Bullish momentum intact.";
  }
  if (aboveAll) {
    return "Uptrend — trading above all moving averages. Momentum favors bulls.";
  }
  if (belowAll && !goldenCross) {
    return "Strong downtrend — price below all SMAs with death cross. Bears in control.";
  }
  if (belowAll) {
    return "Downtrend — trading below all moving averages. Watch for reversal signals.";
  }
  if (nearSma20 && price > sma200) {
    return `Testing SMA 20 ($${sma20.toLocaleString("en-US", { maximumFractionDigits: 0 })}) — key short-term support in a broader uptrend.`;
  }
  if (nearSma20 && price < sma200) {
    return `Testing SMA 20 ($${sma20.toLocaleString("en-US", { maximumFractionDigits: 0 })}) as resistance — long-term trend still bearish.`;
  }
  if (price > sma20 && price > sma50 && price < sma200) {
    return "Short-term bullish but below SMA 200 — recovery in progress, needs confirmation.";
  }
  if (price > sma20 && price < sma50) {
    return `Bounce above SMA 20 — watch SMA 50 ($${sma50.toLocaleString("en-US", { maximumFractionDigits: 0 })}) as next resistance.`;
  }
  if (price < sma20 && price > sma50) {
    return "Pulling back below SMA 20 — SMA 50 acting as support. Short-term weakness.";
  }
  if (goldenCross) {
    return "Golden cross (SMA 50 > 200) — long-term bullish structure despite short-term chop.";
  }
  return "Mixed signals — price consolidating between moving averages.";
}

// Generate an overall Buy/Sell signal from all indicators
export function generateOverallSignal(
  rsi: number | null,
  macdSignal: string | null,
  adx: { adx: number; plusDI: number; minusDI: number } | null,
  price: number,
  sma20: number | null,
  sma50: number | null,
  sma200: number | null
): { signal: string; confidence: number; reasoning: string[]; watchNext: string } {
  let score = 0;
  const reasoning: string[] = [];

  // RSI scoring
  if (rsi != null) {
    if (rsi < 30) { score += 2; reasoning.push(`RSI at ${rsi.toFixed(1)} — oversold, bounce likely`); }
    else if (rsi < 45) { score += 1; reasoning.push(`RSI at ${rsi.toFixed(1)} — leaning bearish but not extreme`); }
    else if (rsi <= 55) { reasoning.push(`RSI at ${rsi.toFixed(1)} — neutral zone, no strong signal`); }
    else if (rsi <= 70) { score -= 1; reasoning.push(`RSI at ${rsi.toFixed(1)} — slightly elevated, momentum building`); }
    else { score -= 2; reasoning.push(`RSI at ${rsi.toFixed(1)} — overbought, pullback risk`); }
  }

  // MACD scoring
  if (macdSignal) {
    if (macdSignal === "Strong Buy") { score += 2; reasoning.push("MACD crossover bullish with rising momentum"); }
    else if (macdSignal === "Buy") { score += 1; reasoning.push("MACD bullish — line above signal"); }
    else if (macdSignal === "Sell") { score -= 1; reasoning.push("MACD bearish — line below signal"); }
    else if (macdSignal === "Strong Sell") { score -= 2; reasoning.push("MACD crossover bearish with falling momentum"); }
  }

  // ADX scoring
  if (adx) {
    const trending = adx.adx >= 20;
    const bullish = adx.plusDI > adx.minusDI;
    if (trending && bullish) { score += 1; reasoning.push(`ADX ${adx.adx.toFixed(1)} — trending bullish`); }
    else if (trending && !bullish) { score -= 1; reasoning.push(`ADX ${adx.adx.toFixed(1)} — trending bearish`); }
    else { reasoning.push(`ADX ${adx.adx.toFixed(1)} — weak trend, choppy market`); }
  }

  // SMA scoring
  if (sma20 && sma50 && sma200) {
    const aboveCount = [sma20, sma50, sma200].filter(s => price > s).length;
    if (aboveCount === 3) { score += 2; reasoning.push("Price above all SMAs — bullish structure"); }
    else if (aboveCount === 2) { score += 1; reasoning.push("Price above 2 of 3 SMAs — mostly bullish"); }
    else if (aboveCount === 1) { score -= 1; reasoning.push("Price below most SMAs — bearish pressure"); }
    else { score -= 2; reasoning.push("Price below all SMAs — bearish structure"); }
  }

  // Map score to signal
  let signal: string;
  if (score >= 4) signal = "Strong Buy";
  else if (score >= 2) signal = "Buy";
  else if (score >= -1) signal = "Neutral";
  else if (score >= -3) signal = "Sell";
  else signal = "Strong Sell";

  // Confidence: 50-95% based on how decisive the score is
  const maxScore = 7;
  const confidence = Math.min(95, Math.max(50, Math.round((Math.abs(score) / maxScore) * 100)));

  // Watch next
  let watchNext = "Monitor for changes in momentum and trend direction.";
  if (sma200 && price > sma200 && sma20) {
    const nearSma20 = Math.abs((price - sma20) / sma20) < 0.03;
    if (nearSma20) watchNext = `Watch SMA 20 ($${sma20.toLocaleString("en-US", { maximumFractionDigits: 0 })}) — key support/resistance level.`;
  }
  if (rsi != null && rsi > 65) watchNext = "RSI elevated — watch for pullback to confirm continuation.";
  if (rsi != null && rsi < 35) watchNext = "RSI low — watch for reversal candle to confirm bounce.";

  return { signal, confidence, reasoning, watchNext };
}

// Classify derivatives positioning from price direction, OI change, and funding rate
export function classifyDerivatives(
  priceUp: boolean,
  oiUp: boolean,
  fundingPositive: boolean
): { signal: string; description: string; color: "bullish" | "bearish" } {
  if (priceUp && oiUp) {
    return {
      signal: "Long Buildup",
      description: "OI rising with price — fresh long positioning entering the market.",
      color: "bullish",
    };
  }
  if (!priceUp && oiUp) {
    return {
      signal: "Short Buildup",
      description: "OI rising as price falls — new short positions being opened.",
      color: "bearish",
    };
  }
  if (priceUp && !oiUp) {
    return {
      signal: "Short Covering",
      description: "Price rising as OI drops — shorts exiting, fueling the rally.",
      color: "bullish",
    };
  }
  return {
    signal: "Long Unwinding",
    description: "Price falling as OI drops — longs exiting their positions.",
    color: "bearish",
  };
}

// Classify pivot-based buy/sell signal
export function classifyPivotSignal(
  price: number,
  pivot: number,
  r1: number,
  s1: number
): { signal: "Buy" | "Sell"; reason: string } {
  if (price > r1) return { signal: "Buy", reason: "Above R1 — bullish breakout territory" };
  if (price > pivot) return { signal: "Buy", reason: "Above Pivot — bullish bias" };
  if (price < s1) return { signal: "Sell", reason: "Below S1 — bearish breakdown" };
  return { signal: "Sell", reason: "Below Pivot — bearish bias" };
}
