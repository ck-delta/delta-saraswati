// "Things to Note" generator — 3-5 punchy, data-backed bullet points.
// Hybrid: TypeScript picks the most notable items from the signal breakdown
// (strongest indicator, biggest news, positioning, fired pattern, funding
// extreme, PCR extreme, L/S skew). Groq writes one short sentence per item.

import { generateJSON } from '@/lib/ai/llm';
import { z } from 'zod';
import type { AISignalResult } from '@/lib/signals/composite';
import type { TechScoreResult } from '@/lib/signals/tech-score';
import type { DerivScoreResult } from '@/lib/signals/deriv-score';
import type { NewsScoreResult } from '@/lib/signals/news-score';
import type { PCRResult, OptionsLSResult } from '@/lib/api/delta';

export interface ThingToNote {
  text: string;
  kind: 'technical' | 'news' | 'derivatives' | 'pattern' | 'options' | 'divergence';
  tone: 'bullish' | 'bearish' | 'neutral';
}

interface Candidate {
  kind: ThingToNote['kind'];
  tone: ThingToNote['tone'];
  context: string;
}

export interface ThingsToNoteInput {
  composite: AISignalResult;
  technical: TechScoreResult;
  derivatives: DerivScoreResult;
  news: NewsScoreResult;
  pcr?: PCRResult | null;
  ls?: OptionsLSResult | null;
}

function pickCandidates(input: ThingsToNoteInput): Candidate[] {
  const out: Candidate[] = [];
  const { technical, derivatives, news, pcr, ls, composite } = input;

  // 1) Strongest technical contributor
  if (technical.contributions.length > 0) {
    const strongest = [...technical.contributions].sort(
      (a, b) => Math.abs(b.weighted) - Math.abs(a.weighted),
    )[0];
    out.push({
      kind: 'technical',
      tone: strongest.vote > 0 ? 'bullish' : strongest.vote < 0 ? 'bearish' : 'neutral',
      context: `Technical lead: ${strongest.name} — ${strongest.reason}. Regime: ${technical.regime}.`,
    });
  }

  // 2) Pattern, if any fired
  if (technical.patterns.length > 0) {
    const p = technical.patterns[0];
    out.push({
      kind: 'pattern',
      tone: p.direction === 'bull' ? 'bullish' : 'bearish',
      context: `${p.name} pattern detected with ${(p.confidence * 100).toFixed(0)}% confidence.`,
    });
  }

  // 3) News lead
  if (news.matched.length > 0) {
    const top = [...news.matched].sort(
      (a, b) => Math.abs(b.signedDecayedImpact) - Math.abs(a.signedDecayedImpact),
    )[0];
    out.push({
      kind: 'news',
      tone: top.direction === 'bull' ? 'bullish' : top.direction === 'bear' ? 'bearish' : 'neutral',
      context: `${news.matched.length} headline(s) matched. Lead (${top.priceImpactTier}/${top.breadthTier}): "${top.title.slice(0, 120)}".`,
    });
  }

  // 4) Positioning + funding percentile (combined)
  const positioningTone = (
    derivatives.positioning === 'Long Buildup' ? 'bullish'
      : derivatives.positioning === 'Short Covering' ? 'bullish'
      : derivatives.positioning === 'Short Buildup' ? 'bearish'
      : derivatives.positioning === 'Long Unwinding' ? 'bearish'
      : 'neutral'
  ) as ThingToNote['tone'];
  out.push({
    kind: 'derivatives',
    tone: positioningTone,
    context: `Positioning: ${derivatives.positioning}. Funding at p${derivatives.fundingPercentile.toFixed(0)} (${(derivatives.fundingRate * 100).toFixed(3)}%).`,
  });

  // 5) Options: PCR or L/S extreme
  if (pcr && pcr.label !== 'Neutral') {
    out.push({
      kind: 'options',
      tone: pcr.label === 'Bullish crowd' ? 'bullish' : 'bearish',
      context: `Options PCR ${pcr.pcrVolume.toFixed(2)} — ${pcr.description}`,
    });
  } else if (ls && ls.label !== 'Balanced') {
    out.push({
      kind: 'options',
      tone: ls.label === 'Long-biased' ? 'bullish' : 'bearish',
      context: `Options OI split — ${ls.description}`,
    });
  }

  // 6) Divergence if composite flagged it
  if (composite.divergent) {
    out.push({
      kind: 'divergence',
      tone: 'neutral',
      context: `News/Technical/Derivatives sub-scores diverge (${composite.news.score.toFixed(1)}/${composite.technical.score.toFixed(1)}/${composite.derivatives.score.toFixed(1)}). Conviction is low.`,
    });
  }

  return out.slice(0, 6);
}

