// OpenRouter LLM client.
//
// - Task-based model blend: Sonnet for scenarios / chat / things-to-note,
//   Haiku for the higher-volume classifier / pulse-reasons / sentiment.
// - Zod-validated JSON outputs with one corrective retry on schema drift.
// - Per-call telemetry: {task, model, tokens_in, tokens_out, latency_ms, cost_usd}.
// - Universal "trader-desk voice" rules appended to every prompt.
//
// Callers should NEVER hardcode a model name — always go through a task alias.

import OpenAI from 'openai';
import { z } from 'zod';

const apiKey = process.env.OPENROUTER_API_KEY;

const openai = apiKey
  ? new OpenAI({
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'https://delta-saraswati-ck.vercel.app',
        'X-Title': 'Delta Saraswati',
      },
    })
  : null;

// ---------------------------------------------------------------------------
// Task → model dispatch
// ---------------------------------------------------------------------------

export type LLMTask =
  | 'chat'               // Streaming user-facing conversation
  | 'scenarios'          // /research Bull/Base/Bear with TP/SL/catalyst
  | 'things-to-note'     // Research-page 3-5 outstanding points
  | 'token-research'     // Token-scoped research chat
  | 'news-classifier'    // 3D tagging of news headlines
  | 'market-summary'     // Home-page AI Market Summary reasons
  | 'sentiment'          // Per-token sentiment score batch
  | 'daily-pulse-legacy';

const SONNET = 'anthropic/claude-3.5-sonnet';
const HAIKU = 'anthropic/claude-3-haiku';

const TASK_MODEL: Record<LLMTask, string> = {
  'chat':              SONNET,
  'scenarios':         SONNET,
  'things-to-note':    SONNET,
  'token-research':    SONNET,
  'news-classifier':   HAIKU,
  'market-summary':    HAIKU,
  'sentiment':         HAIKU,
  'daily-pulse-legacy': HAIKU,
};

// Pricing per 1M tokens as of Apr 2026 — rough, for cost logs only.
const MODEL_PRICING: Record<string, { in: number; out: number }> = {
  [SONNET]: { in: 3.00, out: 15.00 },
  [HAIKU]:  { in: 0.25, out: 1.25 },
};

export function modelForTask(task: LLMTask): string {
  return TASK_MODEL[task];
}

// ---------------------------------------------------------------------------
// Trader-desk voice rules — appended to every non-streaming prompt
// ---------------------------------------------------------------------------

export const VOICE_RULES = `
VOICE RULES (mandatory):
- Trader-desk tone. Punchy, specific, data-driven. No marketing fluff.
- NEVER use hedging words: "may", "could", "potentially", "possibly", "might", "perhaps", "suggests that".
- When stating a direction, commit. If unsure, say "mixed" or "no edge here" and explain why.
- Reference concrete levels, funding percentiles, OI shifts, named patterns, cited headlines.
- Keep every free-form sentence under 20 words unless the schema requires a longer one.
- Banned phrases: "market is mixed", "could go either way", "depending on conditions", "keep an eye on".
- Prefer active voice. Cite the catalyst.
`.trim();

// ---------------------------------------------------------------------------
// Telemetry
// ---------------------------------------------------------------------------

interface CallRecord {
  ts: number;
  task: LLMTask;
  model: string;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
  costUsd: number;
  ok: boolean;
}

const TELEMETRY_RING: CallRecord[] = [];
const TELEMETRY_LIMIT = 200;

function record(r: CallRecord) {
  TELEMETRY_RING.push(r);
  if (TELEMETRY_RING.length > TELEMETRY_LIMIT) TELEMETRY_RING.shift();
  // Console log for Vercel runtime visibility
  console.log(
    `[llm] task=${r.task} model=${r.model} in=${r.tokensIn} out=${r.tokensOut} ` +
    `lat=${r.latencyMs}ms cost=$${r.costUsd.toFixed(5)} ok=${r.ok}`,
  );
}

