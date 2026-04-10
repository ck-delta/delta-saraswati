import { NextResponse } from "next/server";
import { fetchDeltaProducts } from "@/lib/api/delta";
import { cached } from "@/lib/cache";

export async function GET() {
  try {
    const { data, fromCache } = await cached("delta:products", 3600, fetchDeltaProducts);
    const perps = (data as any[]).filter((p: any) => p.contract_type === "perpetual_futures" && p.state === "live");
    return NextResponse.json({ success: true, data: perps, cached: fromCache, timestamp: Date.now() });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, timestamp: Date.now() }, { status: 500 });
  }
}
