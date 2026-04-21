// Groq batch classifier for news headlines.
// Replaces the heuristic classifier in `signals/news-score.ts` for higher
// accuracy on crypto-specific jargon. Falls back gracefully if Groq fails —
// the heuristic fill-in continues to work.

import { generateJSON } from '@/lib/ai/groq';
import type { NewsItem } from '@/types/news';

interface ClassifiedItem {
  index: number;
  direction: 'bull' | 'bear' | 'neutral';
  priceImpactTier: 'severe' | 'major' | 'moderate' | 'minor' | 'negligible';
  breadthTier: 'systemic' | 'cross-asset' | 'sector-wide' | 'token-specific';
  forwardTier: 'regime-change' | 'trend-confirmation' | 'isolated' | 'contrary';
  affectedTokens: string[];
  /** 0-100 scalar for UI tooltips. */
  impactScore: number;
}

const KNOWN_TOKENS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'DOGEUSDT', 'PAXGUSDT'];

function buildPrompt(items: NewsItem[]): string {
  const list = items
    .map(
      (item, idx) =>
        `${idx + 1}. [${item.source}] ${item.title}${
          item.description ? ` — ${item.description.slice(0, 120)}` : ''
        }`,
    )
    .join('\n');

  return `You are Saraswati's news-impact classifier. For each crypto-market headline, tag it on three independent axes + affected tokens.

Axes (match the tradermonty Market News Analyst framework, crypto-adapted):

1) PRICE IMPACT TIER — the likely magnitude of market reaction
   - severe: expected ±10%+ token move OR ±3%+ total crypto mcap move (hacks, ETF approvals, major regulation, Fed surprise)
   - major: ±5-10% token / ±1.5-3% macro (big partnerships, credit downgrades, mega-caps)
   - moderate: ±2-5% token / ±0.5-1.5% macro (exchange news, normal Fed commentary)
   - minor: ±1-2% token / <±0.5% macro (product launches, minor upgrades)
   - negligible: background chatter

2) BREADTH TIER — how wide the impact spreads
   - systemic: hits multiple asset classes or global markets (FOMC, global risk-off, stablecoin depeg)
   - cross-asset: crypto + bonds/FX/equities (ETF flows, macro CPI)
   - sector-wide: affects one crypto sub-sector (DeFi exploit, L1 outage, meme rotation)
   - token-specific: single token

3) FORWARD TIER — informational durability
   - regime-change: narrative shift (ETF approval, major regulation, Fed pivot)
   - trend-confirmation: reinforces existing trajectory
   - isolated: one-off with no follow-on
   - contrary: contradicts current narrative

4) AFFECTED TOKENS — subset of: ${KNOWN_TOKENS.join(', ')}. Empty array if broad-market only.

5) DIRECTION — bull, bear, or neutral FOR THE AFFECTED TOKEN(S). Use neutral if truly two-sided.

6) IMPACT SCORE — 0-100 scalar combining the above. (severe+systemic+regime = ~100; minor+token-specific+isolated = ~10)

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

/**
 * Classify up to 30 headlines in a single Groq call.
 * Returns the same NewsItem array with classifier fields filled in.
 * On failure, returns the input unchanged (heuristic downstream fills in).
 */
export async function classifyNewsBatch(items: NewsItem[]): Promise<NewsItem[]> {
  if (items.length === 0) return items;
  const toClassify = items.slice(0, 30);

  try {
    const prompt = buildPrompt(toClassify);
    const result = await generateJSON<{ items: ClassifiedItem[] }>(prompt);
    const byIdx = new Map<number, ClassifiedItem>();
    for (const c of result.items ?? []) byIdx.set(c.index, c);

    return items.map((item, idx) => {
      const c = byIdx.get(idx + 1);
      if (!c) return item;
      return {
        ...item,
        sentiment: c.direction === 'bull' ? 'positive' : c.direction === 'bear' ? 'negative' : 'neutral',
        sentimentScore: Math.max(0, Math.min(100, c.impactScore)),
        affectedTokens: Array.isArray(c.affectedTokens) ? c.affectedTokens.filter((t) => KNOWN_TOKENS.includes(t)) : [],
        priceImpactTier: c.priceImpactTier,
        breadthTier: c.breadthTier,
        forwardTier: c.forwardTier,
      };
    });
  } catch (err) {
    console.error('News classifier failed; falling back to heuristic:', err);
    return items;
  }
}
