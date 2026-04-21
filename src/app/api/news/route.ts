import { NextResponse } from 'next/server';
import { fetchAllNews } from '@/lib/api/news';
import { classifyNewsBatch } from '@/lib/ai/news-classifier';
import { cache } from '@/lib/cache';

export const runtime = 'nodejs';
export const revalidate = 300;

const CACHE_KEY = 'api:news-classified';
const CACHE_TTL = 5 * 60 * 1000;

export async function GET() {
  const cached = cache.get<{ news: ReturnType<typeof structuredClone>[]; count: number; timestamp: number }>(CACHE_KEY);
  if (cached?.fresh) {
    return NextResponse.json(cached.data);
  }

  try {
    const raw = await fetchAllNews();
    const top = raw.slice(0, 30);
    // Groq classifier — single batched call, falls back to raw items on failure.
    const classified = await classifyNewsBatch(top);
    // Include the untagged tail (items beyond 30) as-is for "Show more"
    const all = [...classified, ...raw.slice(30)];
    const payload = {
      news: all.slice(0, 50),
      count: Math.min(all.length, 50),
      timestamp: Date.now(),
    };
    cache.set(CACHE_KEY, payload, CACHE_TTL);
    return NextResponse.json(payload);
  } catch (err) {
    console.error('News route error:', err);
    if (cached) return NextResponse.json({ ...cached.data, stale: true });
    return NextResponse.json(
      { news: [], count: 0, timestamp: Date.now(), error: 'Failed to fetch news' },
      { status: 500 },
    );
  }
}
