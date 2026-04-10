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
      { role: "system", content: "You are a crypto market analyst writing a daily briefing. Simple English. Short punchy sentences. Friendly but professional." },
      { role: "user", content: `Write a market briefing from these headlines:\n\n${headlines.join("\n")}\n\n${marketContext ? `Context: ${marketContext}` : ""}

Format EXACTLY like this (use these exact section headers):

**Market Pulse**
- One bullet about BTC price and trend
- One bullet about ETH and altcoins

**Big Movers**
- Name 2-3 tokens that moved the most and why

**Macro Watch**
- Any FED, regulation, or geopolitical news affecting crypto
- Skip this section if nothing relevant

**Signal**
_One sentence takeaway — what to watch next._

Rules:
- Each bullet is ONE short sentence. Max 15 words per bullet.
- Use **bold** for token names and numbers
- Use _italic_ for the signal takeaway
- No markdown headers (no # or ##). Use **bold** for section titles.
- Total length: max 8-10 bullets.` },
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
