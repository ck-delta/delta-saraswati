// Groq batch classifier for news headlines, enhanced with:
// - article body context (not just title)
// - per-source credibility weights
// - corroboration boost (when N outlets cover the same story)
// - velocity / "news storm" detection

import { generateJSON } from '@/lib/ai/groq';
import type { NewsItem } from '@/types/news';

interface ClassifiedItem {
  index: number;
  direction: 'bull' | 'bear' | 'neutral';
  priceImpactTier: 'severe' | 'major' | 'moderate' | 'minor' | 'negligible';
  breadthTier: 'systemic' | 'cross-asset' | 'sector-wide' | 'token-specific';
  forwardTier: 'regime-change' | 'trend-confirmation' | 'isolated' | 'contrary';
  affectedTokens: string[];
  impactScore: number;
}

const KNOWN_TOKENS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'DOGEUSDT', 'PAXGUSDT'];

// ---------------------------------------------------------------------------
// Per-source credibility weights. Higher = more trusted, its impact score
// is multiplied by this factor. Calibrated qualitatively: TradFi > core crypto
// press > generalist crypto > aggregators.
// ---------------------------------------------------------------------------

export const SOURCE_CREDIBILITY: Record<string, number> = {
  // TradFi — highest authority on macro / regulation
  'Reuters Crypto':    1.30,
  'Bloomberg Crypto':  1.30,
  'FT Crypto':         1.30,
  // Core crypto press — trusted for crypto-native breaking news
  'CoinDesk':          1.15,
  'The Block':         1.15,
  'CoinTelegraph':     1.10,
  'Decrypt':           1.10,
  'DL News':           1.10,
  // Generalist / research
  'Bitcoin Magazine':  1.05,
  'Blockworks':        1.05,
  'Crypto Briefing':   1.00,
  'The Defiant':       1.00,
  'Bankless':          1.00,
  // Lower — aggregators / commentary-heavy
  'Milk Road':         0.90,
  'U.Today':           0.85,
};

const DEFAULT_CREDIBILITY = 1.00;

export function credibilityFor(source: string): number {
  return SOURCE_CREDIBILITY[source] ?? DEFAULT_CREDIBILITY;
}

// ---------------------------------------------------------------------------
// Velocity / storm detection. "Storm" = ≥5 headlines mentioning a token in
// the last 60 minutes.
// ---------------------------------------------------------------------------

export interface StormInfo {
  stormTokens: Set<string>;
  perTokenCount: Record<string, number>;
}

const STORM_WINDOW_MS = 60 * 60_000;
const STORM_THRESHOLD = 5;
const STORM_BOOST = 1.3;

export function detectStorms(items: NewsItem[]): StormInfo {
  const now = Date.now();
  const counts: Record<string, number> = {};
  for (const item of items) {
    const ts = Date.parse(item.publishedAt);
    if (isNaN(ts) || now - ts > STORM_WINDOW_MS) continue;
    const tokens = item.affectedTokens ?? [];
    for (const tok of tokens) {
      counts[tok] = (counts[tok] || 0) + 1;
    }
  }
  const stormTokens = new Set(
    Object.entries(counts)
      .filter(([, n]) => n >= STORM_THRESHOLD)
      .map(([tok]) => tok),
  );
  return { stormTokens, perTokenCount: counts };
}

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