export function getTelemetrySummary(windowMs = 60 * 60_000) {
  const cutoff = Date.now() - windowMs;
  const recent = TELEMETRY_RING.filter((r) => r.ts >= cutoff);
  const byTask: Record<string, { calls: number; tokensIn: number; tokensOut: number; costUsd: number }> = {};
  for (const r of recent) {
    const t = byTask[r.task] ?? { calls: 0, tokensIn: 0, tokensOut: 0, costUsd: 0 };
    t.calls++;
    t.tokensIn += r.tokensIn;
    t.tokensOut += r.tokensOut;
    t.costUsd += r.costUsd;
    byTask[r.task] = t;
  }
  return {
    windowMs,
    totalCalls: recent.length,
    totalCostUsd: recent.reduce((s, r) => s + r.costUsd, 0),
    byTask,
  };
}

function estimateCost(model: string, tokensIn: number, tokensOut: number): number {
  const p = MODEL_PRICING[model];
  if (!p) return 0;
  return (tokensIn / 1_000_000) * p.in + (tokensOut / 1_000_000) * p.out;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// ---------------------------------------------------------------------------
// Mock fallback when API key absent
// ---------------------------------------------------------------------------

const MOCK_WARNING =
  '[Saraswati Mock Mode] No OPENROUTER_API_KEY set. This is a placeholder response. ' +
  'Set the OPENROUTER_API_KEY environment variable to enable live AI responses.';

function mockStream(content: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      const words = content.split(' ');
      for (const word of words) {
        const chunk = `data: ${JSON.stringify({ choices: [{ delta: { content: word + ' ' } }] })}\n\n`;
        controller.enqueue(encoder.encode(chunk));
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });
}

// ---------------------------------------------------------------------------
// Streaming chat
// ---------------------------------------------------------------------------

export interface StreamChatOptions {
  task?: LLMTask;
  temperature?: number;
  maxTokens?: number;
}

export async function streamChat(
  messages: LLMMessage[],
  systemPrompt: string,
  opts: StreamChatOptions = {},
): Promise<ReadableStream<Uint8Array>> {
  if (!openai) {
    return mockStream(`${MOCK_WARNING}\n\nYou asked: "${messages.at(-1)?.content ?? ''}"`);
  }

  const task = opts.task ?? 'chat';
  const model = modelForTask(task);
  const temperature = opts.temperature ?? 0.7;
  const maxTokens = opts.maxTokens ?? 2048;

  const fullMessages: LLMMessage[] = [
    { role: 'system', content: `${systemPrompt}\n\n${VOICE_RULES}` },
    ...messages,
  ];

  const t0 = Date.now();
  const stream = await openai.chat.completions.create({
    model,
    messages: fullMessages,
    stream: true,
    temperature,
    max_tokens: maxTokens,
  });

  const encoder = new TextEncoder();
  let tokensOut = 0;

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const content = chunk.choices?.[0]?.delta?.content;
          if (content) {
            tokensOut += Math.ceil(content.length / 4);
            const sseData = `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`;
            controller.enqueue(encoder.encode(sseData));
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
        const tokensIn = fullMessages.reduce((s, m) => s + Math.ceil(m.content.length / 4), 0);
        record({
          ts: Date.now(),
          task,
          model,
          tokensIn,
          tokensOut,
          latencyMs: Date.now() - t0,
          costUsd: estimateCost(model, tokensIn, tokensOut),
          ok: true,
        });
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Unknown streaming error';
        console.error('[llm] stream error:', errMsg);
        const errorData = `data: ${JSON.stringify({ error: errMsg })}\n\n`;
        controller.enqueue(encoder.encode(errorData));
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
        const tokensIn = fullMessages.reduce((s, m) => s + Math.ceil(m.content.length / 4), 0);
        record({
          ts: Date.now(), task, model, tokensIn, tokensOut,
          latencyMs: Date.now() - t0, costUsd: 0, ok: false,
        });
      }
    },
  });
}

