import { NextResponse } from "next/server";
import { fetchDeltaTickers } from "@/lib/api/delta";
import { cached } from "@/lib/cache";

export async function GET() {
  try {
    const { data, fromCache } = await cached("delta:tickers", 30, fetchDeltaTickers);

    // Filter to crypto perpetual futures only (exclude xStock/equity tokens), sort by volume
    const perps = (data as any[])
      .filter((t: any) =>
        t.contract_type === "perpetual_futures" &&
        t.turnover_usd > 0 &&
        !(t.description || "").toLowerCase().includes("xstock")
      )
      .sort((a: any, b: any) => b.turnover_usd - a.turnover_usd);

    return NextResponse.json({ success: true, data: perps, cached: fromCache, timestamp: Date.now() });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, timestamp: Date.now() }, { status: 500 });
  }
}
