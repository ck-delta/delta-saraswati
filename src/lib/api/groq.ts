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

  const systemPrompt = `You are the head crypto strategist at a top-tier derivatives trading desk. You write daily institutional briefing cards that portfolio managers and prop traders rely on for positioning decisions.

Your voice: sharp, confident, data-driven. Every word is earned. No filler. You sound like a Bloomberg terminal analyst, not a crypto influencer.

CRITICAL CONSTRAINT: You may ONLY mention coins that appear in the LIVE DELTA EXCHANGE DATA feed provided below. If a coin is mentioned in headlines but does NOT appear in the live data, you must substitute with a coin that DOES appear in the live data. The top coins on Delta Exchange are typically: BTC, ETH, XRP, SOL, DOGE, PAXG, ADA, AVAX, LINK, BNB.

You ALWAYS use this exact 5-section structure. Never skip a section. Never add extra sections. Never reorder sections.`;

  const userPrompt = `Write an institutional-grade market briefing from these inputs.

HEADLINES:
${headlines.join("\n")}

${marketContext || ""}

OUTPUT FORMAT — Follow this structure EXACTLY. Every bullet must be a single concise line.

**Market Pulse**
- **BTC** holds **$71,750** ↓0.6% — testing **$73K** resistance, third rejection this week [bearish]
- **ETH** consolidates at **$2,190** ↑0.3% — range-bound between **$2,150–$2,250** [neutral]
- **XRP** at **$1.34** ↑1.1% — edging higher on low volume, needs **$1.40** for confirmation [neutral]

**Big Movers**
- **DOGE** rallies to **$0.185** ↑8.3% — whale accumulation on-chain, funding turning positive [bullish]
- **PAXG** steady at **$4,730** ↑0.5% — safe-haven bid as equity markets wobble [bullish]

**Macro Watch**
- Japan classifies crypto as financial instruments — regulatory clarity pushes institutional adoption narrative [bullish]
- BlackRock Bitcoin ETF sees **$269M** inflows ↑12% — strongest single day in 5 weeks, signaling renewed institutional appetite [bullish]

**Derivatives Insight**
- **BTC** perpetual funding at **+0.0100%** with OI at **$47M** — longs dominant but not overcrowded; watch for liquidation cascade above **$73.5K** if momentum stalls [neutral]

**Signal**
_Watch the **$71,500–$73,000** range on **BTC** closely. A decisive break above **$73,000** with volume confirms bullish continuation toward **$75K**. Failure at this level likely sends price back to **$70K** support — **$68,500** is the critical level bulls must defend. Key tell: funding rate + ETF flow direction._

RULES (follow ALL of them precisely):
1. EVERY bullet MUST contain: **bold token name**, **bold price**, direction arrow (↑ or ↓), percentage change, a brief context phrase (max 12 words), and a sentiment tag [bullish] / [bearish] / [neutral]
2. Market Pulse: exactly 3 bullets — always BTC first, then ETH, then one other top-volume coin from the live data
3. Big Movers: exactly 2 bullets — coins with biggest absolute % change from the live data feed. MUST be coins listed in the LIVE DELTA EXCHANGE DATA above.
4. Macro Watch: exactly 2 bullets — regulatory, ETF, or institutional news from the headlines. Include specific numbers where available.
5. Derivatives Insight: exactly 1 bullet — MUST reference funding rate AND open interest from the live data. Mention liquidation risk levels.
6. Signal: exactly 1 paragraph (2-3 sentences) wrapped in _italics_. MUST include: a specific price zone to watch, a bullish target, a bearish risk level, and what catalyst to monitor. Focus on whichever coin has the strongest actionable setup.
7. Use **bold** for ALL token names, ALL prices, and ALL key numbers (percentages, dollar amounts)
8. Use REAL prices from the live data feed. NEVER invent or guess prices.
9. No markdown headers (no # or ##). Section titles use **bold** only.
10. Total output: exactly 9 bullets + 1 signal paragraph. No extra text, no disclaimers, no padding.`;

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
