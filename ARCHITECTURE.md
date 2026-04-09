# Delta Saraswati — Architecture

## System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                         VERCEL EDGE                              │
│                                                                  │
│  ┌─────────────┐    ┌──────────────────┐    ┌───────────────┐   │
│  │  Next.js    │    │  API Routes      │    │  Vercel KV    │   │
│  │  App Router │───▶│  /api/delta/*    │───▶│  (Redis)      │   │
│  │  (SSR/CSR)  │    │  /api/market/*   │    │  TTL Cache    │   │
│  │             │    │  /api/chat/*     │    │               │   │
│  └─────────────┘    └───────┬──────────┘    └───────────────┘   │
│                             │                                    │
└─────────────────────────────┼────────────────────────────────────┘
                              │
            ┌─────────────────┼─────────────────────┐
            │                 │                     │
   ┌────────▼────┐   ┌───────▼──────┐   ┌──────────▼──────┐
   │ Delta API   │   │ CoinGecko    │   │ Groq API        │
   │ (India)     │   │ Alternative  │   │ (Llama 3.3 70B) │
   │             │   │ RSS Feeds    │   │                 │
   └─────────────┘   └──────────────┘   └─────────────────┘
```

## File Structure

```
lima/
├── DESIGN.md                              # Design system (colors, typography, components)
├── PLAN.md                                # Project plan and decisions
├── ARCHITECTURE.md                        # This file
├── UI.md                                  # Component specs
├── UX.md                                  # User flows and interactions
├── DATASOURCES.md                         # API documentation
│
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── .env.local.example                     # Env var template
│
├── public/
│   └── logo.svg                           # Delta Saraswati logo
│
└── src/
    ├── app/
    │   ├── layout.tsx                     # Root: dark theme, font, sidebar shell
    │   ├── page.tsx                       # Home / Daily Pulse
    │   ├── globals.css                    # Tailwind base + CSS variables
    │   │
    │   ├── research/
    │   │   └── page.tsx                   # Research tab
    │   │
    │   ├── chat/
    │   │   └── page.tsx                   # Chat tab
    │   │
    │   └── api/                           # Server-side route handlers
    │       ├── delta/
    │       │   ├── tickers/route.ts       # GET — all tickers (cached 30s)
    │       │   ├── ticker/[symbol]/route.ts # GET — single ticker
    │       │   ├── candles/route.ts       # GET — OHLC candles
    │       │   └── products/route.ts      # GET — product list (cached 1h)
    │       │
    │       ├── market/
    │       │   ├── prices/route.ts        # GET — CoinGecko prices
    │       │   ├── fear-greed/route.ts    # GET — Fear & Greed index
    │       │   ├── news/route.ts          # GET — RSS feed aggregation
    │       │   └── indicators/[symbol]/route.ts # GET — calculated RSI/MACD
    │       │
    │       └── chat/
    │           └── route.ts               # POST — Groq streaming chat
    │
    ├── components/
    │   ├── layout/
    │   │   ├── sidebar.tsx                # Left sidebar navigation
    │   │   ├── header.tsx                 # Top header bar
    │   │   └── mobile-nav.tsx             # Bottom nav for mobile
    │   │
    │   ├── home/
    │   │   ├── token-card.tsx             # Top token card (price, change, sentiment)
    │   │   ├── news-summary.tsx           # AI-generated market summary
    │   │   ├── news-feed.tsx              # Individual news headlines
    │   │   ├── fear-greed-gauge.tsx       # Fear & Greed visual indicator
    │   │   └── cta-banner.tsx             # "Trade Now" promotional banner
    │   │
    │   ├── research/
    │   │   ├── token-selector.tsx          # Searchable token dropdown
    │   │   ├── price-chart.tsx            # TradingView Lightweight Charts
    │   │   ├── indicators-panel.tsx       # RSI, MACD, funding, OI display
    │   │   ├── token-stats.tsx            # Market cap, volume, OI cards
    │   │   └── research-chat.tsx          # Mini chat for token context
    │   │
    │   ├── chat/
    │   │   ├── chat-interface.tsx          # Full chat UI
    │   │   ├── message-bubble.tsx          # Individual message display
    │   │   ├── chat-input.tsx             # Input with send button
    │   │   └── quick-actions.tsx          # Pill buttons for common queries
    │   │
    │   ├── shared/
    │   │   ├── trade-modal.tsx             # Mock "Trade Now" modal
    │   │   ├── sentiment-badge.tsx        # Colored sentiment indicator
    │   │   ├── price-change.tsx           # Green/red percentage display
    │   │   └── loading-skeleton.tsx       # Consistent skeleton states
    │   │
    │   └── ui/                            # shadcn/ui primitives
    │       ├── button.tsx
    │       ├── card.tsx
    │       ├── badge.tsx
    │       ├── dialog.tsx
    │       ├── input.tsx
    │       ├── select.tsx
    │       ├── skeleton.tsx
    │       ├── tooltip.tsx
    │       ├── accordion.tsx
    │       ├── scroll-area.tsx
    │       └── separator.tsx
    │
    ├── lib/
    │   ├── api/
    │   │   ├── delta.ts                   # Delta Exchange API client
    │   │   ├── coingecko.ts               # CoinGecko API client
    │   │   ├── news.ts                    # RSS feed parser + aggregator
    │   │   ├── fear-greed.ts              # Fear & Greed API client
    │   │   └── groq.ts                    # Groq LLM client
    │   │
    │   ├── indicators.ts                  # RSI, MACD, SMA calculation (technicalindicators)
    │   ├── cache.ts                       # Vercel KV wrapper (get/set with TTL)
    │   ├── symbol-map.ts                  # Delta symbol → CoinGecko ID mapping
    │   └── utils.ts                       # Formatters (price, %, date), helpers
    │
    ├── hooks/
    │   ├── use-delta-tickers.ts           # SWR hook: all tickers (30s refresh)
    │   ├── use-token-detail.ts            # SWR hook: single token data
    │   ├── use-market-data.ts             # SWR hook: CoinGecko + F&G
    │   ├── use-news.ts                    # SWR hook: news feed
    │   └── use-chat.ts                    # Chat state management
    │
    ├── store/
    │   └── app-store.ts                   # Zustand: selected token, UI state
    │
    └── types/
        ├── delta.ts                       # Delta API response types
        ├── market.ts                      # Market data types
        └── chat.ts                        # Chat message types
```

## Data Flow

### 1. Client-Side Data Fetching (SWR)

```
Component mounts
  → SWR hook fires (e.g., useDeltaTickers)
  → GET /api/delta/tickers
  → API route checks Vercel KV cache
    → Cache HIT (TTL valid): return cached data
    → Cache MISS: fetch from Delta API → store in KV → return
  → SWR stores in client cache
  → Component renders
  → SWR revalidates on interval (30-60s)
```

### 2. AI Summary Generation

```
GET /api/market/news
  → Check KV cache for "ai:summary" (TTL 1h)
  → Cache MISS:
    1. Fetch RSS feeds (CoinDesk, CoinTelegraph, Decrypt, etc.)
    2. Parse with rss-parser, deduplicate, filter last 24h
    3. Fetch Delta tickers for market context
    4. Fetch Fear & Greed index
    5. Send to Groq:
       - System prompt: crypto market analyst
       - User prompt: headlines + market data
       - Request: summary paragraph + per-headline sentiment
    6. Cache response in KV (TTL 1h)
  → Return { summary, headlines, sentiments }
```

### 3. Chat Flow

```
User types message
  → POST /api/chat { messages, context? }
  → API route:
    1. Fetch current market snapshot (from KV cache)
    2. Inject as system context
    3. Stream to Groq (llama-3.3-70b-versatile)
    4. Return ReadableStream to client
  → Client renders tokens as they arrive
```

## Caching Architecture

```
┌─────────────────────────────────────────────┐
│              Vercel KV (Redis)              │
│                                             │
│  delta:tickers        → 30s TTL            │
│  delta:ticker:{sym}   → 30s TTL            │
│  delta:candles:{s}:{r} → 5min TTL          │
│  delta:products       → 1h TTL             │
│  cg:prices:{ids}      → 60s TTL            │
│  cg:coins:list        → 24h TTL            │
│  fg:index             → 1h TTL             │
│  news:headlines       → 15min TTL          │
│  ai:summary           → 1h TTL             │
│  ai:sentiment         → 1h TTL             │
│  ai:token:{sym}       → 30min TTL          │
│  ta:{sym}             → 5min TTL           │
└─────────────────────────────────────────────┘
```

### Cache Wrapper API

```typescript
// lib/cache.ts
import { kv } from '@vercel/kv';

export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = await kv.get<T>(key);
  if (cached !== null) return cached;

  const fresh = await fetcher();
  await kv.set(key, fresh, { ex: ttlSeconds });
  return fresh;
}
```

## State Management (Zustand)

```typescript
// store/app-store.ts
interface AppState {
  // Selected token for Research tab
  selectedToken: string | null;
  setSelectedToken: (symbol: string) => void;

  // Sidebar state
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // Trade modal
  tradeModalOpen: boolean;
  tradeModalToken: string | null;
  openTradeModal: (symbol: string) => void;
  closeTradeModal: () => void;
}
```

## API Route Design

All API routes follow this pattern:

```typescript
// Consistent response shape
type ApiResponse<T> = {
  success: true;
  data: T;
  cached: boolean;
  timestamp: number;
} | {
  success: false;
  error: string;
  timestamp: number;
};

// Consistent error handling
export async function GET(request: NextRequest) {
  try {
    const data = await cached('key', TTL, fetcherFn);
    return NextResponse.json({
      success: true,
      data,
      cached: /* from cache? */,
      timestamp: Date.now()
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: Date.now()
    }, { status: 500 });
  }
}
```

## Error Handling Strategy

| Layer | Strategy |
|-------|----------|
| API Routes | try/catch → structured error response, log to console |
| SWR Hooks | `onError` callback → show toast, use stale data |
| Components | Error boundary at page level, skeleton fallback |
| Cache | On KV failure → bypass cache, fetch directly |
| External APIs | 5s timeout, retry once, then use cached/fallback |

## Performance Considerations

1. **API Route Caching**: Vercel KV prevents redundant external API calls
2. **SWR Deduplication**: Multiple components using same hook share one request
3. **Code Splitting**: Each page is a separate chunk (App Router default)
4. **Chart Lazy Loading**: TradingView Lightweight Charts loaded dynamically
5. **Image Optimization**: Token icons via CDN (CoinGecko image URLs)
6. **Response Size**: Filter Delta tickers server-side (only perpetuals, top fields)
7. **Streaming**: Chat responses streamed token-by-token (no waiting for full response)

## Environment Variables

```env
# Required
GROQ_API_KEY=gsk_...                    # Groq API key for LLM
KV_REST_API_URL=https://...             # Vercel KV endpoint
KV_REST_API_TOKEN=...                   # Vercel KV auth token

# Optional (for future upgrades)
COINGLASS_API_KEY=                       # Coinglass (derivatives data)
TAAPI_SECRET=                            # TAAPI.io (if not self-calculating)
COINGECKO_API_KEY=                       # CoinGecko Pro (higher limits)

# App Config
NEXT_PUBLIC_DELTA_API_BASE=https://api.india.delta.exchange/v2
NEXT_PUBLIC_APP_NAME=Delta Saraswati
```

## Security

- All external API calls happen server-side (API routes only)
- API keys stored in env vars, never exposed to client
- `NEXT_PUBLIC_` prefix only for non-sensitive config
- Rate limiting: respect external API limits via cache TTLs
- No user authentication in v1 (read-only public data)
- CORS: default Next.js same-origin policy