/** Cap how many items we surface. Groq can drop some if it thinks they overlap. */
const TARGET_MIN = 3;
const TARGET_MAX = 5;

export async function buildThingsToNote(input: ThingsToNoteInput): Promise<ThingToNote[]> {
  const candidates = pickCandidates(input);
  if (candidates.length === 0) return [];

  const list = candidates
    .map((c, i) => `${i + 1}. [${c.kind}] tone=${c.tone}\n   ${c.context}`)
    .join('\n\n');

  const prompt = `You are Saraswati's trading desk analyst writing the "Things to Note" panel for a crypto asset's research page. A portfolio manager will read this in 5 seconds before making a position decision — every bullet must earn its place.

===== THINK STEP BY STEP (do not emit these steps) =====

STEP 1 — RANK
Rank the ${candidates.length} candidates by market-moving power:
- Active news catalyst (regime-change or severe impact) ranks highest
- Confirmed technical pattern ranks above oscillator readings
- Extreme derivatives positioning (Long Buildup, Short Covering, crowded p95+ funding) ranks highly
- Options crowding (PCR extreme, L/S skew) is a sharp contrarian signal when present
- Divergence across sub-scores is a caution flag — include only if flagged

STEP 2 — DEDUPE
Drop candidates that say the same thing in different words. Keep the strongest phrasing.

STEP 3 — TRIM
Keep ${TARGET_MIN} to ${TARGET_MAX} items. More than 5 = noise.

STEP 4 — REWRITE
Turn each candidate into ONE trader-desk sentence:
- Lead with the hard fact ("MACD flipped bullish on 4h" not "Indicators suggest bullish momentum")
- Include the number or level where relevant ("funding at p96 — crowded longs")
- Name the pattern/indicator/source concretely
- ≤ 20 words per bullet
- No hedging ("may", "could", "potentially", "might")
- Active voice

STEP 5 — PRESERVE METADATA
For each output item, keep the source candidate's 'kind' and 'tone' unchanged. Do not invent new kinds or flip tones.

===== OUTPUT =====
Return ONLY valid JSON matching this exact schema. No markdown, no explanations:
{
  "items": [
    { "text": "...", "kind": "technical|news|derivatives|pattern|options|divergence", "tone": "bullish|bearish|neutral" }
  ]
}

CANDIDATES:
${list}`;

  const outputSchema = z.object({
    items: z.array(z.object({
      text: z.string().min(1),
      kind: z.enum(['technical', 'news', 'derivatives', 'pattern', 'options', 'divergence']),
      tone: z.enum(['bullish', 'bearish', 'neutral']),
    })),
  });

  try {
    const out = await generateJSON(prompt, {
      task: 'things-to-note',
      schema: outputSchema,
      temperature: 0.4,
      maxTokens: 800,
    });
    return out.items.slice(0, TARGET_MAX);
  } catch (err) {
    console.error('buildThingsToNote failed, falling back to raw candidates:', err);
    return candidates.slice(0, TARGET_MAX).map((c) => ({
      text: c.context,
      kind: c.kind,
      tone: c.tone,
    }));
  }
}
