import { NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai/groq';
import { cache } from '@/lib/cache';

export const runtime = 'nodejs';
export const revalidate = 900;

interface Scenario {
  probability: number;
  thesis: string;
  entry: string;        // e.g. "$75,900" or "Current market"
  tp: string;           // e.g. "$78,400 (R1)"
  sl: string;           // e.g. "$74,500 (below pivot)"
  invalidation: string; // specific condition
  catalyst: string;     // event or level that triggers it
}

interface ScenarioResponse {
  bull: Scenario;
  base: Scenario;
  bear: Scenario;
  generatedAt: number;
  levels?: {
    price: number;
    pivots: { pivot: number; r1: number; r2: number; s1: number; s2: number } | null;
  };
  stale?: boolean;
}

const CACHE_TTL = 15 * 60 * 1000;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const { symbol: rawSymbol } = await params;
  const symbol = rawSymbol.toUpperCase();

  const cacheKey = `scenarios:${symbol}`;
  const cached = cache.get<ScenarioResponse>(cacheKey);
  if (cached?.fresh) return NextResponse.json({ ...cached.data, cached: true });

  try {
    const origin = new URL(req.url).origin;
    const sigRes = await fetch(`${origin}/api/ai-signal/${symbol}`);
    if (!sigRes.ok) {
      return NextResponse.json({ error: 'AI Signal unavailable' }, { status: 503 });
    }
    const sig = await sigRes.json();

    const pivots = (sig.pivotsRounded ?? sig.pivots) as
      | { pivot: number; r1: number; r2: number; r3: number; s1: number; s2: number; s3: number }
      | null;
    const price = sig.price as number;

    const pivotBlock = pivots
      ? `Pivot levels (rounded, from prior daily candle):
- P (daily pivot):    $${pivots.pivot.toLocaleString()}
- R1 (1st resistance): $${pivots.r1.toLocaleString()}
- R2 (2nd resistance): $${pivots.r2.toLocaleString()}
- R3 (3rd resistance): $${pivots.r3.toLocaleString()}
- S1 (1st support):    $${pivots.s1.toLocaleString()}
- S2 (2nd support):    $${pivots.s2.toLocaleString()}
- S3 (3rd support):    $${pivots.s3.toLocaleString()}`
      : `No pivot levels available — infer reasonable round numbers from price $${price?.toLocaleString()}.`;

    const prompt = `You are Saraswati's scenario engine for ${symbol}.
Produce three probability-weighted scenarios (Bull / Base / Bear) that sum to 100%. Each scenario must include concrete, tradeable levels.

Current price: $${price?.toLocaleString()}

${pivotBlock}

Signal context:
- Composite: ${sig.composite.score}/10 (${sig.composite.label}), confidence ${sig.composite.confidence}%, divergent=${sig.composite.divergent}
- News: ${sig.composite.news.score}/10 (${sig.composite.news.label})
- Technical: ${sig.composite.technical.score}/10 (${sig.composite.technical.label}, ${sig.composite.technical.regime})
- Derivatives: ${sig.composite.derivatives.score}/10 (${sig.composite.derivatives.label}, ${sig.composite.derivatives.positioning})

Top reasoning:
${(sig.composite.reasoning || []).join('\n')}

For each scenario produce:
- probability: integer 0-100 (must sum to 100)
- thesis: 1-2 sentences, specific, trader voice, mention the key catalyst
- entry: either "Current market" or a specific price (snap to nearest round number, e.g. "$76,000")
- tp: take-profit level — prefer a named pivot ("$78,400 (R1)") or a round number
- sl: stop-loss level — prefer a named pivot ("$74,700 (below S1)") or round number
- invalidation: the specific condition that kills this scenario (e.g. "Daily close below $74,000")
- catalyst: the most likely event or level that activates the scenario ("Break of R1 on rising volume", "FOMC dovish surprise", "Bearish engulfing on 4h")

Rules:
- Probabilities MUST sum to exactly 100.
- Bull probability should be higher when composite >= 6, Bear higher when <= 4.
- If divergent=true, keep probabilities closer to 33/34/33.
- Bull TP should be above price, Bear TP should be below.
- Entry/TP/SL for Base scenario describe a range-trading plan.
- Use the pivot levels above where they make sense — they are real market-tested levels from the prior day.
- Every field must be concrete, never "depending on …".

Respond ONLY as JSON, no markdown:
{
  "bull": {"probability": <int>, "thesis": "...", "entry": "...", "tp": "...", "sl": "...", "invalidation": "...", "catalyst": "..."},
  "base": {"probability": <int>, "thesis": "...", "entry": "...", "tp": "...", "sl": "...", "invalidation": "...", "catalyst": "..."},
  "bear": {"probability": <int>, "thesis": "...", "entry": "...", "tp": "...", "sl": "...", "invalidation": "...", "catalyst": "..."}
}`;

    type RawScenario = Omit<Scenario, 'probability'> & { probability: number };
    const raw = await generateJSON<{
      bull: RawScenario;
      base: RawScenario;
      bear: RawScenario;
    }>(prompt);

    // Normalise probabilities to sum to 100
    const total = raw.bull.probability + raw.base.probability + raw.bear.probability;
    const norm = (p: number) => (total > 0 ? Math.round((p / total) * 100) : 33);
    const bull = { ...raw.bull, probability: norm(raw.bull.probability) };
    const base = { ...raw.base, probability: norm(raw.base.probability) };
    const bear = { ...raw.bear, probability: 100 - bull.probability - base.probability };

    const result: ScenarioResponse = {
      bull,
      base,
      bear,
      generatedAt: Date.now(),
      levels: pivots
        ? {
            price,
            pivots: {
              pivot: pivots.pivot,
              r1: pivots.r1,
              r2: pivots.r2,
              s1: pivots.s1,
              s2: pivots.s2,
            },
          }
        : undefined,
    };

    cache.set(cacheKey, result, CACHE_TTL);
    return NextResponse.json(result);
  } catch (err) {
    console.error(`Scenarios error for ${symbol}:`, err);
    const stale = cache.get<ScenarioResponse>(cacheKey);
    if (stale) return NextResponse.json({ ...stale.data, stale: true });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to generate scenarios' },
      { status: 500 },
    );
  }
}
