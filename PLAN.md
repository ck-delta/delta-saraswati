# Delta Saraswati — Architecture Plan

## Overview
Delta Saraswati is an AI-powered crypto research chatbot for Delta Exchange, inspired by Bybit's TradeGPT. It provides a Daily Pulse homepage, deep token research, and an AI chat interface — all styled to match Delta Exchange's design system.

## Tech Stack
- **Framework**: Next.js 15 (App Router) + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui + CSS custom properties
- **State**: Zustand
- **AI**: Groq SDK (`llama-3.3-70b-versatile`)
- **Charts**: lightweight-charts (candlestick) + Recharts (gauges/bars)
- **Deploy**: Vercel

## Design System
- **Dark mode default** with orange Indian accent (`#fd7d02`)
- Background: `#101013` (dark), `#fafafa` (light)
- Surface: `#1a1a1f`, Surface Alt: `#222228`
- Border: `#2a2a32`
- Buy/Long: `#00c076`, Sell/Short: `#ff4d4f`
- Font: System sans-serif, `font-mono` for numerical data

## Pages (Left Sidebar Navigation)

### 1. Home / Daily Pulse (`/`)
- **3 Top Token Cards** (BTC, ETH, SOL perpetuals from Delta)
  - Token icon + symbol + name
  - Current price + 24h change % (green/red)
  - Fear & Greed Index (color-coded gauge)
  - AI Sentiment Score (0-100 badge with tooltip)
  - "More Info" → Research tab | "Trade Now" → delta.exchange link
- **AI News Summary** — 2-3 paragraph market overview (macro, liquidations, whale activity)
- **News Headlines** — individual items with source, time, sentiment badge, link

### 2. Research (`/research`)
- Token selector dropdown (all Delta perpetuals)
- Metrics grid: Funding rate, 24h change, RSI(14), MACD, Long/Short ratio, OI
- Candlestick chart (lightweight-charts)
- Volume + OI panel, Order book depth
- Market cap, 24h volume (from CoinGecko)
- "Trade Now" button
- Token-specific chat prompt box

### 3. Chat (`/chat`)
- Full ChatGPT-style interface
- Quick-action pills: Market Overview, Top Gainers/Losers, News Summary, Whale Activity, Liquidation Data, Funding Rates
- Streaming AI responses via Groq
- Message history (localStorage persistence)
- Deep Think toggle (longer/more detailed responses)

## File Structure
```
src/
├── app/
│   ├── layout.tsx                # Root layout: sidebar + main
│   ├── page.tsx                  # Home / Daily Pulse
│   ├── research/page.tsx
│   ├── chat/page.tsx
│   ├── globals.css
│   └── api/
│       ├── market-data/route.ts  # Aggregated: Delta+CoinGecko+FearGreed
│       ├── tickers/route.ts      # All Delta tickers
│       ├── ticker/[symbol]/route.ts
│       ├── candles/route.ts      # Delta OHLC candles
│       ├── orderbook/[symbol]/route.ts
│       ├── news/route.ts         # RSS + free-crypto-news
│       ├── ai/chat/route.ts      # Streaming Groq chat
│       ├── ai/sentiment/route.ts # Batch sentiment scoring
│       └── ai/daily-pulse/route.ts # AI market summary
├── components/
│   ├── layout/                   # Sidebar, Header, ThemeToggle
│   ├── home/                     # TokenCard, FearGreedGauge, DailyPulseSummary, NewsSection
│   ├── research/                 # TokenSelector, ResearchPanel, PriceChart, Indicators
│   ├── chat/                     # ChatInterface, ChatInput, QuickActionPills
│   └── ui/                       # shadcn/ui components
├── lib/
│   ├── api/                      # delta.ts, coingecko.ts, feargreed.ts, news.ts
│   ├── ai/                       # groq.ts, prompts.ts
│   ├── ta/                       # indicators.ts (RSI, MACD, Bollinger)
│   ├── cache.ts                  # In-memory TTL cache
│   ├── constants.ts
│   └── utils.ts
├── stores/                       # market-store, chat-store, research-store, ui-store
└── types/                        # delta.ts, market.ts, chat.ts, news.ts, ai.ts
```

## Data Flow
1. **Client** mounts → calls internal API routes (e.g. `/api/market-data`)
2. **API routes** fetch from external APIs server-side (Delta, CoinGecko, etc.) with caching
3. **Responses** stored in Zustand stores → components render from stores
4. **AI routes** inject live market data into Groq prompts → stream responses back
5. **All API keys** stay server-side only (env vars, never exposed to client)

## Caching Strategy
| Route | Cache TTL | Fallback |
|-------|-----------|----------|
| `/api/market-data` | 30s | Stale cache on API failure |
| `/api/tickers` | 30s | Stale cache |
| `/api/candles` | 60s | Stale cache |
| `/api/orderbook/[symbol]` | 10s | Stale cache |
| `/api/news` | 5min | Stale cache (per-feed failure isolation) |
| `/api/ai/daily-pulse` | 15min | Last cached response |
| `/api/ai/sentiment` | 5min | Last cached scores |
| `/api/ai/chat` | Never | Error message + retry |

## Environment Variables
```
GROQ_API_KEY=           # Required — Groq API for AI features
COINGLASS_API_KEY=      # Optional — for liquidation/long-short data
```

## Build Order
1. Scaffolding + deps + types + utils
2. Layout shell (sidebar, header, theme)
3. API clients (`lib/api/*`)
4. Data API routes
5. Home page (cards + news)
6. AI routes (daily-pulse, sentiment, chat)
7. Home AI integration
8. Research tab
9. Chat tab
10. Polish + deploy
