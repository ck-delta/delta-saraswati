// NOTE: rss-parser uses Node.js built-ins (http, https, stream).
// This module must only be imported from API routes / server components,
// never from client components or edge runtime.

import Parser from 'rss-parser';
import { cache } from '@/lib/cache';
import { RSS_FEEDS, CACHE_TTL } from '@/lib/constants';
import type { NewsItem } from '@/types/news';

// ---------------------------------------------------------------------------
// Parser singleton
// ---------------------------------------------------------------------------

const parser = new Parser({
  timeout: 10_000, // 10 s per feed
  headers: {
    Accept: 'application/rss+xml, application/xml, text/xml',
  },
  customFields: {
    item: [['media:content', 'mediaContent']],
  },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Deterministic unique ID from source + title. */
function makeId(source: string, title: string): string {
  const raw = `${source}:${title}`.toLowerCase().trim();
  // Simple hash — good enough for dedup within a session
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = ((hash << 5) - hash + raw.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
}

/** Very basic title similarity for dedup (normalized comparison). */
function normTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function deduplicateByTitle(items: NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const norm = normTitle(item.title);
    // Treat titles sharing the first 60 chars as duplicates
    const key = norm.slice(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Extract the best image URL from an RSS item.
 * Checks enclosure, media:content, and og-style fields.
 */
function extractImage(item: Record<string, unknown>): string | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = item as any;

  if (raw.enclosure?.url && typeof raw.enclosure.url === 'string') {
    return raw.enclosure.url;
  }
  if (raw.mediaContent?.$?.url && typeof raw.mediaContent.$.url === 'string') {
    return raw.mediaContent.$.url;
  }
  if (typeof raw['media:thumbnail']?.$?.url === 'string') {
    return raw['media:thumbnail'].$.url;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const CACHE_KEY = 'news:all';

/**
 * Fetch and aggregate news items from all configured RSS feeds.
 *
 * - Feeds are fetched in parallel; individual failures are isolated.
 * - Results are deduplicated by title similarity.
 * - Sorted newest-first, capped at 50 items.
 * - Cached for 5 minutes.
 */
export async function fetchAllNews(): Promise<NewsItem[]> {
  const cached = cache.get<NewsItem[]>(CACHE_KEY);
  if (cached?.fresh) return cached.data;

  const feedResults = await Promise.allSettled(
    RSS_FEEDS.map(async (feed) => {
      const parsed = await parser.parseURL(feed.url);
      return (parsed.items ?? []).map(
        (item): NewsItem => ({
          id: makeId(feed.name, item.title ?? ''),
          title: item.title ?? 'Untitled',
          description:
            item.contentSnippet?.slice(0, 280) ??
            item.content?.replace(/<[^>]*>/g, '').slice(0, 280) ??
            '',
          url: item.link ?? '',
          source: feed.name,
          publishedAt: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
          imageUrl: extractImage(item as unknown as Record<string, unknown>),
        }),
      );
    }),
  );

  // Collect successful feeds, log failures silently
  const allItems: NewsItem[] = [];
  for (const result of feedResults) {
    if (result.status === 'fulfilled') {
      allItems.push(...result.value);
    }
    // result.status === 'rejected' is silently skipped (per-feed isolation)
  }

  // Sort by date descending
  allItems.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );

  // Deduplicate and cap
  const unique = deduplicateByTitle(allItems).slice(0, 50);

  cache.set(CACHE_KEY, unique, CACHE_TTL.NEWS);
  return unique;
}
