import { NextResponse } from 'next/server';
import { generateJSON } from '@/lib/ai/groq';
import { cache } from '@/lib/cache';

export const runtime = 'nodejs';
export const revalidate = 900;

interface ScenarioResponse {
  bull: { probability: number; thesis: string; invalidation: string };
  base: { probability: number; thesis: string; invalidation: string };
  bear: { probability: number; thesis: string; invalidation: string };
  generatedAt: number;
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
    // Fetch AI Signal to condition the prompt
    const origin = new URL(req.url).origin;
    const sigRes = await fetch(`${origin}/api/ai-signal/${symbol}`);
    if (!sigRes.ok) {
      return NextResponse.json(
        { error: 'AI Signal unavailable' },
        { status: 503 },
      );
    }
    const sig = await sigRes.json();

    const prompt = `You are Saraswati's scenario engine for ${symbol}.
Given the AI Signal breakdown below, produce three probability-weighted scenarios
(Bull / Base / Bear) that must sum to 100%. Each scenario includes:
- probability (integer 0-100)
- thesis: 1-2 sentences, specific and data-driven (mention key levels or catalysts)
- invalidation: a concrete price level or event that would disprove the thesis

Tie probabilities to the signal breakdown:
- Composite: ${sig.composite.score}/10 (${sig.composite.label}), confidence ${sig.composite.confidence}%, divergent=${sig.composite.divergent}
- News: ${sig.composite.news.score}/10 (${sig.composite.news.label})
- Technical: ${sig.composite.technical.score}/10 (${sig.composite.technical.label}, ${sig.composite.technical.regime})
- Derivatives: ${sig.composite.derivatives.score}/10 (${sig.composite.derivatives.label}, ${sig.composite.derivatives.positioning})

Current price context from the Technical breakdown:
${sig.composite.reasoning.join('\n')}

Respond ONLY as valid JSON with this exact shape (no prose, no markdown):
{
  "bull": {"probability": <int>, "thesis": "...", "invalidation": "..."},
  "base": {"probability": <int>, "thesis": "...", "invalidation": "..."},
  "bear": {"probability": <int>, "thesis": "...", "invalidation": "..."}
}

Rules:
- probabilities sum to 100
- higher Bull probability when composite ≥ 6, higher Bear when ≤ 4
- when divergent=true, balance Bull/Bear closer (reduce conviction)
- invalidation must be specific (price level or named event), not vague`;

    const raw = await generateJSON<{
      bull: { probability: number; thesis: string; invalidation: string };
      base: { probability: number; thesis: string; invalidation: string };
      bear: { probability: number; thesis: string; invalidation: string };
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
