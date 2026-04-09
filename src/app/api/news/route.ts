import { NextResponse } from 'next/server';
import { fetchAllNews } from '@/lib/api/news';

// rss-parser requires Node.js runtime (uses http, https, stream)
export const runtime = 'nodejs';
export const revalidate = 300; // 5 minutes

export async function GET() {
  try {
    const items = await fetchAllNews();

    return NextResponse.json({
      news: items.slice(0, 50),
      count: Math.min(items.length, 50),
      timestamp: Date.now(),
    });
  } catch (err) {
    console.error('News route error:', err);
    return NextResponse.json(
      { news: [], count: 0, timestamp: Date.now(), error: 'Failed to fetch news' },
      { status: 500 },
    );
  }
}
