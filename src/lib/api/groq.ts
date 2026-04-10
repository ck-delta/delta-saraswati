import Groq from "groq-sdk";

let client: Groq | null = null;

function getClient(): Groq {
  if (!client) {
    client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return client;
}

export async function chatCompletion(messages: { role: "system" | "user" | "assistant"; content: string }[], stream = false) {
  const groq = getClient();
  if (stream) {
    return groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      stream: true,
      max_completion_tokens: 1024,
      temperature: 0.7,
    });
  }
  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages,
    max_completion_tokens: 1024,
    temperature: 0.7,
  });
  return response.choices[0]?.message?.content || "";
}

export async function generateNewsSummary(headlines: string[], marketContext: string): Promise<string> {
  const groq = getClient();
  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: "You are a crypto market analyst writing a daily briefing card. Simple English. Short punchy sentences. Data-rich." },
      { role: "user", content: `Write a market briefing from these headlines:\n\n${headlines.join("\n")}\n\n${marketContext ? `Live data: ${marketContext}` : ""}

Format EXACTLY like this. Follow every rule precisely:

**Market Pulse**
- **BTC** at **$72,100** ↓0.74% — rejected at $73,200 resistance [bearish]
- **ETH** slides to **$2,180** ↓1.2% — dragged by BTC weakness [bearish]

**Big Movers**
- **ZEC** surges to **$372** ↑16.8% — privacy coin rally [bullish]
- **XRP** edges to **$1.35** ↑2.1% — low volume breakout [neutral]

**Macro Watch**
- Japan classifies crypto as financial instruments — regulatory clarity [bullish]
- BlackRock's Bitcoin ETF sees **$269M** inflows — 5-week high [bullish]

**Signal**
_Watch the **$72,800–$73,200** zone closely. A clean break above means strong bullish continuation toward **$75K**. Failure here likely sends BTC back to retest **$70K** support. Volume is the key tell._

Rules:
- MUST include a price + direction arrow (↑ or ↓) + percentage on EVERY bullet
- MUST add [bullish], [neutral], or [bearish] tag at end of each bullet
- Use **bold** for token names, prices, and key numbers
- Signal section MUST be 2-3 sentences with specific price levels
- Use real prices from the live data. Never guess.
- No markdown headers (no # or ##). Use **bold** for section titles.
- Max 8-10 bullets total across all sections.` },
    ],
    max_completion_tokens: 512,
    temperature: 0.6,
  });
  return response.choices[0]?.message?.content || "Unable to generate summary.";
}

export async function scoreSentiment(headlines: { title: string }[]): Promise<{ title: string; sentiment: string; score: number }[]> {
  const groq = getClient();
  const headlineList = headlines.map((h, i) => `${i + 1}. ${h.title}`).join("\n");
  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: "Score crypto news sentiment. Return valid JSON only, no markdown." },
      { role: "user", content: `For each headline, return a JSON array with sentiment and score (0-100).\n\nHeadlines:\n${headlineList}\n\nFormat: [{"title":"...","sentiment":"positive"|"negative"|"neutral","score":0-100}]` },
    ],
    max_completion_tokens: 1024,
    temperature: 0.3,
  });
  try {
    const content = response.choices[0]?.message?.content || "[]";
    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return headlines.map((h) => ({ title: h.title, sentiment: "neutral", score: 50 }));
  }
}