// ---------------------------------------------------------------------------
// JSON generation with Zod validation + one corrective retry
// ---------------------------------------------------------------------------

export interface GenerateJSONOptions<T> {
  task?: LLMTask;
  temperature?: number;
  maxTokens?: number;
  /** Optional Zod schema. When provided, response is parsed + validated; on
   * failure a single "fix this JSON" retry is attempted. */
  schema?: z.ZodType<T>;
}

async function callJSON(prompt: string, model: string, temperature: number, maxTokens: number): Promise<{ raw: string; tokensIn: number; tokensOut: number }> {
  if (!openai) return { raw: '{}', tokensIn: 0, tokensOut: 0 };
  const completion = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content: `You are a structured data generator. Respond ONLY with valid JSON. No markdown. No explanation. No code fences.\n\n${VOICE_RULES}`,
      },
      { role: 'user', content: prompt },
    ],
    temperature,
    max_tokens: maxTokens,
    response_format: { type: 'json_object' },
  });
  const raw = completion.choices?.[0]?.message?.content ?? '{}';
  const tokensIn = completion.usage?.prompt_tokens ?? Math.ceil(prompt.length / 4);
  const tokensOut = completion.usage?.completion_tokens ?? Math.ceil(raw.length / 4);
  return { raw, tokensIn, tokensOut };
}

function stripFences(raw: string): string {
  const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  return match?.[1]?.trim() ?? raw.trim();
}

export async function generateJSON<T = unknown>(
  prompt: string,
  opts: GenerateJSONOptions<T> = {},
): Promise<T> {
  const task = opts.task ?? 'market-summary';
  const model = modelForTask(task);
  const temperature = opts.temperature ?? 0.3;
  const maxTokens = opts.maxTokens ?? 2048;

  if (!openai) {
    console.warn(MOCK_WARNING);
    return {} as T;
  }

  const t0 = Date.now();
  let tokensIn = 0;
  let tokensOut = 0;

  try {
    // First attempt
    const first = await callJSON(prompt, model, temperature, maxTokens);
    tokensIn += first.tokensIn;
    tokensOut += first.tokensOut;

    let parsed: unknown;
    try {
      parsed = JSON.parse(first.raw);
    } catch {
      parsed = JSON.parse(stripFences(first.raw));
    }

    if (opts.schema) {
      const result = opts.schema.safeParse(parsed);
      if (result.success) {
        record({ ts: Date.now(), task, model, tokensIn, tokensOut, latencyMs: Date.now() - t0, costUsd: estimateCost(model, tokensIn, tokensOut), ok: true });
        return result.data;
      }
      // One corrective retry: feed back the error
      const fixPrompt = `Your previous response failed schema validation with these errors:
${result.error.issues.slice(0, 5).map((e) => `- ${e.path.join('.')}: ${e.message}`).join('\n')}

Previous response:
${first.raw.slice(0, 2000)}

Now emit valid JSON matching the original request exactly.`;
      const retry = await callJSON(`${prompt}\n\n${fixPrompt}`, model, temperature, maxTokens);
      tokensIn += retry.tokensIn;
      tokensOut += retry.tokensOut;
      let retryParsed: unknown;
      try { retryParsed = JSON.parse(retry.raw); } catch { retryParsed = JSON.parse(stripFences(retry.raw)); }
      const retryResult = opts.schema.safeParse(retryParsed);
      if (retryResult.success) {
        record({ ts: Date.now(), task, model, tokensIn, tokensOut, latencyMs: Date.now() - t0, costUsd: estimateCost(model, tokensIn, tokensOut), ok: true });
        return retryResult.data;
      }
      record({ ts: Date.now(), task, model, tokensIn, tokensOut, latencyMs: Date.now() - t0, costUsd: estimateCost(model, tokensIn, tokensOut), ok: false });
      throw new Error(`LLM schema validation failed after retry: ${retryResult.error.message}`);
    }

    record({ ts: Date.now(), task, model, tokensIn, tokensOut, latencyMs: Date.now() - t0, costUsd: estimateCost(model, tokensIn, tokensOut), ok: true });
    return parsed as T;
  } catch (err) {
    record({ ts: Date.now(), task, model, tokensIn, tokensOut, latencyMs: Date.now() - t0, costUsd: 0, ok: false });
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Plain text generation
// ---------------------------------------------------------------------------

export async function generateText(
  prompt: string,
  opts: { task?: LLMTask; temperature?: number; maxTokens?: number } = {},
): Promise<string> {
  if (!openai) {
    console.warn(MOCK_WARNING);
    return MOCK_WARNING;
  }
  const task = opts.task ?? 'market-summary';
  const model = modelForTask(task);
  const temperature = opts.temperature ?? 0.7;
  const maxTokens = opts.maxTokens ?? 2048;

  const t0 = Date.now();
  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: VOICE_RULES },
      { role: 'user', content: prompt },
    ],
    temperature,
    max_tokens: maxTokens,
  });
  const raw = completion.choices?.[0]?.message?.content ?? '';
  const tokensIn = completion.usage?.prompt_tokens ?? Math.ceil(prompt.length / 4);
  const tokensOut = completion.usage?.completion_tokens ?? Math.ceil(raw.length / 4);
  record({ ts: Date.now(), task, model, tokensIn, tokensOut, latencyMs: Date.now() - t0, costUsd: estimateCost(model, tokensIn, tokensOut), ok: true });
  return raw;
}

