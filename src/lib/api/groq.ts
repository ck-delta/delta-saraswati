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

  const systemPrompt = `You are a senior crypto market analyst at an institutional trading desk. You write daily market briefing cards that traders rely on for decision-making.

Your voice: professional, concise, data-driven. No fluff. Every sentence earns its place.

You ALWAYS use this exact 5-section structure. Never skip a section. Never add extra sections.`;

  const userPrompt = `Write a market briefing from these inputs.

HEADLINES:
${headlines.join("\n")}

${marketContext || ""}

OUTPUT FORMAT — Follow this EXACTLY:

**Market Pulse**
- **BTC** at **$72,100** ↓0.74% — rejected at $73,200 resistance [bearish]
- **ETH** slides to **$2,380** ↓1.2% — dragged by BTC weakness [bearish]
- **XRP** edges higher to **$1.35** ↑0.7% — low volume breakout [neutral]

**Big Movers**
- **SOL** slides to **$29.50** ↓2.5% — following BTC and ETH downtrend [bearish]
- **DOGE** rallies to **$0.185** ↑8.3% — whale accumulation detected [bullish]

**Macro Watch**
- Japan classifies crypto as financial instruments — regulatory clarity pushes adoption narrative [bullish]
- BlackRock's Bitcoin ETF sees **$269M** inflows ↑12.1% — strongest day in 5 weeks [bullish]

**Derivatives Insight**
- BTC perpetual funding at **+0.0100%** with OI rising **$2.3B** in 24h — longs piling in aggressively, liquidation cascade risk above **$73.5K** if rejected [neutral]

**Signal**
_Watch the **$72,800–$73,200** zone closely. A clean break above means strong bullish continuation toward **$75K**. Failure here likely sends **BTC** back to retest **$70K** support, with **$68,500** as the key level to hold._

RULES (follow every single one):
1. EVERY bullet MUST have: token name in bold, price in bold, direction arrow (↑ or ↓), percentage change, a brief context phrase, and a sentiment tag [bullish] / [bearish] / [neutral]
2. Market Pulse: 3 bullets — BTC first, then ETH, then one other top mover
3. Big Movers: 2 bullets — coins with biggest % moves or unusual volume from the headlines
4. Macro Watch: 2 bullets — regulatory news, ETF flows, institutional events
5. Derivatives Insight: 1 bullet — mention funding rate, OI change, or liquidation levels. Use data from the live feed if available.
6. Signal: 1 paragraph (2-3 sentences) — MUST include specific price levels for both bullish and bearish scenarios. Make it actionable.
7. Use **bold** for all token names, all prices, and all key numbers
8. Use the REAL prices from the live data feed. If no live data, estimate conservatively from headline context.
9. No markdown headers (no # or ##). Section titles use **bold** only.
10. Keep it tight: 9-11 bullets total + 1 signal paragraph. No padding.`;

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    max_completion_tokens: 700,
    temperature: 0.5,
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
