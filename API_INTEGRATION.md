# Delta Saraswati — API Integration Guide

## Architecture Overview

```
Browser (Client)
    │
    ▼
Next.js API Routes (Server)     ← All API keys live here
    │
    ├──► Delta Exchange API     ← Tickers, candles, orderbook
    ├──► CoinGecko API          ← Market cap, volume, historical
    ├──► Alternative.me API     ← Fear & Greed Index
    ├──► RSS Feeds              ← News headlines
    ├──► Coinglass API          ← Liquidations, L/S ratio (optional)
    └──► Groq API               ← AI chat, summaries, sentiment
```

**Rule**: The browser NEVER contacts external APIs directly. All calls go through `/api/*` routes.

---

## 1. Delta Exchange Client (`src/lib/api/delta.ts`)

```typescript
// Base URL
const DELTA_API = 'https://api.delta.exchange/v2';

// Core functions
async function getProducts(): Promise<DeltaProduct[]>
async function getTickers(): Promise<DeltaTicker[]>
async function getTicker(symbol: string): Promise<DeltaTicker>
async function getCandles(symbol: string, resolution: string, start: number, end: number): Promise<Candle[]>
async function getOrderBook(symbol: string): Promise<OrderBook>

// Helper: filter perpetual futures only
function filterPerpetuals(tickers: DeltaTicker[]): DeltaTicker[]

// Helper: sort by 24h change for gainers/losers
function getTopGainers(tickers: DeltaTicker[], limit: number): DeltaTicker[]
function getTopLosers(tickers: DeltaTicker[], limit: number): DeltaTicker[]
```

### Endpoint Details

**GET /products**
```
GET https://api.delta.exchange/v2/products
Response: { success: true, result: DeltaProduct[] }
```

**GET /tickers**
```
GET https://api.delta.exchange/v2/tickers
Response: { success: true, result: DeltaTicker[] }
```

**GET /history/candles**
```
GET https://api.delta.exchange/v2/history/candles?resolution=1d&symbol=BTCUSD&start=1704067200&end=1712016000
Response: { success: true, result: Candle[] }
```
- `resolution`: 1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 1d, 7d, 30d, 1w, 2w
- `start` / `end`: Unix timestamps (seconds)

---

## 2. CoinGecko Client (`src/lib/api/coingecko.ts`)

```typescript
const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// Symbol mapping: Delta symbol → CoinGecko ID
const SYMBOL_MAP: Record<string, string> = {
  'BTCUSD': 'bitcoin',
  'ETHUSD': 'ethereum',
  'SOLUSD': 'solana',
  'DOGEUSD': 'dogecoin',
  'XRPUSD': 'ripple',
  // ... extend as needed
};

async function getMarketData(ids: string[]): Promise<CoinGeckoPrice>
async function getMarketChart(id: string, days: number): Promise<MarketChart>
async function getTopCoins(limit: number): Promise<CoinMarket[]>
```

### Rate Limit Handling
- 10-50 calls/min on free tier
- Implement exponential backoff on 429
- Cache all responses with TTL

---

## 3. Fear & Greed Client (`src/lib/api/feargreed.ts`)

```typescript
const FNG_API = 'https://api.alternative.me/fng';

async function getFearGreedIndex(): Promise<FearGreedData>
// Returns: { value: number, classification: string, timestamp: number }
```

Simple, no auth, very reliable.

---

## 4. News Client (`src/lib/api/news.ts`)

```typescript
import Parser from 'rss-parser';

const RSS_FEEDS = [
  { name: 'CoinTelegraph', url: 'https://cointelegraph.com/rss' },
  { name: 'Decrypt', url: 'https://decrypt.co/feed' },
  { name: 'The Block', url: 'https://www.theblock.co/rss.xml' },
  { name: 'Bitcoin Magazine', url: 'https://bitcoinmagazine.com/feed' },
  { name: 'CoinDesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/' },
];

async function fetchAllNews(): Promise<NewsItem[]>
// Fetches all RSS feeds in parallel
// Per-feed error isolation
// Deduplicates by title similarity
// Sorts by date (newest first)
// Returns top 50 items
```

---

## 5. Groq AI Client (`src/lib/ai/groq.ts`)

```typescript
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Streaming chat
async function streamChat(messages: Message[], systemPrompt: string): AsyncIterable<string>

// Non-streaming (for structured responses)
async function generateJSON(prompt: string): Promise<any>

// Specific use cases
async function generateDailyPulse(marketData: any, news: any): Promise<string>
async function generateSentiment(tickers: any[], headlines: string[]): Promise<SentimentScores>
async function generateTokenAnalysis(tokenData: any, question: string): Promise<string>
```

