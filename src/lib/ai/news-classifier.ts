// Batch classifier for news headlines, enhanced with:
// - article body context (not just title)
// - per-source credibility weights
// - corroboration boost (when N outlets cover the same story)
// - velocity / "news storm" detection
//
// Uses OpenRouter via `llm.ts` with Zod-validated output and few-shot examples.

import { generateJSON, SCHEMAS } from '@/lib/ai/llm';
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
// Source credibility
// ---------------------------------------------------------------------------

export const SOURCE_CREDIBILITY: Record<string, number> = {
  'Reuters Crypto':    1.30,
  'Bloomberg Crypto':  1.30,
  'FT Crypto':         1.30,
  'CoinDesk':          1.15,
  'The Block':         1.15,
  'CoinTelegraph':     1.10,
  'Decrypt':           1.10,
  'DL News':           1.10,
  'Bitcoin Magazine':  1.05,
  'Blockworks':        1.05,
  'Crypto Briefing':   1.00,
  'The Defiant':       1.00,
  'Bankless':          1.00,
  'Milk Road':         0.90,
  'U.Today':           0.85,
};
const DEFAULT_CREDIBILITY = 1.00;

export function credibilityFor(source: string): number {
  return SOURCE_CREDIBILITY[source] ?? DEFAULT_CREDIBILITY;
}

// ---------------------------------------------------------------------------
// Storm detection
// ---------------------------------------------------------------------------

export interface StormInfo {
  stormTokens: Set<string>;
  perTokenCount: Record<string, number>;
}

const STORM_WINDOW_MS = 60 * 60_000;
const STORM_THRESHOLD = 5;
const STORM_BOOST = 1.3;

const KEYWORD_TO_TOKEN: { keywords: string[]; token: string }[] = [
  { keywords: ['bitcoin', 'btc'],                       token: 'BTCUSDT' },
  { keywords: ['ethereum', 'eth', 'ether ', 'vitalik'], token: 'ETHUSDT' },
  { keywords: ['solana', ' sol '],                      token: 'SOLUSDT' },
  { keywords: ['xrp', 'ripple'],                        token: 'XRPUSDT' },
  { keywords: ['dogecoin', 'doge'],                     token: 'DOGEUSDT' },
  { keywords: ['pax gold', 'paxg'],                     token: 'PAXGUSDT' },
];

function tokensFromText(text: string): string[] {
  const lc = (' ' + text.toLowerCase() + ' ');
  const hits: string[] = [];
  for (const { keywords, token } of KEYWORD_TO_TOKEN) {
    if (keywords.some((kw) => lc.includes(kw))) hits.push(token);
  }
  return hits;
}

