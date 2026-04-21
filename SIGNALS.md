# AI Signal — Methodology

Saraswati's **AI Signal** is a single verdict (Strong Sell / Sell / Neutral / Buy / Strong Buy) distilled from three orthogonal lenses: **News, Technical, Derivatives**. It aims to be explainable — every contribution is surfaced on the /research page — and statistically calibrated against live Delta Exchange data, not hard-coded guesses.

This document describes exactly how the score is computed.

---

## 1. Architecture

```
┌───────────────┐  ┌───────────────────┐  ┌───────────────────┐
│ News score    │  │ Technical score   │  │ Derivatives score │
│ 0-10          │  │ 0-10              │  │ 0-10              │
│               │  │                   │  │                   │
│ 3D impact     │  │ 10 indicators +   │  │ Positioning +     │
│ model w/      │  │ 6 patterns,       │  │ funding %ile +    │
│ 12h half-life │  │ regime-adaptive   │  │ basis             │
└───────┬───────┘  └─────────┬─────────┘  └──────────┬────────┘
        │                    │                        │
        └────────────────────┼────────────────────────┘
                             ▼
              ┌──────────────────────────────┐
              │ Composite = mean of the 3    │
              │ Confidence = agreement-based │
              │ Divergence flag if |max-min| │
              │                  ≥ 4         │
              └──────────────────────────────┘
```

Served by `GET /api/ai-signal/[symbol]` with 60-second server-side caching per symbol.

---

## 2. News sub-score

Adapted from tradermonty's [Market News Analyst framework](https://github.com/tradermonty/claude-trading-skills/blob/main/skills/market-news-analyst/SKILL.md).

### 2.1 Per-headline impact

```
Impact = (Price Impact) × (Breadth Multiplier) × (Forward Modifier)
```

**Price Impact tiers** (crypto-adapted):

| Tier | Token-level | Sector (L1 / DeFi / memes) | Macro (total mkt cap) | Points |
|---|---|---|---|---|
| Severe | ±10 %+ | ±5 %+ | ±3 %+ | 10 |
| Major | ±5 – 10 % | ±3 – 5 % | ±1.5 – 3 % | 7 |
| Moderate | ±2 – 5 % | ±1 – 3 % | ±0.5 – 1.5 % | 4 |
| Minor | ±1 – 2 % | <±1 % | <±0.5 % | 2 |
| Negligible | <±1 % | — | — | 1 |

**Breadth Multipliers:**

| Breadth | Multiplier | Examples |
|---|---|---|
| Systemic | 3× | FOMC surprise, global risk-off, stablecoin collapse |
| Cross-asset | 2× | Crypto + bonds/FX impact (ETF approval) |
| Sector-wide | 1.5× | One sub-sector (all L1s rally on SOL news) |
| Token-specific | 1× | Single token event |

**Forward Modifiers:**

| Forward | Multiplier | Examples |
|---|---|---|
| Regime change | 1.5× | Fed pivot, ETF approval, major regulation |
| Trend confirmation | 1.25× | "Inflows continue for 5th week" |
| Isolated | 1.0× | Single-day flash crash |
| Contrary | 0.75× | "Despite hack, price holds" |

### 2.2 Recency decay

Every headline's impact decays with a **12-hour half-life**:

```
effective_impact = raw_impact × 0.5 ^ (age_hours / 12)
```

A headline 48h old contributes only 6.25 % of its raw impact — so the score reflects what matters *now*.

### 2.3 Per-token aggregation

1. Filter headlines whose title matches token keywords (`BTCUSDT → {bitcoin, btc, satoshi, …}`) or whose `affectedTokens` array (from Groq classification) includes the symbol.
2. Sign each matched headline by direction: `bull → +impact`, `bear → −impact`, `neutral → 0`.
3. Sum signed decayed impacts → `aggregated`.
4. Sigmoid scale:

```
normalised = tanh(aggregated / 45)     // 45 = single max-severity headline at t=0
score = clamp(5 + normalised × 5, 0, 10)
```

