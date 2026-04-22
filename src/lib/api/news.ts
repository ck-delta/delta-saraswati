// NOTE: rss-parser uses Node.js built-ins (http, https, stream).
// This module must only be imported from API routes / server components,
// never from client components or edge runtime.

import Parser from 'rss-parser';
import { cache } from '@/lib/cache';
import { RSS_FEEDS, CACHE_TTL } from '@/lib/constants';
import { classifyNewsBatch } from '@/lib/ai/news-classifier';
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

/**
 * Collapse near-duplicate titles into a single item, but preserve the count
 * of corroborating sources. Keeps the earliest-appearing (usually most
 * authoritative) version and annotates it with `corroborations` + source list.
 */
function collapseDuplicatesWithCorroboration(items: NewsItem[]): NewsItem[] {
  const groups = new Map<string, NewsItem[]>();
  for (const item of items) {
    const key = normTitle(item.title).slice(0, 60);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }
  const out: NewsItem[] = [];
  for (const group of groups.values()) {
    // The canonical item = the first one (already sorted newest-first upstream).
    const canonical = group[0];
    if (group.length === 1) {
      out.push(canonical);
    } else {
      const others = group.slice(1);
      out.push({
        ...canonical,
        corroborations: others.length,
        corroboratingSources: Array.from(
          new Set(others.map((o) => o.source).filter((s) => s !== canonical.source)),
        ).slice(0, 5),
      });
    }
  }
  return out;
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
      return (parsed.items ?? []).map((item): NewsItem => {
        const cleanContent = item.content?.replace(/<[^>]*>/g, '') ?? '';
        const description =
          item.contentSnippet?.slice(0, 280) ?? cleanContent.slice(0, 280) ?? '';
        const body = (item.contentSnippet ?? cleanContent ?? '').slice(0, 500);
        return {
          id: makeId(feed.name, item.title ?? ''),
          title: item.title ?? 'Untitled',
          description,
          body,
          url: item.link ?? '',
          source: feed.name,
          sourceDomain: feed.domain,
          publishedAt: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
          imageUrl: extractImage(item as unknown as Record<string, unknown>),
        };
      });
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

  // Collapse duplicates but remember how many sources carried each story
  const unique = collapseDuplicatesWithCorroboration(allItems).slice(0, 50);

  cache.set(CACHE_KEY, unique, CACHE_TTL.NEWS);
  return unique;
}

// ---------------------------------------------------------------------------
// Classified news — shared across all endpoints
// ---------------------------------------------------------------------------

const CLASSIFIED_CACHE_KEY = 'news:classified';
const CLASSIFIED_TTL_MS = 5 * 60 * 1000;

/**
 * Returns news items with Groq classifier tags applied (sentiment, affected
 * tokens, priceImpactTier, breadthTier, forwardTier, impactScore) plus
 * corroboration counts and storm flags.
 *
 * This is the single source of truth for classified news across the app:
 * - /api/news (the feed displayed on the home page)
 * - /api/ai-signal/[symbol] (per-token composite)
 * - /api/ai/daily-pulse (AI Market Summary)
 * - /api/market-mood (storm detector)
 *
 * Cached for 5 minutes so at most one Groq classification call runs per
 * window regardless of how many endpoints consume it.
 */
export async function getClassifiedNews(): Promise<NewsItem[]> {
  const cached = cache.get<NewsItem[]>(CLASSIFIED_CACHE_KEY);
  if (cached?.fresh) return cached.data;

  const raw = await fetchAllNews();
  const top = raw.slice(0, 30);
  let classified: NewsItem[] = top;
  let didClassify = false;
  try {
    classified = await classifyNewsBatch(top);
    didClassify = classified.some((x) => x.priceImpactTier);
  } catch (err) {
    console.error('classifyNewsBatch failed in getClassifiedNews:', err);
  }
  const full = [...classified, ...raw.slice(30)];
  // Only cache a SUCCESSFUL classification — never the raw-fallback. If the
  // LLM call failed (temporary provider issue, schema drift, rate limit), we
  // want the next request to retry immediately rather than serve untagged
  // items from cache for 5 minutes.
  if (didClassify) {
    cache.set(CLASSIFIED_CACHE_KEY, full, CLASSIFIED_TTL_MS);
  }
  return full;
}
