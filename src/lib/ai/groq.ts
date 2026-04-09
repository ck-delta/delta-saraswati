import Groq from 'groq-sdk';
import { GROQ_MODEL } from '@/lib/constants';

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

const apiKey = process.env.GROQ_API_KEY;

const groq = apiKey
  ? new Groq({ apiKey })
  : null;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// ---------------------------------------------------------------------------
// Mock fallbacks (when no API key is configured)
// ---------------------------------------------------------------------------

const MOCK_WARNING =
  '[Saraswati Mock Mode] No GROQ_API_KEY set. This is a placeholder response. ' +
  'Set the GROQ_API_KEY environment variable to enable live AI responses.';

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
// Public API
// ---------------------------------------------------------------------------

/**
 * Stream a chat completion as a ReadableStream in SSE format.
 *
 * The returned stream can be used directly as a Response body:
 *   return new Response(streamChat(messages, systemPrompt), {
 *     headers: { 'Content-Type': 'text/event-stream' }
 *   });
 */
export async function streamChat(
  messages: GroqMessage[],
  systemPrompt: string,
): Promise<ReadableStream<Uint8Array>> {
  if (!groq) {
    return mockStream(`${MOCK_WARNING}\n\nYou asked: "${messages.at(-1)?.content ?? ''}"`);
  }

  const fullMessages: GroqMessage[] = [
    { role: 'system', content: systemPrompt },
    ...messages,
  ];

  const stream = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: fullMessages,
    stream: true,
    temperature: 0.7,
    max_tokens: 2048,
  });

  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const content = chunk.choices?.[0]?.delta?.content;
          if (content) {
            const sseData = `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`;
            controller.enqueue(encoder.encode(sseData));
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Unknown streaming error';
        const errorData = `data: ${JSON.stringify({ error: errMsg })}\n\n`;
        controller.enqueue(encoder.encode(errorData));
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      }
    },
  });
}

/**
 * Non-streaming completion that expects a JSON response.
 * Parses the AI output as JSON and returns it.
 *
 * @throws if the AI response is not valid JSON.
 */
export async function generateJSON<T = unknown>(prompt: string): Promise<T> {
  if (!groq) {
    console.warn(MOCK_WARNING);
    return {} as T;
  }

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      {
        role: 'system',
        content:
          'You are a structured data generator. Respond ONLY with valid JSON, no markdown, no explanation.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.3,
    max_tokens: 2048,
    response_format: { type: 'json_object' },
  });

  const raw = completion.choices?.[0]?.message?.content ?? '{}';

  try {
    return JSON.parse(raw) as T;
  } catch {
    // Attempt to extract JSON from markdown code fences
    const match = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match?.[1]) {
      return JSON.parse(match[1].trim()) as T;
    }
    throw new Error(`Failed to parse Groq JSON response: ${raw.slice(0, 200)}`);
  }
}

/**
 * Non-streaming completion that returns a plain text string.
 */
export async function generateText(prompt: string): Promise<string> {
  if (!groq) {
    console.warn(MOCK_WARNING);
    return MOCK_WARNING;
  }

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 2048,
  });

  return completion.choices?.[0]?.message?.content ?? '';
}