When **no headlines match**, default is **5.0 / Neutral** (honest disclosure: we don't know).

### 2.4 Classifier

Each headline's `priceImpactTier` / `breadthTier` / `forwardTier` / `direction` / `affectedTokens` is filled in either by:
- **Groq** (preferred, future) — one batch classification call over the latest 20 headlines
- **Heuristic fallback** (current) — keyword rules on headline title + existing `sentimentScore` from the news API

Every call to `calculateNewsScore` works regardless of which path produced the annotations.

---

## 3. Technical sub-score

**Regime-adaptive** composite of 10 indicators + 6 chart pattern detectors.

### 3.1 Regime detection

```
regime = ADX(14) ≥ 25  ?  'trending'  :  'ranging'
```

The 10 indicators and 6 patterns produce directional votes; the regime controls *how much each vote counts*.

### 3.2 Indicators

Each returns a vote ∈ {−2, −1, 0, +1, +2} with a one-line reason.

| Indicator | Bullish trigger | Bearish trigger | Weight (trending) | Weight (ranging) |
|---|---|---|---|---|
| RSI(14) | <30 oversold (+2), <45 (+1) | >70 overbought (−2), >55 (−1) | 0.8 | 1.2 |
| MACD(12,26,9) | above signal + rising histogram (+2) | below + falling (−2) | 1.2 | 0.8 |
| ADX(14) + DMI | +DI > −DI, ADX ≥ 25 (+1) | −DI > +DI, ADX ≥ 25 (−1) | 1.0 | 0.5 |
| SMA stack (20/50/200) | price above all 3 (+2) | below all 3 (−2) | 1.2 | 0.8 |
| Bollinger Bands(20,2) | at/below lower band (+2) | at/above upper (−2) | 0.8 | 1.2 |
| Stochastic(14,3,3) | %K < 20 turning up (+2) | %K > 80 turning down (−2) | 0.8 | 1.2 |
| Williams %R(14) | ≤ −80 (+2) | ≥ −20 (−2) | 0.8 | 1.2 |
| CCI(20) | ≤ −200 (+2) | ≥ +200 (−2) | 0.8 | 1.2 |
| MFI(14) | < 20 (+2) | > 80 (−2) | 0.8 | 1.2 |
| Parabolic SAR | dots flip below price (+2) | dots flip above (−2) | 1.2 | 0.8 |

**Trending** weights favour trend-following indicators (MACD / SMA / PSAR / ADX). **Ranging** weights favour mean-reversion oscillators (RSI / Stoch / Williams / CCI / MFI / Bollinger).

### 3.3 Chart patterns

Each detected pattern contributes `direction × 2 × confidence`:

| Pattern | Direction | Confidence | Trigger |
|---|---|---|---|
| Hammer | Bull | 0.70 | Small body at top, long lower wick ≥ 2× body |
| Shooting Star | Bear | 0.70 | Small body at bottom, long upper wick ≥ 2× body |
| Bullish Engulfing | Bull | 0.80 | Green fully engulfs prior red |
| Bearish Engulfing | Bear | 0.80 | Red fully engulfs prior green |
| Morning Star | Bull | 0.85 | Red / doji / green, close above midpoint |
| Evening Star | Bear | 0.85 | Green / doji / red, close below midpoint |
| Double Top | Bear | 0.75 | Two peaks within 1.5 %, break below trough |
| Double Bottom | Bull | 0.75 | Two troughs within 1.5 %, break above peak |
| Bull Flag | Bull | 0.70 | 8 %+ run-up then shallow 40 % retrace consolidation |
| Bear Flag | Bear | 0.70 | 8 %+ drop then shallow retrace consolidation |

Patterns are capped at ±4 of influence (two max-confidence patterns at once).

### 3.4 Volume confirmation

A volume-vs-price multiplier applied to the final weighted sum (from tradermonty's [Technical Analyst framework](https://github.com/tradermonty/claude-trading-skills/blob/main/skills/technical-analyst/references/technical_analysis_framework.md)):

| Price last 3 bars | Volume (3-bar avg vs 10-bar avg) | Multiplier |
|---|---|---|
| Up | Up | 1.2 (healthy uptrend) |
| Up | Down | 0.8 (weak uptrend) |
| Down | Up | 1.2 (healthy downtrend — conviction in selling) |
| Down | Down | 0.8 (selling exhaustion — less reliable) |

### 3.5 Aggregation

```
indicator_sum  = Σ (vote × weight)
pattern_sum    = Σ (direction × 2 × confidence)
raw            = indicator_sum + pattern_sum
max_possible   = Σ (2 × weight) + 4
normalised     = clamp(raw / max_possible, −1, +1)
adjusted       = normalised × volume_multiplier
score          = clamp(5 + adjusted × 5, 0, 10)
```

Every indicator's vote, weight, and one-line reason are returned in `breakdown.technical.contributions` and rendered on the /research page.

---

## 4. Derivatives sub-score

Combines three orthogonal signals. All are contrarian — crowded positioning is bearish, not confirming.

### 4.1 Positioning

From `(price_delta, OI_delta)` over a 6-hour window (source: Delta Exchange `OI:<symbol>` candles):

| Price | OI | Label | Score |
|---|---|---|---|
| ↑ | ↑ | Long Buildup | +2 |
| ↑ | ↓ | Short Covering | +1 |
| ↓ | ↑ | Short Buildup | −2 |
| ↓ | ↓ | Long Unwinding | −1 |

Dead-zone: both price and OI must move ≥ 0.3 % for a classification, else "Undetermined (score 0)". Prevents noise-driven flips.

### 4.2 Funding rate (percentile-calibrated)

**Calibration data:** 30 days of hourly funding rates for BTCUSDT + ETHUSDT (n = 1,426 samples). See [`src/lib/signals/funding-calibration.json`](src/lib/signals/funding-calibration.json).

Distribution (combined BTC+ETH, as of calibration run):

| Percentile | Rate |
|---|---|
| p5 | −1.13 % |
| p20 | −0.65 % |
| p50 | −0.19 % |
| p80 | +0.21 % |
| p95 | +0.55 % |

Scoring (contrarian):

| Condition | Score | Meaning |
|---|---|---|
| funding ≥ p95 | −2 | Crowded longs, over-extended |
| p80 ≤ funding < p95 | −1 | Elevated longs |
| p20 < funding < p80 | 0 | Normal range |
| p5 < funding ≤ p20 | +1 | Elevated shorts |
| funding ≤ p5 | +2 | Crowded shorts, squeeze fuel |

**Recalibrate quarterly** or when funding regime visibly shifts (e.g., prolonged sideways market → bimodal distribution). Run `node scripts/calibrate-funding.js` → updates `funding-calibration.json`.

### 4.3 Basis (spot vs perp)

| Condition | Score | Meaning |
|---|---|---|
| (mark − spot) / spot ≥ +0.05 % | −1 | Perp premium → retail long-bias |
| (mark − spot) / spot ≤ −0.05 % | +1 | Perp discount → fear / squeeze setup |
| otherwise | 0 | Flat |

### 4.4 Aggregation

```
raw            = positioning + funding + basis      // range ±5
normalised     = clamp(raw / 5, −1, +1)
score          = clamp(5 + normalised × 5, 0, 10)
```

---

## 5. Composite + confidence

```
composite_score = (news + technical + derivatives) / 3
```

**Tier mapping:**

| Score | Label | Color |
|---|---|---|
| ≤ 2.5 | Strong Sell | red |
| ≤ 4.0 | Sell | light red |
| < 6.0 | Neutral | gray |
| < 7.5 | Buy | green |
| ≥ 7.5 | Strong Buy | vibrant green |

**Agreement-based confidence:**

```
sd          = stdev([news, technical, derivatives])
agreement   = max(0, 1 − sd / 2.5)             // sd=0 → agreement=1, sd≥2.5 → agreement=0
confidence  = round(50 + agreement × 45)       // 50-95 %
```

Three constituent scores at 7.5 → sd = 0 → **95 % confidence**.
Scores at (2, 5, 8) → sd ≈ 2.45 → **50 % confidence**.

**Divergence flag:** set when `max(scores) − min(scores) ≥ 4`. Displayed as ⚠ on the signal pill, tooltip explains conflict.

---

## 6. Scenarios

Generated by Groq (`llama-3.3-70b-versatile`) via `GET /api/ai/scenarios/[symbol]`. Takes the AI Signal breakdown as context and produces:

```json
{
  "bull": {"probability": 45, "thesis": "...", "invalidation": "..."},
  "base": {"probability": 35, "thesis": "...", "invalidation": "..."},
  "bear": {"probability": 20, "thesis": "...", "invalidation": "..."}
}
```

Probabilities sum to 100. Normalisation is applied server-side to handle LLM drift. Cached 15 minutes per symbol.

Constraints on Groq:
- Higher Bull probability when composite ≥ 6; higher Bear when ≤ 4.
- When `divergent=true`, probabilities bunch toward 33 / 34 / 33 (lower conviction).
- Every scenario must include a **specific invalidation** (price level or named catalyst), not a vague phrase.

---

## 7. Improvements roadmap

| Priority | Item | Why |
|---|---|---|
| High | Replace heuristic news classifier with Groq batch call | Heuristic misclassifies crypto-specific jargon |
| High | Historical AI Signal sparkline on /research | Shows whether signal is strengthening or fading |
| Medium | Backtest the composite on 90d Delta data | Establish statistical precision / recall |
| Medium | Multi-timeframe voting (1h / 4h / 1d technical blend) | Reduces noise, catches broader trends |
| Medium | Whale-flow signal (exchange netflow, ETF flows) | Adds independent orthogonal signal |
| Low | ML-tuned weights (trained on future returns) | Replace regime-adaptive heuristic with learned weights |
| Low | Signal postmortem ledger | Track predicted vs realised outcome for calibration |

---

## 8. Reading the /research page

1. **AI Signal panel** (top) — composite + confidence + 3-row breakdown.
2. **Why this signal** — strongest contributor from each dimension.
3. **Full breakdown** (expandable) — every indicator vote, every pattern, every news headline with its 3D classification.
4. **Scenarios panel** — Bull / Base / Bear with invalidation levels.
5. **Research metrics** — raw numbers for cross-checking the signal.

If you disagree with the signal, the breakdown tells you *which* dimension is disagreeing with your view so you know what data to go check.

---

## 9. Credit

News scoring framework adapted from [tradermonty/claude-trading-skills](https://github.com/tradermonty/claude-trading-skills) — specifically `skills/market-news-analyst` and `skills/technical-analyst`. Aggregator design (weighted linear + agreement-based confidence) inspired by `skills/edge-signal-aggregator`.