export function detectStorms(items: NewsItem[]): StormInfo {
  const now = Date.now();
  const counts: Record<string, number> = {};
  for (const item of items) {
    const ts = Date.parse(item.publishedAt);
    if (isNaN(ts) || now - ts > STORM_WINDOW_MS) continue;
    const tokens = (item.affectedTokens && item.affectedTokens.length > 0)
      ? item.affectedTokens
      : tokensFromText(`${item.title} ${item.body ?? item.description ?? ''}`);
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
// Few-shot examples — help the model calibrate crypto-specific jargon
// ---------------------------------------------------------------------------

const FEW_SHOT_EXAMPLES = `
EXAMPLES (study these before labeling the real input):

Input: "[CoinDesk] US SEC approves spot ETH ETF with in-kind redemptions"
→ {"direction":"bull","priceImpactTier":"severe","breadthTier":"cross-asset","forwardTier":"regime-change","affectedTokens":["ETHUSDT"],"impactScore":92}
  Reason: ETF approval = regime change, severe magnitude, crypto + equity impact, ETH-specific.

Input: "[Decrypt] Bitcoin briefly dips below \\$78K as S&P sells off on CPI print"
→ {"direction":"bear","priceImpactTier":"major","breadthTier":"systemic","forwardTier":"trend-confirmation","affectedTokens":["BTCUSDT"],"impactScore":65}
  Reason: Macro-driven move, cross-asset, confirms risk-off trend, major magnitude.

Input: "[CoinTelegraph] Arbitrum DAO approves 50M ARB grant for DeFi incubator"
→ {"direction":"bull","priceImpactTier":"minor","breadthTier":"sector-wide","forwardTier":"isolated","affectedTokens":[],"impactScore":18}
  Reason: Single ecosystem news, small magnitude, isolated event, no tokens we track.

Input: "[The Block] Hyperliquid suffers \\$25M exploit via oracle manipulation"
→ {"direction":"bear","priceImpactTier":"major","breadthTier":"sector-wide","forwardTier":"regime-change","affectedTokens":[],"impactScore":58}
  Reason: Exploit = narrative shifter for DeFi sector. Major magnitude but not systemic.

Input: "[U.Today] Analyst: Ethereum could hit \\$3,000 by year-end"
→ {"direction":"neutral","priceImpactTier":"negligible","breadthTier":"token-specific","forwardTier":"isolated","affectedTokens":["ETHUSDT"],"impactScore":5}
  Reason: Analyst opinion, no new data, no catalyst. Negligible.

Input: "[Reuters Crypto] Fed minutes signal possible rate cut by Q3"
→ {"direction":"bull","priceImpactTier":"severe","breadthTier":"systemic","forwardTier":"regime-change","affectedTokens":["BTCUSDT","ETHUSDT"],"impactScore":88}
  Reason: Fed pivot = regime change, systemic breadth, crypto-bullish risk-on catalyst.

Input: "[Milk Road] Top 10 meme coins to watch this week"
→ {"direction":"neutral","priceImpactTier":"negligible","breadthTier":"sector-wide","forwardTier":"isolated","affectedTokens":[],"impactScore":3}
  Reason: Clickbait recap, no catalyst, negligible.
`.trim();

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------

function buildPrompt(items: NewsItem[]): string {
  const list = items
    .map((item, idx) => {
      const body = (item.body ?? item.description ?? '').replace(/\s+/g, ' ').slice(0, 800);
      const head = `${idx + 1}. [${item.source}] ${item.title}`;
      return body.length > 20 ? `${head}\n   ${body}` : head;
    })
    .join('\n\n');

  return `You are Saraswati's news-impact classifier. Tag each crypto-market headline on three orthogonal axes plus affected tokens.

Axes (tradermonty Market News Analyst framework, crypto-adapted):

1) PRICE IMPACT TIER — expected magnitude of market reaction
   - severe: ±10%+ token / ±3%+ total mcap (hacks, ETF approvals, major regulation, Fed surprise)
   - major: ±5-10% token / ±1.5-3% macro (big partnerships, downgrades, mega-caps)
   - moderate: ±2-5% token / ±0.5-1.5% macro (exchange news, normal Fed commentary)
   - minor: ±1-2% token / <±0.5% macro (product launches, minor upgrades)
   - negligible: background chatter, analyst opinions, clickbait

2) BREADTH TIER — how wide the impact spreads
   - systemic: multiple asset classes / global markets (FOMC, risk-off, depeg)
   - cross-asset: crypto + bonds/FX/equities (ETF flows, CPI)
   - sector-wide: one crypto sub-sector (DeFi exploit, L1 outage, meme rotation)
   - token-specific: single token

3) FORWARD TIER — informational durability
   - regime-change: narrative shift (ETF approval, major regulation, Fed pivot)
   - trend-confirmation: reinforces existing trajectory
   - isolated: one-off
   - contrary: contradicts current narrative

4) AFFECTED TOKENS — subset of: ${KNOWN_TOKENS.join(', ')}. Empty array if broad-market only.

5) DIRECTION — bull, bear, or neutral for the affected token(s).

6) IMPACT SCORE — 0-100 scalar combining all the above (severe+systemic+regime ≈ 100).

Rules for nuance:
- Use the article body to refine tier when the title is ambiguous.
- "Hints at X" or "may X" → tier one step lower than "confirms X" or "announces X".
- If an article rehashes yesterday's news, downgrade tier.
- Analyst price-targets without new data → negligible + neutral direction.
- Exploits / hacks → always bearish for affected sector; magnitude scales with dollar amount.

${FEW_SHOT_EXAMPLES}

Now classify the REAL input below. Respond ONLY with valid JSON matching this exact schema:
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

INPUT HEADLINES:
${list}`;
}

// ---------------------------------------------------------------------------
// Public: classify + apply credibility, corroboration, and velocity boosts
// ---------------------------------------------------------------------------

export async function classifyNewsBatch(items: NewsItem[]): Promise<NewsItem[]> {
  if (items.length === 0) return items;
  const toClassify = items.slice(0, 30);

  let classifiedByIdx = new Map<number, ClassifiedItem>();
  try {
    const prompt = buildPrompt(toClassify);
    const result = await generateJSON(prompt, {
      task: 'news-classifier',
      schema: SCHEMAS.newsClassification,
      temperature: 0.2,
    });
    for (const c of result.items ?? []) classifiedByIdx.set(c.index, c as ClassifiedItem);
  } catch (err) {
    console.error('News classifier failed; falling back to heuristic:', err);
    classifiedByIdx = new Map();
  }

  const stage1 = items.map((item, idx) => {
    const c = classifiedByIdx.get(idx + 1);
    if (!c) return item;
    const credibility = credibilityFor(item.source);
    const corrBoost = 1 + Math.min(3, item.corroborations ?? 0) * 0.12;
    const boostedScore = Math.max(0, Math.min(100, c.impactScore * credibility * corrBoost));
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

export function listStormTokens(items: NewsItem[]): string[] {
  return Array.from(detectStorms(items).stormTokens);
}