function buildPrompt(items: NewsItem[]): string {
  const list = items
    .map((item, idx) => {
      // Title + first ~200 words of body when available. Better accuracy on
      // nuanced stories ("Fed hints at pivot" vs "Fed confirms pivot").
      const body = (item.body ?? item.description ?? '').replace(/\s+/g, ' ').slice(0, 800);
      const head = `${idx + 1}. [${item.source}] ${item.title}`;
      return body.length > 20 ? `${head}\n   ${body}` : head;
    })
    .join('\n\n');

  return `You are Saraswati's news-impact classifier. For each crypto-market headline (title + optional body), tag it on three independent axes + affected tokens.

Axes (tradermonty Market News Analyst framework, crypto-adapted):

1) PRICE IMPACT TIER — expected magnitude of market reaction
   - severe: ±10%+ token / ±3%+ total mcap (hacks, ETF approvals, major regulation, Fed surprise)
   - major: ±5-10% token / ±1.5-3% macro (big partnerships, downgrades, mega-caps)
   - moderate: ±2-5% token / ±0.5-1.5% macro (exchange news, normal Fed commentary)
   - minor: ±1-2% token / <±0.5% macro (product launches, minor upgrades)
   - negligible: background chatter

2) BREADTH TIER — how wide the impact spreads
   - systemic: multiple asset classes / global markets (FOMC, risk-off, depeg)
   - cross-asset: crypto + bonds/FX/equities (ETF flows, CPI)
   - sector-wide: one crypto sub-sector (DeFi exploit, L1 outage)
   - token-specific: single token

3) FORWARD TIER — informational durability
   - regime-change: narrative shift (ETF approval, major regulation, Fed pivot)
   - trend-confirmation: reinforces existing trajectory
   - isolated: one-off
   - contrary: contradicts current narrative

4) AFFECTED TOKENS — subset of: ${KNOWN_TOKENS.join(', ')}. Empty if broad-market only.

5) DIRECTION — bull, bear, or neutral for the affected token(s).

6) IMPACT SCORE — 0-100 scalar combining all the above (severe+systemic+regime ≈ 100).

Rules:
- Use the article body to refine tier when the title is ambiguous.
- "Hints at X" or "may X" → tier one step lower than "confirms X" or "announces X".
- If an article rehashes yesterday's news, downgrade tier.

Respond ONLY with valid JSON, no markdown:
{
  "items": [
    {
      "index": 1,
      "direction": "bull|bear|neutral",
      "priceImpactTier": "severe|major|moderate|minor|negligible",
      "breadthTier": "systemic|cross-asset|sector-wide|token-specific",
      "forwardTier": "regime-change|trend-confirmation|isolated|contrary",
      "affectedTokens": ["BTCUSDT", ...],
      "impactScore": 72
    }
  ]
}

HEADLINES:
${list}`;
}

// ---------------------------------------------------------------------------
// Public: classify + apply credibility, corroboration, and velocity boosts
// ---------------------------------------------------------------------------

/**
 * Classify up to 30 headlines in a single Groq call, then boost/weight the
 * impact score based on source credibility, corroboration count, and whether
 * the affected tokens are currently in a news storm. Returns the full array
 * with all classifier + booster fields populated.
 */
export async function classifyNewsBatch(items: NewsItem[]): Promise<NewsItem[]> {
  if (items.length === 0) return items;
  const toClassify = items.slice(0, 30);

  let classifiedByIdx = new Map<number, ClassifiedItem>();
  try {
    const prompt = buildPrompt(toClassify);
    const result = await generateJSON<{ items: ClassifiedItem[] }>(prompt);
    for (const c of result.items ?? []) classifiedByIdx.set(c.index, c);
  } catch (err) {
    console.error('News classifier failed; falling back to heuristic:', err);
    classifiedByIdx = new Map();
  }

  // First pass: apply Groq tags + credibility + corroboration
  const stage1 = items.map((item, idx) => {
    const c = classifiedByIdx.get(idx + 1);
    if (!c) return item;
    const credibility = credibilityFor(item.source);
    const corrBoost = 1 + Math.min(3, item.corroborations ?? 0) * 0.12; // cap at 1.36× for 3+ sources
    const boostedScore = Math.max(
      0,
      Math.min(100, c.impactScore * credibility * corrBoost),
    );
    return {
      ...item,
      sentiment: c.direction === 'bull' ? 'positive' : c.direction === 'bear' ? 'negative' : 'neutral',
      sentimentScore: boostedScore,
      affectedTokens: Array.isArray(c.affectedTokens) ? c.affectedTokens.filter((t) => KNOWN_TOKENS.includes(t)) : [],
      priceImpactTier: c.priceImpactTier,
      breadthTier: c.breadthTier,
      forwardTier: c.forwardTier,
    } as NewsItem;
  });

  // Second pass: velocity / storm boost (needs affectedTokens already set)
  const storms = detectStorms(stage1);
  const stage2 = stage1.map((item) => {
    const tokens = item.affectedTokens ?? [];
    const inStorm = tokens.some((t) => storms.stormTokens.has(t));
    if (!inStorm) return item;
    return {
      ...item,
      inStorm: true,
      sentimentScore: Math.max(0, Math.min(100, (item.sentimentScore ?? 50) * STORM_BOOST)),
    };
  });

  return stage2;
}

/** Exposed for surfacing in the MoodBar alert row. */
export function listStormTokens(items: NewsItem[]): string[] {
  return Array.from(detectStorms(items).stormTokens);
}
