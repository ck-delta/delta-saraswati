import { NextResponse } from "next/server";
import { fetchFearGreed } from "@/lib/api/fear-greed";
import { cached } from "@/lib/cache";

export async function GET() {
  try {
    const { data, fromCache } = await cached("fg:index", 3600, fetchFearGreed);
    return NextResponse.json({ success: true, data, cached: fromCache, timestamp: Date.now() });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, timestamp: Date.now() }, { status: 500 });
  }
}
