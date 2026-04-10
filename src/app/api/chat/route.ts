import { NextRequest } from "next/server";
import Groq from "groq-sdk";

// Fetch live market snapshot for context injection
async function getMarketContext(): Promise<string> {
  try {
    const base = process.env.NEXT_PUBLIC_DELTA_API_BASE || "https://api.india.delta.exchange/v2";
    const res = await fetch(`${base}/tickers`, { next: { revalidate: 30 } });
    const json = await res.json();
    if (!json.success) return "";

    const perps = json.result
      .filter((t: any) => t.contract_type === "perpetual_futures" && t.turnover_usd > 10000)
      .sort((a: any, b: any) => b.turnover_usd - a.turnover_usd)
      .slice(0, 15);

    const lines = perps.map((t: any) => {
      const sym = t.underlying_asset_symbol || t.symbol;
      const price = Number(t.close).toLocaleString("en-US", { maximumFractionDigits: 2 });
      const change = Number(t.mark_change_24h).toFixed(2);
      const vol = Number(t.turnover_usd);
      const volStr = vol >= 1e9 ? `$${(vol/1e9).toFixed(1)}B` : vol >= 1e6 ? `$${(vol/1e6).toFixed(0)}M` : `$${(vol/1e3).toFixed(0)}K`;
      const fr = Number(t.funding_rate).toFixed(4);
      return `${sym}: $${price} (${Number(change) >= 0 ? '+' : ''}${change}%) vol=${volStr} funding=${fr}%`;
    });

    return `LIVE DELTA EXCHANGE DATA (right now):\n${lines.join("\n")}`;
  } catch {
    return "";
  }
}

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    // Get live data
    const marketContext = await getMarketContext();

    const systemMessage = {
      role: "system" as const,
      content: `You are Delta Saraswati, a friendly AI crypto assistant for Delta Exchange India.

${marketContext}

Style rules:
- Write in simple English. Short sentences. Max 12 words per sentence.
- Use bullet points with dashes (- not •).
- **Bold** token names and key numbers.
- Start each answer with a one-line summary. Then give 3-5 bullet points.
- ALWAYS end with a "Takeaway:" section that is 2-3 full sentences. This is the most important part. Give your honest opinion on what the data means, what to watch, and what action makes sense. Make it insightful and useful — not generic.
- Use the LIVE DATA above. Quote real prices and percentages from it.
- Never guess prices — use the data. If a token isn't in the data, say so.
- Format tokens as: **BTC** — $72,100 (+1.5%)
- Never use markdown headers (no # or ##).
- Never say "not financial advice" or "as of my last update".
- Never repeat the user's question. Jump straight to the answer.
- Keep bullet section short (under 80 words). Spend more words on the Takeaway.`,
    };

    const stream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [systemMessage, ...messages],
      stream: true,
      max_completion_tokens: 512,
      temperature: 0.6,
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
