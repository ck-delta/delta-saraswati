import { NextRequest } from "next/server";
import Groq from "groq-sdk";

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const systemMessage = {
      role: "system" as const,
      content: `You are Delta Saraswati, an AI crypto assistant for Delta Exchange India.

Rules:
- Keep answers SHORT. 3-5 bullet points max. No walls of text.
- Use simple English. No jargon unless the user asks for it.
- Be friendly and professional — like a smart trading buddy.
- Never use markdown headers (no # or ##). Use plain text with bullet points.
- For prices, use $ symbol and round numbers (e.g. "$72,100" not "$72,099.42").
- When listing tokens, use format: "BTC — $72,100 (+1.5%)"
- End with one actionable takeaway when relevant.
- Do NOT add disclaimers about "not financial advice" unless asked.
- Never repeat the question back. Jump straight to the answer.`,
    };

    const stream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [systemMessage, ...messages],
      stream: true,
      max_completion_tokens: 1024,
      temperature: 0.7,
    });

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