### Model Selection
- **Chat**: `llama-3.3-70b-versatile` (best quality)
- **Sentiment JSON**: `llama-3.3-70b-versatile` with JSON mode
- **Daily Pulse**: `llama-3.3-70b-versatile`

---

## 6. Technical Analysis (`src/lib/ta/indicators.ts`)

```typescript
// All computed from Delta candle data (no external API)

function calculateRSI(closes: number[], period?: number): number[]
// Default period: 14. Returns array of RSI values.

function calculateMACD(closes: number[]): { macd: number[], signal: number[], histogram: number[] }
// Uses 12, 26, 9 periods (standard).

function calculateBollingerBands(closes: number[], period?: number, stdDev?: number): BollingerBands
// Default: 20-period SMA ± 2 standard deviations.

function calculateSMA(data: number[], period: number): number[]
function calculateEMA(data: number[], period: number): number[]
```

---

## 7. Caching Layer (`src/lib/cache.ts`)

```typescript
class TTLCache<T> {
  private cache: Map<string, { data: T; expiry: number; }>;

  get(key: string): { data: T; fresh: boolean } | null
  // Returns data even if expired (stale), with fresh=false flag

  set(key: string, data: T, ttlMs: number): void

  invalidate(key: string): void
}

// Singleton instance
export const cache = new TTLCache();
```

### Cache Keys Convention
```
delta:tickers           → All tickers (30s)
delta:ticker:BTCUSD     → Single ticker (30s)
delta:candles:BTCUSD:1d → Candles (60s)
delta:orderbook:BTCUSD  → Order book (10s)
coingecko:prices        → Market data (30s)
fng:latest              → Fear & Greed (30min)
news:all                → All news items (5min)
ai:daily-pulse          → Daily pulse summary (15min)
ai:sentiment            → Sentiment scores (5min)
```

---

## 8. API Routes Summary

### Data Routes

| Route | Method | External APIs Called | Cache | Response |
|-------|--------|---------------------|-------|----------|
| `/api/market-data` | GET | Delta + CoinGecko + FNG | 30s | `TokenCardData[]` |
| `/api/tickers` | GET | Delta | 30s | `DeltaTicker[]` |
| `/api/ticker/[symbol]` | GET | Delta | 30s | `DeltaTicker` |
| `/api/candles` | GET | Delta | 60s | `Candle[]` |
| `/api/orderbook/[symbol]` | GET | Delta | 10s | `OrderBook` |
| `/api/news` | GET | RSS feeds | 5min | `NewsItem[]` |

### AI Routes

| Route | Method | Flow | Cache |
|-------|--------|------|-------|
| `/api/ai/daily-pulse` | GET | Fetch market-data + news → Groq prompt → narrative | 15min |
| `/api/ai/sentiment` | POST | Receive tickers + headlines → Groq JSON → scores | 5min |
| `/api/ai/chat` | POST | Receive messages + context → inject live data → Groq stream | Never |

### Chat Context Injection
When the chat receives a message, the API route:
1. Checks if context requires live data (e.g., "What's BTC price?" → needs ticker)
2. Fetches relevant data from internal API routes
3. Injects data into the Groq system prompt
4. Streams the response back

Quick-action mapping:
```
"Market Overview"     → fetch /api/market-data + /api/ai/daily-pulse
"Top Gainers/Losers"  → fetch /api/tickers, sort, inject top/bottom 10
"News Summary"        → fetch /api/news, inject headlines
"Whale Activity"      → inject from news + Coinglass if available
"Liquidation Data"    → inject from Coinglass if available, else news
"Funding Rates"       → fetch /api/tickers, extract funding_rate fields
```

---

## 9. Error Handling Strategy

```
External API call
    │
    ├─ Success → Cache response → Return fresh data
    │
    └─ Failure
        │
        ├─ Stale cache exists → Return stale data + { stale: true }
        │
        └─ No cache → Return { error: "Service unavailable", fallback: true }
```

Client shows:
- `stale: true` → subtle "Data may be delayed" indicator
- `fallback: true` → "Unable to load [section]. Retry?" with button
- AI failure → "AI temporarily unavailable" with retry button

---

## 10. Environment Variables

```env
# Required
GROQ_API_KEY=gsk_...

# Optional
COINGLASS_API_KEY=...          # For liquidation/L-S data
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

All keys accessed ONLY in API routes (`src/app/api/*`). Never in client components.
