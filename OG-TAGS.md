# Open Graph and Twitter Card Implementation Guide

## Overview

This document specifies the Open Graph (OG) and Twitter Card metadata for every
route in Delta Saraswati. Correct social-sharing tags ensure that links shared on
Twitter/X, LinkedIn, Telegram, and Discord render rich previews with the project's
branding, driving click-through from crypto communities.

Production base URL: `https://delta-saraswati.vercel.app`

---

## Global Defaults

| Property              | Value                                                |
|-----------------------|------------------------------------------------------|
| `og:site_name`        | Delta Saraswati                                      |
| `og:type`             | website                                              |
| `og:locale`           | en_US                                                |
| `og:image` (fallback) | `https://delta-saraswati.vercel.app/og.png`          |
| `og:image:width`      | 1200                                                 |
| `og:image:height`     | 630                                                  |
| `twitter:card`        | summary_large_image                                  |
| `twitter:site`        | @DeltaSaraswati                                      |
| Theme color           | #F59E0B (amber/gold)                                 |

---

## Per-Route Tag Specifications

### Home `/`  (Daily Pulse)

| Tag                  | Value                                                                              |
|----------------------|------------------------------------------------------------------------------------|
| `og:title`           | Delta Saraswati -- AI Crypto Research Dashboard                                    |
| `og:description`     | Real-time crypto perpetuals data, AI market summaries, and intelligent trading insights. |
| `og:url`             | https://delta-saraswati.vercel.app                                                 |
| `og:image`           | https://delta-saraswati.vercel.app/api/og?title=Delta+Saraswati&description=AI+Crypto+Research+Dashboard |
| `twitter:title`      | Delta Saraswati -- AI Crypto Research Dashboard                                    |
| `twitter:description`| Real-time crypto perpetuals data, AI market summaries, and intelligent trading insights. |

### Research `/research`  (Token Analysis)

| Tag                  | Value                                                                              |
|----------------------|------------------------------------------------------------------------------------|
| `og:title`           | Research \| Delta Saraswati                                                        |
| `og:description`     | In-depth crypto token analysis with TradingView charts, technical indicators, and AI insights. |
| `og:url`             | https://delta-saraswati.vercel.app/research                                        |
| `og:image`           | https://delta-saraswati.vercel.app/api/og?title=Research&description=Token+Analysis+%26+Charts |
| `twitter:title`      | Research \| Delta Saraswati                                                        |
| `twitter:description`| In-depth crypto token analysis with TradingView charts, technical indicators, and AI insights. |

### Chat `/chat`  (AI Chat Assistant)

| Tag                  | Value                                                                              |
|----------------------|------------------------------------------------------------------------------------|
| `og:title`           | AI Chat \| Delta Saraswati                                                         |
| `og:description`     | Chat with AI assistant. Live crypto market intelligence powered by Groq and Llama 3.3. |
| `og:url`             | https://delta-saraswati.vercel.app/chat                                            |
| `og:image`           | https://delta-saraswati.vercel.app/api/og?title=AI+Chat&description=Live+Market+Intelligence |
| `twitter:title`      | AI Chat \| Delta Saraswati                                                         |
| `twitter:description`| Chat with AI assistant. Live crypto market intelligence powered by Groq and Llama 3.3. |

---

## Dynamic OG Image Generation

Delta Saraswati uses the Next.js `ImageResponse` API (from `next/og`) to generate
branded Open Graph images on the fly at the Vercel Edge. This avoids maintaining
a library of static images and keeps previews consistent with the live UI.

**Endpoint:** `GET /api/og?title=...&description=...`

The route handler renders a 1200x630 image with:

- Background: `#08080c` (the dashboard's near-black)
- Title text: `#F59E0B` (amber/gold primary)
- Description text: `#F2F2F7` (off-white foreground)
- A subtle gradient accent along the bottom edge

### Implementation (`app/api/og/route.tsx`)

```tsx
import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const title = searchParams.get("title") ?? "Delta Saraswati";
  const description =
    searchParams.get("description") ?? "AI Crypto Research Dashboard";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px 80px",
          width: "100%",
          height: "100%",
          backgroundColor: "#08080c",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div style={{ fontSize: 56, fontWeight: 700, color: "#F59E0B" }}>
          {title}
        </div>
        <div
          style={{ fontSize: 28, color: "#F2F2F7", marginTop: 24, opacity: 0.85 }}
        >
          {description}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
```

### Static Fallback

A pre-rendered `/public/og.png` (1200 x 630) is used as the fallback when the
dynamic endpoint is unavailable or when platforms cache an initial crawl before
Edge Functions are warm. Generate this image once and commit it to the repository.

---

## Next.js Metadata Export Pattern

Each route's `page.tsx` (or `layout.tsx`) exports a `metadata` object that Next.js
16 App Router merges into the `<head>`. Example for the Home route:

```tsx
import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://delta-saraswati.vercel.app";

export const metadata: Metadata = {
  title: "Delta Saraswati -- AI Crypto Research Dashboard",
  description:
    "Real-time crypto perpetuals data, AI market summaries, and intelligent trading insights.",
  openGraph: {
    title: "Delta Saraswati -- AI Crypto Research Dashboard",
    description:
      "Real-time crypto perpetuals data, AI market summaries, and intelligent trading insights.",
    url: BASE_URL,
    siteName: "Delta Saraswati",
    images: [
      {
        url: `${BASE_URL}/api/og?title=Delta+Saraswati&description=AI+Crypto+Research+Dashboard`,
        width: 1200,
        height: 630,
        alt: "Delta Saraswati dashboard preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Delta Saraswati -- AI Crypto Research Dashboard",
    description:
      "Real-time crypto perpetuals data, AI market summaries, and intelligent trading insights.",
    images: [
      `${BASE_URL}/api/og?title=Delta+Saraswati&description=AI+Crypto+Research+Dashboard`,
    ],
  },
};
```

---

## Testing and Validation

Use the following tools to verify that tags render correctly before and after
each deployment:

| Tool                     | URL                                              |
|--------------------------|--------------------------------------------------|
| opengraph.xyz            | https://www.opengraph.xyz                        |
| Facebook Sharing Debugger| https://developers.facebook.com/tools/debug/     |
| Twitter Card Validator   | https://cards-dev.twitter.com/validator           |
| LinkedIn Post Inspector  | https://www.linkedin.com/post-inspector/         |

After updating metadata, use the Facebook and Twitter tools to clear cached
previews. Allow up to 10 minutes for CDN propagation on Vercel before
re-validating.
