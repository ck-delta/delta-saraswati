# SEO Strategy — Delta Saraswati

## Overview

Delta Saraswati targets organic search visibility for crypto trading research queries. The strategy combines Next.js 16 technical SEO capabilities with AI-generated content that refreshes frequently, providing search engines with unique, regularly-updated material that static dashboards cannot match.

**Production URL:** https://delta-saraswati.vercel.app

---

## Target Keywords

### Primary Keywords

| Keyword                    | Intent        | Monthly Volume (est.) |
| -------------------------- | ------------- | --------------------- |
| crypto trading dashboard   | Navigational  | High                  |
| AI crypto research         | Informational | Medium                |
| crypto perpetuals dashboard| Navigational  | Medium                |

### Secondary Keywords

| Keyword                        | Intent        |
| ------------------------------ | ------------- |
| Delta Exchange dashboard       | Branded       |
| crypto sentiment analysis      | Informational |
| crypto fear and greed index    | Informational |
| AI market summary crypto       | Informational |
| perpetual futures analytics    | Informational |

### Long-Tail Keywords

- "AI-powered crypto trading research tool"
- "real-time crypto sentiment dashboard"
- "Delta Exchange India perpetuals tracker"
- "crypto derivatives research dashboard"
- "AI crypto news summary and analysis"
- "bitcoin perpetual futures technical indicators"

---

## On-Page SEO

### Per-Route Metadata

Each route in the Next.js app exports a `metadata` object or uses `generateMetadata()` for dynamic values.

| Route         | Title                                              | Description Focus                        |
| ------------- | -------------------------------------------------- | ---------------------------------------- |
| `/`           | Delta Saraswati — AI Crypto Trading Dashboard      | Primary landing; covers all features     |
| `/chat`       | AI Chat — Delta Saraswati                          | Interactive research assistant            |

### Canonical URLs

- Every page specifies a canonical URL via the `metadataBase` and `alternates.canonical` fields in the Next.js metadata API.
- This prevents duplicate content issues from query parameters, trailing slashes, or deployment preview URLs.

### Heading Hierarchy

- Each page contains exactly one `<h1>` element reflecting the page title.
- Section headings follow a strict `h1 > h2 > h3` hierarchy without skipping levels.
- Indicator groups, news sections, and chart panels use semantic `<h2>` and `<h3>` tags rather than styled `<div>` elements.

---

## Technical SEO

### Sitemap Generation

Next.js 16 supports `sitemap.ts` in the app directory for dynamic sitemap generation.

```
/src/app/sitemap.ts
```

The sitemap includes all public routes with `lastModified` timestamps and `changeFrequency` hints:

- `/` — `changeFrequency: "hourly"` (dashboard data refreshes continuously)
- Static pages — `changeFrequency: "monthly"`

### Robots Configuration

```
/src/app/robots.ts
```

- Allows all crawlers on public routes.
- Disallows `/api/*` to prevent indexing of JSON API endpoints.
- References the sitemap URL for crawler discovery.

### JSON-LD Structured Data

The application injects `WebApplication` schema markup via JSON-LD in the root layout:

```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Delta Saraswati",
  "url": "https://delta-saraswati.vercel.app",
  "applicationCategory": "FinanceApplication",
  "operatingSystem": "Web",
  "description": "AI-powered crypto perpetuals trading research dashboard",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }
}
```

This enables rich results in Google Search for software and finance queries.

---

## Open Graph and Social Cards

Refer to `OG-TAGS.md` for the full Open Graph and Twitter Card implementation.

**Summary:**

- `og:title`, `og:description`, `og:image`, and `og:url` are set on every page.
- Twitter Card type is `summary_large_image` for maximum visual presence in social feeds.
- OG images are statically generated or served from `/public/og/` to ensure fast loading by social platform crawlers.
- All meta tags are defined via the Next.js metadata API for server-side rendering, ensuring crawlers receive complete tags without JavaScript execution.

---

## Performance SEO

Search engines use Core Web Vitals as ranking signals. The following optimizations directly impact both performance and search ranking.

### Font Loading

- All custom fonts use `display: swap` to prevent invisible text during load.
- Font files are self-hosted via `next/font` to avoid third-party network requests.

### Dynamic Imports and Code Splitting

- Heavy chart components (TradingView, sparklines) are loaded via `next/dynamic` with `ssr: false` where appropriate.
- This reduces the initial JavaScript bundle and improves First Contentful Paint (FCP).

### Code Splitting

- Next.js 16 automatic code splitting ensures each route loads only its required JavaScript.
- Shared dependencies (React, Tailwind runtime) are extracted into common chunks.

### Vercel Edge Deployment

- The application is deployed on Vercel with Edge Network distribution.
- Static assets are served from the nearest edge node, reducing Time to First Byte (TTFB) globally.
- API routes leverage serverless functions for on-demand computation without long cold-start penalties.

### Image Optimization

- All static images use the Next.js `<Image>` component for automatic format selection (WebP/AVIF), resizing, and lazy loading.
- Above-the-fold images use `priority` to trigger eager loading.

---

## Content SEO

### AI-Generated Unique Content

The AI Market Summary feature produces a fresh five-section briefing every 15 minutes. This means:

- Search engine crawlers encounter genuinely unique, recently-updated text content on every visit.
- The dashboard is not a static shell wrapping third-party API data — it generates original analysis.
- Fresh content signals to search engines that the page is actively maintained.

### Headline Aggregation

- News headlines from CoinDesk, CoinTelegraph, and Decrypt are displayed with sentiment scores.
- Each headline links to the original source (preserving `rel="noopener noreferrer"` for external links).
- Aggregation with sentiment overlay adds value beyond the source content alone.

### Keyword Density

- Primary keywords appear naturally in the page title, meta description, `<h1>`, and body content.
- No keyword stuffing. AI-generated content is optimized for readability, not keyword repetition.

---

## Monitoring

### Google Search Console

- The production URL should be verified in Google Search Console.
- Monitor: index coverage, crawl errors, mobile usability, and search performance (impressions, clicks, average position).
- Submit the sitemap URL after deployment.

### Core Web Vitals

Target thresholds aligned with Google "Good" ratings:

| Metric                          | Target    |
| ------------------------------- | --------- |
| Largest Contentful Paint (LCP)  | < 2.5s    |
| Interaction to Next Paint (INP) | < 200ms   |
| Cumulative Layout Shift (CLS)   | < 0.1     |

### Lighthouse

- Run Lighthouse audits in CI or manually before each production deployment.
- Target scores: Performance > 90, Accessibility > 90, SEO > 95, Best Practices > 90.
- Address any regression in SEO score before merging to main.

### Ongoing Tasks

- Review Search Console weekly for crawl anomalies and keyword opportunities.
- Update meta descriptions quarterly to reflect new features.
- Monitor competitor dashboards for keyword gap analysis.
- Track indexed page count to ensure all public routes are discoverable.
