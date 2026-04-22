import { NextResponse } from 'next/server';
import { generateJSON, SCHEMAS } from '@/lib/ai/llm';
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

    const prompt = `You are Saraswati's senior scenario strategist for ${symbol}. Your output lands on a trading desk — every level must be executable, every catalyst must be concrete.

Current price: $${price?.toLocaleString()}

${pivotBlock}

SIGNAL CONTEXT:
- Composite: ${sig.composite.score}/10 (${sig.composite.label}), confidence ${sig.composite.confidence}%, divergent=${sig.composite.divergent}
- News: ${sig.composite.news.score}/10 (${sig.composite.news.label})
- Technical: ${sig.composite.technical.score}/10 (${sig.composite.technical.label}, ${sig.composite.technical.regime})
- Derivatives: ${sig.composite.derivatives.score}/10 (${sig.composite.derivatives.label}, ${sig.composite.derivatives.positioning})

TOP REASONING:
${(sig.composite.reasoning || []).join('\n')}

===== THINK STEP BY STEP (do not emit these steps, use them to plan) =====

STEP 1 — IDENTIFY KEY LEVELS
Look at the pivot table above. Which levels are the nearest above and below current price?
- Nearest resistance: pick from R1 / R2 / R3 or a round number above price.
- Nearest support: pick from S1 / S2 / S3 or a round number below price.

STEP 2 — SCENARIO MAPPING
- Bull: break of nearest resistance with confirming catalyst → target the next level up.
- Base: price holds between S1 and R1 → range-trading plan (enter near S1, TP at R1, SL below S1).
- Bear: break of nearest support with confirming catalyst → target the next level down.

STEP 3 — WEIGHT PROBABILITIES
Use composite + derivatives positioning to bias probabilities:
- composite ≥ 6 AND positioning = Long Buildup → Bull 55-70, Base 20-30, Bear 10-20
- composite ≤ 4 AND positioning = Short Buildup → Bear 55-70, Base 20-30, Bull 10-20
- composite 4-6 OR divergent=true → keep closer to 33/34/33
- If News strongly disagrees with Technical (divergence), narrow the spread.

STEP 4 — WRITE EACH SCENARIO
For each: probability, thesis, entry, tp, sl, invalidation, catalyst.

===== FIELD RULES =====
- probability: integer; all three sum to exactly 100.
- thesis: 1-2 sentences, trader voice. Name the level or catalyst that drives it.
- entry: "Current market" or a specific $price. For Base, describe a range entry.
- tp: concrete level with a label when possible — "$78,400 (R1)" or "$80,000 (round)". Bull TP must be above price; Bear TP must be below.
- sl: concrete level with a label. Bull SL below entry; Bear SL above entry.
- invalidation: the price or event that kills this scenario. Format: "Daily close above/below $X" or "ETF approval headline".
- catalyst: what must happen to trigger/activate. Format: "Break of R1 on rising volume" / "FOMC dovish surprise" / "Bearish engulfing on 4h + OI drop".

===== STRICT CONSTRAINTS =====
- Probabilities sum to EXACTLY 100.
- Prefer round numbers within 0.5% of a pivot ("R1 $78,416" → "$78,400 (R1)").
- Never write "depending on …", "could go either way", "keep an eye on".
- Every field must be concrete and executable.

Respond ONLY as valid JSON matching this exact shape (no markdown, no comments):
{
  "bull": {"probability": <int>, "thesis": "...", "entry": "...", "tp": "...", "sl": "...", "invalidation": "...", "catalyst": "..."},
  "base": {"probability": <int>, "thesis": "...", "entry": "...", "tp": "...", "sl": "...", "invalidation": "...", "catalyst": "..."},
  "bear": {"probability": <int>, "thesis": "...", "entry": "...", "tp": "...", "sl": "...", "invalidation": "...", "catalyst": "..."}
}`;

    const raw = await generateJSON(prompt, {
      task: 'scenarios',
      schema: SCHEMAS.scenarios,
      temperature: 0.4,
      maxTokens: 1500,
    });

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
