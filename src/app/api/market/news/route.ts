import { NextResponse } from "next/server";
import { fetchNewsHeadlines } from "@/lib/api/news";
import { fetchDeltaTickers } from "@/lib/api/delta";
import { generateNewsSummary, scoreSentiment } from "@/lib/api/groq";
import { cached } from "@/lib/cache";

function buildMarketContext(tickers: any[]): string {
  const top = tickers
    .filter((t: any) => t.contract_type === "perpetual_futures" && t.turnover_usd > 0)
    .sort((a: any, b: any) => b.turnover_usd - a.turnover_usd)
    .slice(0, 10);

  if (top.length === 0) return "";

  const lines = top.map((t: any) => {
    const price = Number(t.mark_price || t.close || 0);
    const change = Number(t.mark_change_24h || 0);
    const volume = Number(t.turnover_usd || 0);
    const funding = Number(t.funding_rate || 0);
    const oi = Number(t.oi_value_usd || 0);
    return `${t.symbol}: $${price.toLocaleString()} (${change >= 0 ? "+" : ""}${change.toFixed(2)}%) | Vol: $${(volume / 1e6).toFixed(1)}M | Funding: ${(funding * 100).toFixed(4)}% | OI: $${(oi / 1e6).toFixed(1)}M`;
  });

  return `LIVE DELTA EXCHANGE DATA (top 10 by volume):\n${lines.join("\n")}`;
}

export async function GET() {
  try {
    // Fetch headlines + tickers in parallel (both cached)
    const [{ data: rawHeadlines }, { data: tickerData }] = await Promise.all([
      cached("news:headlines", 900, fetchNewsHeadlines),
      cached("delta:tickers", 30, fetchDeltaTickers),
    ]);

    const marketContext = buildMarketContext(tickerData as any[]);

    // Get AI summary + sentiment (cached 15min, aligned with headlines TTL)
    const { data: aiData } = await cached("ai:news", 900, async () => {
      const headlines = (rawHeadlines as any[]).slice(0, 15);
      const headlineTexts = headlines.map((h: any) => h.title);

      const [summary, sentiments] = await Promise.all([
        generateNewsSummary(headlineTexts, marketContext).catch(() => "AI summary temporarily unavailable."),
        scoreSentiment(headlines).catch(() => headlines.map((h: any) => ({ title: h.title, sentiment: "neutral", score: 50 }))),
      ]);

      return { summary, sentiments };
    });

    // Merge sentiment scores with headlines
    const ai = aiData as any;
    const enriched = (rawHeadlines as any[]).map((h: any) => {
      const match = (ai.sentiments as any[])?.find((s: any) => s.title === h.title);
      return {
        ...h,
        id: Buffer.from(h.title).toString("base64").slice(0, 12),
        sentiment: match?.sentiment || "neutral",
        sentimentScore: match?.score || 50,
      };
    });

    return NextResponse.json({
      success: true,
      data: { summary: ai.summary, generatedAt: new Date().toISOString(), headlines: enriched },
      cached: false,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, timestamp: Date.now() }, { status: 500 });
  }
}
