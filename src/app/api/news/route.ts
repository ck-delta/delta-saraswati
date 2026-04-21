import { NextResponse } from 'next/server';
import { getClassifiedNews } from '@/lib/api/news';

export const runtime = 'nodejs';
export const revalidate = 300;

export async function GET() {
  try {
    const items = await getClassifiedNews();
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
