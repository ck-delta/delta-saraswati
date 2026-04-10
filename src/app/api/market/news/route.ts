import { NextResponse } from "next/server";
import { fetchNewsHeadlines } from "@/lib/api/news";
import { generateNewsSummary, scoreSentiment } from "@/lib/api/groq";
import { cached } from "@/lib/cache";

export async function GET() {
  try {
    // Fetch headlines (cached 15min)
    const { data: rawHeadlines } = await cached("news:headlines", 900, fetchNewsHeadlines);

    // Get AI summary + sentiment (cached 1h)
    const { data: aiData } = await cached("ai:news", 3600, async () => {
      const headlines = (rawHeadlines as any[]).slice(0, 15);
      const headlineTexts = headlines.map((h: any) => h.title);

      const [summary, sentiments] = await Promise.all([
        generateNewsSummary(headlineTexts, "").catch(() => "AI summary temporarily unavailable."),
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
