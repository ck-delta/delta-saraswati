import Parser from "rss-parser";

const parser = new Parser({ timeout: 10000 });

const RSS_FEEDS = [
  { url: "https://www.coindesk.com/arc/outboundfeeds/rss/", source: "CoinDesk" },
  { url: "https://cointelegraph.com/rss", source: "CoinTelegraph" },
  { url: "https://decrypt.co/feed", source: "Decrypt" },
];

export interface RawHeadline {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
}

export async function fetchNewsHeadlines(): Promise<RawHeadline[]> {
  const results: RawHeadline[] = [];
  const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24h ago

  const feeds = await Promise.allSettled(
    RSS_FEEDS.map(async (feed) => {
      try {
        const parsed = await parser.parseURL(feed.url);
        return parsed.items
          .filter((item) => item.title && item.link)
          .map((item) => ({
            title: item.title!,
            source: feed.source,
            url: item.link!,
            publishedAt: item.isoDate || item.pubDate || new Date().toISOString(),
          }))
          .filter((item) => new Date(item.publishedAt).getTime() > cutoff);
      } catch {
        console.warn(`RSS fetch failed for ${feed.source}`);
        return [];
      }
    })
  );

  for (const result of feeds) {
    if (result.status === "fulfilled") {
      results.push(...result.value);
    }
  }

  // Deduplicate by title similarity, sort by date
  const seen = new Set<string>();
  return results
    .filter((item) => {
      const key = item.title.toLowerCase().slice(0, 50);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 20);
}
