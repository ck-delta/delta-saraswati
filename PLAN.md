# Delta Saraswati — Project Plan

## Overview
AI-powered crypto research and chatbot web app that surfaces top tokens trading on Delta Exchange, provides AI-generated market summaries, and offers a ChatGPT-style interface for crypto research.

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | Next.js 15 (App Router) | SSR, API routes, Vercel-native |
| Language | TypeScript | Type safety across API boundaries |
| Styling | Tailwind CSS + shadcn/ui | Delta Exchange dark theme match |
| LLM | Groq (Llama 3.3 70B) | Fast inference, free tier |
| Charts | TradingView Lightweight Charts + Recharts | Professional price charts + data viz |
| State | Zustand | Lightweight, no boilerplate |
| Data Fetching | SWR | Polling, caching, revalidation |
| Cache | Vercel KV (Upstash Redis) | Server-side API response caching |
| Deploy | Vercel | Zero-config, edge functions |

## User-Confirmed Decisions

- **LLM**: Groq API with Llama 3.3 70B (key provided)
- **Delta API**: India endpoint (`api.india.delta.exchange`)
- **Top 3 tokens**: Dynamic — top 3 by 24h volume on Delta
- **Trade Now buttons**: Mock modal (no real trading)
- **Real-time**: Polling every 30-60s for v1
- **Deployment**: Vercel-optimized (Vercel KV + Cron)
- **Design**: Delta Exchange colors/typography, creative liberty on layout
- **Chat persistence**: Fresh session each page load
- **Charts**: TradingView Lightweight Charts + Recharts
- **Data APIs**: Free tiers to start, upgrade if needed

## Implementation Phases

### Phase 1: Foundation (Setup + Layout)
- Initialize Next.js 15 project with TypeScript
- Configure Tailwind with Delta color tokens
- Install and configure shadcn/ui (dark theme)
- Build root layout, sidebar navigation, header
- Create `.env.local.example`
- Mobile responsive nav

### Phase 2: API Layer
- Delta Exchange API wrapper + Next.js route handlers
- CoinGecko wrapper (prices, market cap, OHLC)
- Fear & Greed Index integration
- News aggregation (RSS feeds — CoinDesk, CoinTelegraph, etc.)
- Technical indicators (self-calculation from Delta candles)
- Groq client + streaming chat endpoint
- Vercel KV caching layer with TTLs

### Phase 3: Home Page ("Daily Pulse")
- Top 3 token cards (by volume, from Delta tickers)
- Each card: price, 24h change, Fear & Greed, sentiment score
- AI-generated 24h news summary (Groq)
- News feed with sentiment badges
- CTA banner + Trade Now mock modal
- Loading skeletons + error states

### Phase 4: Research Tab
- Token selector (searchable, all Delta perpetuals)
- Price chart (TradingView Lightweight Charts)
- Indicators panel: funding rate, RSI, MACD, OI, volume
- Data visualizations (Recharts)
- Mini research chat (Groq, token-scoped)

### Phase 5: Chat Tab
- ChatGPT-style interface with message history
- Quick-action pills (Market Overview, Top Gainers, News, etc.)
- Streaming responses from Groq
- Context injection with live market data

### Phase 6: Polish & Deploy
- Responsive design pass
- Loading/error/empty states
- Performance optimization
- Vercel deployment with env vars
- Testing documentation

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Groq rate limits (30 RPM, 1K RPD) | Chat/summary failures | Aggressive caching (1h for summaries), queue requests |
| TAAPI.io rate limit (1/15s) | Slow indicator loading | Self-calculate RSI/MACD from Delta candles |
| Coinglass requires paid plan | No liquidation/L/S data | Use Delta OI + funding rate; add Coinglass later |
| CoinGecko rate limit (~30/min) | Price fetch failures | Cache 60s, batch requests, fallback to Delta tickers |
| free-crypto-news requires payment | No news feed | Use free RSS feeds (CoinDesk, CoinTelegraph, Decrypt) |
| Delta API downtime | Core data unavailable | Show cached data with stale indicator |
