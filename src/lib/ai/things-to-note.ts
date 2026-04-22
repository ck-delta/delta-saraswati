// "Things to Note" generator — 3-5 punchy, data-backed bullet points.
// Hybrid: TypeScript picks the most notable items from the signal breakdown
// (strongest indicator, biggest news, positioning, fired pattern, funding
// extreme, PCR extreme, L/S skew). Groq writes one short sentence per item.

import { generateJSON } from '@/lib/ai/groq';
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

  const prompt = `You are Saraswati's trading desk analyst. You see ${candidates.length} raw data points about a crypto asset. Rewrite the ${TARGET_MIN}-${TARGET_MAX} most NOTABLE ones into short, punchy trader-desk bullet points.

Rules:
- Write each as ONE sentence, <= 20 words.
- Lead with the fact, not generic phrasing. "MACD flipped bullish on 4h" beats "Indicators suggest…".
- Preserve the 'kind' and 'tone' of the candidate — don't invent new ones.
- Skip candidates that are redundant with another more impactful item.
- Keep the ordering: most market-moving first.

Return ONLY valid JSON:
{
  "notes": [
    { "text": "...", "kind": "technical|news|derivatives|pattern|options|divergence", "tone": "bullish|bearish|neutral" }
  ]
}

CANDIDATES:
${list}`;

  try {
    const out = await generateJSON<{ notes: ThingToNote[] }>(prompt);
    const valid = (out.notes ?? []).filter(
      (n) => typeof n?.text === 'string' && n.text.length > 0,
    );
    return valid.slice(0, TARGET_MAX);
  } catch (err) {
    console.error('buildThingsToNote Groq failed, falling back to raw candidates:', err);
    return candidates.slice(0, TARGET_MAX).map((c) => ({
      text: c.context,
      kind: c.kind,
      tone: c.tone,
    }));
  }
}
