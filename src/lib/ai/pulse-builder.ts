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
import type { PCRResult, OptionsLSResult } from '@/lib/api/delta';
import type { AISignalResult } from '@/lib/signals/composite';
import type { AnnotatedNewsItem } from '@/lib/signals/news-score';
import { scoreFunding } from '@/lib/signals/deriv-score';
import { scoreHeadline } from '@/lib/signals/news-score';
import { nextEvents, countdownLabel } from '@/lib/macro/calendar';
import { RSS_FEEDS } from '@/lib/constants';

// Any asset with under this much 24h turnover is excluded from every section.
// Keeps the card focused on tokens with real liquidity. Tokenised-stock perps
// with effectively zero weekend/night volume get filtered out here.
const MIN_TURNOVER_USD = 1_000_000;

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
  /** Map of symbol -> {oiNow, oi24hAgo} for OI-change leaders. May be empty. */
  oiSnapshots?: Record<string, { oiNow: number; oiPrior: number }>;
  /** Map of underlying symbol (e.g. "BTC") -> options-derived PCR + L/S.
   *  Only populated for underlyings with liquid Delta options (typically BTC, ETH). */
  optionsMetrics?: Record<string, { pcr: PCRResult | null; ls: OptionsLSResult | null }>;
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

function fmtCompact(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function signedDirection(score: number): SentimentBadge {
  if (score >= 6) return 'BULLISH';
  if (score <= 4) return 'BEARISH';
  return 'NEUTRAL';
}

function underlyingOf(t: TokenCardData): string {
  return t.underlying || t.symbol.replace(/USDT?$/, '');
}

function domainFor(sourceName: string): string | undefined {
  return RSS_FEEDS.find((f) => f.name === sourceName)?.domain;
}

// ---------------------------------------------------------------------------
// Callouts (pure TypeScript, no Groq needed)
// ---------------------------------------------------------------------------

export function buildCallouts(input: PulseInputs): PulseCallouts {
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

  const btcDominance = input.global
    ? {
        value: input.global.btcDominance,
        marketCapPctChange24h: input.global.marketCapPctChange24h,
      }
    : null;

  const now = new Date();
  const events = nextEvents(now).slice(0, 2);
  const nextMacroEvents = events.map((e) => ({
    kind: e.kind,
    label: e.label,
    countdown: countdownLabel(e.datetime, now),
    datetime: e.datetime,
  }));

  const alerts: PulseCallouts['alerts'] = [];
  for (const p of input.perpetuals) {
    const f = scoreFunding(p.fundingRate);
    if (f.score === -2) {
      alerts.push({ kind: 'funding-extreme', text: `${p.symbol} funding at p${f.percentile.toFixed(0)} — crowded longs, squeeze risk` });
      break;
    } else if (f.score === 2) {
      alerts.push({ kind: 'funding-extreme', text: `${p.symbol} funding at p${f.percentile.toFixed(0)} — crowded shorts, squeeze fuel` });
      break;
    }
  }
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

export type Bucket =
  | 'marketPulse'
  | 'bigMovers'
  | 'macroWatch'
  | 'derivativesInsight'
  | 'fundingExtremes'
  | 'volumeAnomalies'
  | 'oiChanges';

export interface CuratedItem {
  bucket: Bucket;
  label: string;
  price?: string;
  changePct?: number;
  /** Factual context the LLM uses to write the reason. */
  context: string;
  /** Pre-computed sentiment hint (LLM can override). */
  hintSentiment?: SentimentBadge;
  /** Optional tag chip. */
  tag?: string;
  /** Passed through to PulseItem for click navigation. */
  symbol?: string;
  /** External URL (news items). */
  url?: string;
  source?: string;
  publishedAt?: string;
  sourceDomain?: string;
  /** Longer reasoning context for hover expansion. */
  detail?: string;
}

export function curateItems(input: PulseInputs): CuratedItem[] {
  const items: CuratedItem[] = [];
  const TOP_THREE = new Set(['BTCUSDT', 'ETHUSDT', 'SOLUSDT']);

  // Global liquidity filter: any asset with <$1M 24h turnover is excluded.
  // Majors (BTC/ETH/SOL) always stay, even if volume momentarily dips below
  // the floor (e.g. exchange outage). Everything else must clear the bar.
  const liquidPerps = input.perpetuals.filter(
    (t) => TOP_THREE.has(t.symbol) || t.turnoverUsd >= MIN_TURNOVER_USD,
  );
  const liquidNonMajors = liquidPerps.filter((t) => !TOP_THREE.has(t.symbol));

  // ---- Market Pulse: BTC, ETH, SOL with AI Signal tags ----
  for (const sym of ['BTCUSDT', 'ETHUSDT', 'SOLUSDT']) {
    const t = input.perpetuals.find((p) => p.symbol === sym);
    if (!t) continue;
    const sig = input.aiSignals[sym];
    const regimeText = sig?.technical.regime === 'trending' ? 'trending regime' : 'ranging regime';
    const sigText = sig ? `AI Signal: ${sig.label} ${sig.score}/10 (${regimeText}), confidence ${sig.confidence}%.` : '';
    items.push({
      bucket: 'marketPulse',
      label: underlyingOf(t),
      price: formatPrice(t.price),
      changePct: t.priceChangePct24h,
      context: `${sym} 24h change ${fmtPct(t.priceChangePct24h)}, vol $${(t.turnoverUsd / 1e6).toFixed(0)}M. ${sigText} funding ${(t.fundingRate * 100).toFixed(3)}%.`,
      hintSentiment: sig ? signedDirection(sig.score) : t.priceChangePct24h >= 0 ? 'BULLISH' : 'BEARISH',
      tag: sig ? `${sig.label} ${sig.score.toFixed(1)}` : undefined,
      symbol: sym,
      detail: sig?.reasoning.join(' · '),
    });
  }

  // ---- Big Movers: top 2 gainers + top 2 losers across LIQUID perpetuals ----
  const sortedByChange = [...liquidPerps].sort(
    (a, b) => b.priceChangePct24h - a.priceChangePct24h,
  );
  const topGainers = sortedByChange.slice(0, 2).filter((t) => t.priceChangePct24h > 0);
  const topLosers = sortedByChange.slice(-2).reverse().filter((t) => t.priceChangePct24h < 0);
  for (const t of [...topGainers, ...topLosers]) {
    const isTop = TOP_THREE.has(t.symbol);
    items.push({
      bucket: 'bigMovers',
      label: underlyingOf(t),
      price: formatPrice(t.price),
      changePct: t.priceChangePct24h,
      context: `${t.symbol} 24h change ${fmtPct(t.priceChangePct24h)}, vol $${(t.turnoverUsd / 1e6).toFixed(1)}M, funding ${(t.fundingRate * 100).toFixed(3)}%.${isTop ? ' (major token)' : ''}`,
      hintSentiment: t.priceChangePct24h >= 0 ? 'BULLISH' : 'BEARISH',
      symbol: t.symbol,
    });
  }

  // ---- Macro Watch: highest-impact systemic/cross-asset headlines ----
  const annotated: AnnotatedNewsItem[] = input.news.slice(0, 20);
  const scored = annotated.map((n) => ({ item: n, scored: scoreHeadline(n) }));
  const macro = scored
    .filter((s) => ['systemic', 'cross-asset'].includes(s.scored.breadthTier))
    .sort((a, b) => b.scored.decayedImpact - a.scored.decayedImpact)
    .slice(0, 2);
  const chosenMacro = macro.length > 0
    ? macro
    : scored.sort((a, b) => b.scored.decayedImpact - a.scored.decayedImpact).slice(0, 2);
  for (const { item, scored } of chosenMacro) {
    items.push({
      bucket: 'macroWatch',
      label: item.title,
      context: `Source: ${item.source}. Price impact: ${scored.priceImpactTier}. Breadth: ${scored.breadthTier}. Forward: ${scored.forwardTier}.`,
      hintSentiment: scored.direction === 'bull' ? 'BULLISH' : scored.direction === 'bear' ? 'BEARISH' : 'NEUTRAL',
      url: item.url,
      source: item.source,
      publishedAt: item.publishedAt,
      sourceDomain: item.sourceDomain ?? domainFor(item.source),
      detail: `Classified ${scored.priceImpactTier} impact across a ${scored.breadthTier} breadth — ${scored.forwardTier} forward-looking.`,
    });
  }

  // ---- Derivatives Insight: BTC perp + another interesting deriv row ----
  const btcSig = input.aiSignals['BTCUSDT'];
  const btc = input.perpetuals.find((t) => t.symbol === 'BTCUSDT');
  if (btc) {
    items.push({
      bucket: 'derivativesInsight',
      label: 'BTC perp',
      context: `BTC funding ${(btc.fundingRate * 100).toFixed(4)}%, OI $${(btc.openInterestUsd / 1e6).toFixed(0)}M, positioning: ${btcSig?.derivatives.positioning ?? 'N/A'}. Funding percentile: p${scoreFunding(btc.fundingRate).percentile.toFixed(0)}.`,
      hintSentiment: btcSig ? signedDirection(btcSig.derivatives.score) : 'NEUTRAL',
      tag: btcSig?.derivatives.positioning,
      symbol: 'BTCUSDT',
    });
  }
  const ethSig = input.aiSignals['ETHUSDT'];
  const eth = input.perpetuals.find((t) => t.symbol === 'ETHUSDT');
  if (eth) {
    items.push({
      bucket: 'derivativesInsight',
      label: 'ETH perp',
      context: `ETH funding ${(eth.fundingRate * 100).toFixed(4)}%, OI $${(eth.openInterestUsd / 1e6).toFixed(0)}M, positioning: ${ethSig?.derivatives.positioning ?? 'N/A'}.`,
      hintSentiment: ethSig ? signedDirection(ethSig.derivatives.score) : 'NEUTRAL',
      tag: ethSig?.derivatives.positioning,
      symbol: 'ETHUSDT',
    });
  }

  // ---- Options-derived metrics: PCR + L/S for BTC and ETH ----
  // Only populated for underlyings with liquid options coverage.
  const optionsMetrics = input.optionsMetrics ?? {};
  for (const underlying of ['BTC', 'ETH']) {
    const om = optionsMetrics[underlying];
    if (!om) continue;
    const perpSymbol = `${underlying}USDT`;
    if (om.pcr) {
      const hint: SentimentBadge =
        om.pcr.label === 'Bullish crowd' ? 'BULLISH'
        : om.pcr.label === 'Bearish crowd' ? 'BEARISH'
        : 'NEUTRAL';
      items.push({
        bucket: 'derivativesInsight',
        label: `${underlying} options PCR`,
        context: `${underlying} 24h put/call volume ratio = ${om.pcr.pcrVolume.toFixed(2)} across ${om.pcr.contractsCounted} contracts. ${om.pcr.description}`,
        hintSentiment: hint,
        tag: `PCR ${om.pcr.pcrVolume.toFixed(2)}`,
        symbol: perpSymbol,
      });
    }
    if (om.ls) {
      const hint: SentimentBadge =
        om.ls.label === 'Long-biased' ? 'BULLISH'
        : om.ls.label === 'Short-biased' ? 'BEARISH'
        : 'NEUTRAL';
      items.push({
        bucket: 'derivativesInsight',
        label: `${underlying} options L/S`,
        context: `${underlying} options OI split: ${om.ls.longBiasPct.toFixed(0)}% long-biased vs ${(100 - om.ls.longBiasPct).toFixed(0)}% short-biased across ${om.ls.contractsCounted} contracts. ${om.ls.description}`,
        hintSentiment: hint,
        tag: `${om.ls.longBiasPct.toFixed(0)}% long`,
        symbol: perpSymbol,
      });
    }
  }

  // ---- Funding Extremes: top 4 by absolute percentile deviation from p50 ----
  const fundingRanked = [...liquidPerps]
    .map((t) => ({ t, s: scoreFunding(t.fundingRate) }))
    .filter(({ s }) => s.score !== 0)
    .sort((a, b) => Math.abs(b.s.score) * 100 - Math.abs(a.s.score) * 100 || Math.abs(b.s.percentile - 50) - Math.abs(a.s.percentile - 50))
    .slice(0, 4);
  for (const { t, s } of fundingRanked) {
    items.push({
      bucket: 'fundingExtremes',
      label: `${underlyingOf(t)} funding`,
      context: `${t.symbol} funding ${(t.fundingRate * 100).toFixed(4)}% at p${s.percentile.toFixed(0)}. ${s.description}`,
      hintSentiment: s.score > 0 ? 'BULLISH' : 'BEARISH',
      symbol: t.symbol,
      tag: `p${s.percentile.toFixed(0)}`,
    });
  }

  // ---- Volume Anomalies: liquid tokens with turnover >2× the median ----
  const volumes = liquidPerps.map((t) => t.turnoverUsd).sort((a, b) => a - b);
  const median = volumes[Math.floor(volumes.length / 2)] || 1;
  const anomalies = liquidNonMajors
    .filter((t) => t.turnoverUsd > median * 2)
    .sort((a, b) => b.turnoverUsd - a.turnoverUsd)
    .slice(0, 3);
  for (const t of anomalies) {
    const mult = (t.turnoverUsd / median).toFixed(1);
    items.push({
      bucket: 'volumeAnomalies',
      label: underlyingOf(t),
      price: formatPrice(t.price),
      changePct: t.priceChangePct24h,
      context: `${t.symbol} 24h volume ${fmtCompact(t.turnoverUsd)} — ${mult}× the median perp volume. Change ${fmtPct(t.priceChangePct24h)}.`,
      hintSentiment: t.priceChangePct24h >= 0 ? 'BULLISH' : 'BEARISH',
      symbol: t.symbol,
      tag: `${mult}× median`,
    });
  }

  // ---- OI Change Leaders: biggest 24h OI swings on liquid perps ----
  const oi = input.oiSnapshots ?? {};
  const liquidSymbols = new Set(liquidPerps.map((p) => p.symbol));
  const oiEntries = Object.entries(oi)
    .map(([sym, { oiNow, oiPrior }]) => {
      if (!liquidSymbols.has(sym)) return null;
      const ticker = input.perpetuals.find((p) => p.symbol === sym);
      if (!ticker || !oiPrior) return null;
      const pctChange = ((oiNow - oiPrior) / oiPrior) * 100;
      return { ticker, pctChange };
    })
    .filter((x): x is { ticker: TokenCardData; pctChange: number } => !!x)
    .sort((a, b) => Math.abs(b.pctChange) - Math.abs(a.pctChange))
    .slice(0, 3);
  for (const { ticker, pctChange } of oiEntries) {
    const sym = ticker.symbol;
    items.push({
      bucket: 'oiChanges',
      label: underlyingOf(ticker),
      price: formatPrice(ticker.price),
      changePct: ticker.priceChangePct24h,
      context: `${sym} open interest ${pctChange >= 0 ? '+' : ''}${pctChange.toFixed(1)}% over 24h. Price ${fmtPct(ticker.priceChangePct24h)}. ${pctChange > 0 ? 'Fresh positioning entering.' : 'Positions being unwound.'}`,
      hintSentiment:
        pctChange > 0 && ticker.priceChangePct24h > 0 ? 'BULLISH'
        : pctChange > 0 && ticker.priceChangePct24h < 0 ? 'BEARISH'
        : pctChange < 0 && ticker.priceChangePct24h > 0 ? 'BULLISH'
        : 'BEARISH',
      symbol: sym,
      tag: `${pctChange >= 0 ? '+' : ''}${pctChange.toFixed(1)}% OI`,
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

  return `You are Saraswati's market-desk analyst writing one-line reasons for the home-page AI Market Summary card. Traders scan this in 2 seconds — every line must be punchy, specific, and immediately useful.

===== OUTPUT FORMAT =====
For each numbered input item, return:
- index: the item number
- reason: ONE sentence, ≤ 14 words. Lead with the fact that matters most.
- sentiment: BULLISH | NEUTRAL | BEARISH (you may override the Hint if the Context warrants).

===== BUCKET-SPECIFIC RULES =====

marketPulse (BTC/ETH/SOL): Highlight WHAT changed (funding, regime, AI Signal). Don't re-state the price.
  Example — good: "Long buildup with rising funding — breakout pressure"
  Example — bad:  "BTC is up 1% on positive sentiment"

bigMovers: Explain WHY the move is happening (volume, funding, OI, catalyst). Don't just say it moved.
  Example — good: "Volume 4× median on short-squeeze continuation"
  Example — bad:  "Major token gains on strong momentum"

macroWatch (news headlines): Write the MARKET TAKEAWAY, not a headline rehash.
  Example — good: "Fed pivot unlocks risk-on — tailwind for crypto majors"
  Example — bad:  "The Fed may consider rate cuts"

derivativesInsight: Name the positioning regime clearly (Long Buildup / Short Covering / Short Buildup / Long Unwinding) and its contrarian implication.
  Example — good: "Short covering accelerates — squeeze fuel exhausted, fade strength"
  Example — bad:  "Derivatives look bullish overall"

fundingExtremes: State the percentile + contrarian read.
  Example — good: "Funding at p97 — crowded longs, mean-reversion risk"
  Example — bad:  "Funding is elevated"

volumeAnomalies: Say volume multiple vs norm + direction.
  Example — good: "Volume 6× median on break above resistance"
  Example — bad:  "Unusual volume detected"

oiChanges: Pair OI direction with price direction.
  Example — good: "OI +15% with price up — fresh longs entering, not covering"
  Example — bad:  "OI is changing meaningfully"

===== HARD RULES =====
- NEVER use: "may", "could", "potentially", "suggests that", "keep an eye on", "market is mixed".
- Every reason names a concrete lever: volume, funding, OI, price level, named pattern, cited event.
- Active voice. No throat-clearing.
- If the Hint and Context genuinely disagree, trust the Context and override.

===== OUTPUT =====
Respond ONLY as valid JSON (no markdown, no commentary):
{
  "items": [
    { "index": 1, "reason": "...", "sentiment": "BULLISH|NEUTRAL|BEARISH" }
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
    fundingExtremes: [],
    volumeAnomalies: [],
    oiChanges: [],
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
      symbol: it.symbol,
      url: it.url,
      source: it.source,
      publishedAt: it.publishedAt,
      sourceDomain: it.sourceDomain,
      detail: it.detail,
    });
  });

  return summary;
}