// ---------------------------------------------------------------------------
// Zod schemas used by multiple callers
// ---------------------------------------------------------------------------

export const SCHEMAS = {
  newsClassification: z.object({
    items: z.array(z.object({
      index: z.number().int(),
      direction: z.enum(['bull', 'bear', 'neutral']),
      priceImpactTier: z.enum(['severe', 'major', 'moderate', 'minor', 'negligible']),
      breadthTier: z.enum(['systemic', 'cross-asset', 'sector-wide', 'token-specific']),
      forwardTier: z.enum(['regime-change', 'trend-confirmation', 'isolated', 'contrary']),
      affectedTokens: z.array(z.string()),
      impactScore: z.number(),
    })),
  }),

  scenarios: z.object({
    bull: z.object({
      probability: z.number(),
      thesis: z.string(),
      entry: z.string(),
      tp: z.string(),
      sl: z.string(),
      invalidation: z.string(),
      catalyst: z.string(),
    }),
    base: z.object({
      probability: z.number(),
      thesis: z.string(),
      entry: z.string(),
      tp: z.string(),
      sl: z.string(),
      invalidation: z.string(),
      catalyst: z.string(),
    }),
    bear: z.object({
      probability: z.number(),
      thesis: z.string(),
      entry: z.string(),
      tp: z.string(),
      sl: z.string(),
      invalidation: z.string(),
      catalyst: z.string(),
    }),
  }),

  thingsToNote: z.object({
    items: z.array(z.object({
      kind: z.enum(['technical', 'news', 'derivatives', 'pattern', 'options', 'divergence']),
      tone: z.enum(['bullish', 'bearish', 'neutral']),
      text: z.string(),
    })),
  }),

  marketSummaryReasons: z.object({
    items: z.array(z.object({
      index: z.number().int(),
      reason: z.string(),
      sentiment: z.enum(['BULLISH', 'NEUTRAL', 'BEARISH']),
    })),
  }),

  pulseOverview: z.object({
    summary: z.string(),
    highlights: z.array(z.string()),
  }),

  tokenSentiment: z.object({
    scores: z.array(z.object({
      symbol: z.string(),
      score: z.number(),
      label: z.string(),
      reasoning: z.string(),
    })),
  }),
} as const;
