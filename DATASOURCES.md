# Delta Saraswati — Data Sources

## 1. Delta Exchange (Primary — Market Data)

| | Details |
|---|---|
| **Base URL** | `https://api.india.delta.exchange/v2` |
| **Auth** | None for public endpoints |
| **Rate Limit** | 10,000 units / 5-min window (IP-based for public) |
| **Cache TTL** | 30s (tickers), 5min (candles), 1h (products) |

### Endpoints Used

| Endpoint | Weight | Returns | Used For |
|----------|--------|---------|----------|
| `GET /tickers` | 3 | All 996 tickers | Top 3 by volume, prices, 24h change, OI, funding rate |
| `GET /tickers/{symbol}` | 3 | Single ticker | Research tab detail view |
| `GET /products` | 3 | All products | Token list, contract specs, margin info |
| `GET /history/candles?resolution={r}&symbol={s}&start={t}&end={t}` | 3 | OHLC array | Price chart, RSI/MACD self-calculation |
| `GET /l2orderbook/{symbol}` | 3 | Bid/ask levels | Orderbook depth (Research tab) |

### Key Ticker Fields
```
symbol, close (price), open, high, low,
mark_price, spot_price, funding_rate,
volume (contracts), turnover_usd,
oi_value_usd, oi_contracts,
mark_change_24h (%), ltp_change_24h (%),
quotes.best_bid, quotes.best_ask,
contract_type, underlying_asset_symbol
```

### Candle Resolutions
`1m`, `3m`, `5m`, `15m`, `30m`, `1h`, `2h`, `4h`, `6h`, `1d`, `7d`, `30d`, `1w`, `2w`

### Filtering Strategy
- Filter tickers by `contract_type === "perpetual_futures"` for top tokens
- Sort by `turnover_usd` descending for "top 3 by volume"
- Use `mark_change_24h` for 24h change display

---

## 2. CoinGecko (Prices, Market Cap, Metadata)

| | Details |
|---|---|
| **Base URL** | `https://api.coingecko.com/api/v3` |
| **Auth** | None (free tier) |
| **Rate Limit** | ~10-30 req/min (unauthenticated) |
| **Cache TTL** | 60s (prices), 1h (coin metadata) |

### Endpoints Used

| Endpoint | Returns | Used For |
|----------|---------|----------|
| `GET /simple/price?ids={}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true` | Price, market cap, 24h change | Token card enrichment |
| `GET /coins/list` | All coin IDs | Symbol-to-CoinGecko-ID mapping |
| `GET /coins/{id}` | Full coin data | Research tab deep info |
| `GET /search/trending` | Trending coins | Fallback for "hot" tokens |

### Response Shape (simple/price)
```json
{
  "bitcoin": {
    "usd": 71197,
    "usd_market_cap": 1425323165014.42,
    "usd_24h_change": -0.9967
  }
}
```

### Symbol Mapping (Delta → CoinGecko)
```
BTC → bitcoin, ETH → ethereum, SOL → solana,
AVAX → avalanche-2, DOGE → dogecoin, etc.
```
Build a mapping table at startup from `/coins/list`.

---

## 3. Fear & Greed Index (Alternative.me)

| | Details |
|---|---|
| **Base URL** | `https://api.alternative.me` |
| **Auth** | None |
| **Rate Limit** | Unrestricted (reasonable use) |
| **Cache TTL** | 1 hour |

### Endpoint

`GET /fng/?limit=1`

### Response
```json
{
  "data": [{
    "value": "14",
    "value_classification": "Extreme Fear",
    "timestamp": "1775692800",
    "time_until_update": "40272"
  }]
}
```

### Classification Ranges
| Range | Label | Color |
|-------|-------|-------|
| 0-24 | Extreme Fear | `#EF4444` (red) |
| 25-44 | Fear | `#F97316` (orange) |
| 45-55 | Neutral | `#9CA3AF` (gray) |
| 56-74 | Greed | `#22C55E` (green) |
| 75-100 | Extreme Greed | `#16A34A` (dark green) |

---

## 4. News (Free RSS Feeds)

Since free-crypto-news API requires micropayments, we use free RSS feeds parsed server-side.

| Source | RSS URL | Quality |
|--------|---------|---------|
| CoinDesk | `https://www.coindesk.com/arc/outboundfeeds/rss/` | Top tier |
| CoinTelegraph | `https://cointelegraph.com/rss` | Top tier |
| Decrypt | `https://decrypt.co/feed` | Good |
| The Block | `https://www.theblock.co/rss.xml` | Good |
| Bitcoin Magazine | `https://bitcoinmagazine.com/feed` | BTC focused |
| NewsBTC | `https://www.newsbtc.com/feed/` | Market analysis |

### Processing Pipeline
```
RSS Feeds → Parse (rss-parser npm) → Deduplicate → Sort by date
→ Take last 24h → Feed to Groq for AI summary + sentiment scoring
→ Cache summary 1h, headlines 15min
```

### Groq Sentiment Prompt (per headline)
Feed headline + snippet to Groq with:
```
Rate the sentiment of this crypto news: positive/negative/neutral.
Return JSON: { "sentiment": "positive"|"negative"|"neutral", "score": 0-100 }
```
Batch headlines to minimize API calls (all headlines in one prompt).

---

## 5. Technical Indicators (Self-Calculated)

TAAPI.io free tier is too rate-limited (1 req/15s). Instead, calculate from Delta candles.

### Library
`technicalindicators` npm package (MIT, zero dependencies)

### Indicators Calculated

| Indicator | Input | Parameters |
|-----------|-------|------------|
| RSI (14) | Close prices from `GET /history/candles?resolution=1h` | period: 14 |
| MACD | Close prices | fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 |
| SMA (20, 50, 200) | Close prices | periods: 20, 50, 200 |
| Bollinger Bands | Close prices | period: 20, stdDev: 2 |

### Data Requirement
- Fetch 200+ candles (1h resolution) to compute 200-SMA accurately
- Cache candle data for 5 minutes
- Recalculate indicators on each fetch

---

## 6. Groq (LLM — AI Features)

| | Details |
|---|---|
| **Base URL** | `https://api.groq.com/openai/v1` |
| **Auth** | Bearer token (`GROQ_API_KEY` env var) |
| **Model** | `llama-3.3-70b-versatile` |
| **Cache TTL** | 1h (summaries), none (chat) |

### Rate Limits (Free Tier)
| Metric | Limit |
|--------|-------|
| Requests/minute | 30 |
| Requests/day | 1,000 |
| Tokens/minute | 12,000 |
| Tokens/day | 100,000 |

### Usage Budget (estimated daily)
| Feature | Calls/day | Tokens/call | Total tokens |
|---------|-----------|-------------|--------------|
| AI News Summary | 24 (hourly cache) | ~2,000 | ~48,000 |
| Headline Sentiment | 24 (batched with summary) | ~500 | ~12,000 |
| Chat messages | ~100 (user interactions) | ~300 | ~30,000 |
| Research mini-chat | ~50 | ~200 | ~10,000 |
| **Total** | **~198** | | **~100,000** |

Fits within 1,000 RPD and 100K TPD limits with room for growth.

### AI Features

**1. News Summary (Home Page)**
```
System: You are a crypto market analyst for Delta Exchange India.
User: Summarize the last 24h in crypto markets based on these headlines: {headlines}
Include: overall market performance, macro events (FED, inflation, geopolitics),
key signals, and notable movements. Keep it to 2-3 paragraphs.
```

**2. Sentiment Scoring (Home Page)**
```
System: Score crypto news sentiment.
User: For each headline below, return a JSON array with sentiment and score (0-100).
Headlines: {headlines}
Response format: [{ "title": "...", "sentiment": "positive"|"negative"|"neutral", "score": 0-100 }]
```

**3. Token Sentiment (Token Cards)**
```
System: You are a crypto sentiment analyst.
User: Based on current data for {token}: price ${price}, 24h change {change}%,
funding rate {rate}, Fear & Greed {fg}, and recent headlines: {headlines}.
Provide a sentiment score 0-100 and one-line explanation.
```

**4. Chat (Chat Tab + Research Mini-Chat)**
```
System: You are Delta Saraswati, an AI crypto research assistant for Delta Exchange India.
You have access to live market data. Be concise and actionable.
Current market context: {inject live data}
```

---

## 7. Derivatives Data (V1 — Delta-Only)

For v1, we skip Coinglass ($29/mo) and rely on Delta's own data:

| Data Point | Source | Field |
|------------|--------|-------|
| Funding Rate | Delta ticker | `funding_rate` |
| Open Interest | Delta ticker | `oi_value_usd`, `oi_contracts` |
| 24h Volume | Delta ticker | `turnover_usd` |
| OI Change (6h) | Delta ticker | `oi_change_usd_6h` |
| Long/Short Ratio | Not available in v1 | Show "Coming Soon" |
| Liquidations | Not available in v1 | Show "Coming Soon" |

### Future (V2 — Add Coinglass)
When budget allows, add Coinglass Hobbyist ($29/mo) for:
- Aggregated funding rates across exchanges
- Liquidation heatmap
- Long/short ratios (global + per-exchange)
- Top trader positions

---

## Data Flow Summary

```
┌─────────────────────────────────────────────────────┐
│                    Client (Browser)                  │
│  SWR polling (30-60s) ──→ Next.js API Routes        │
└───────────────────────────┬─────────────────────────┘
                            │
                   ┌────────▼────────┐
                   │  Vercel KV Cache │
                   │  (check TTL)     │
                   └────────┬────────┘
                            │ cache miss
              ┌─────────────┼─────────────────┐
              │             │                 │
    ┌─────────▼──┐  ┌───────▼────┐  ┌────────▼───────┐
    │ Delta API  │  │ CoinGecko  │  │ RSS Feeds      │
    │ (tickers,  │  │ (prices,   │  │ (news,         │
    │  candles,  │  │  market    │  │  headlines)     │
    │  products) │  │  cap)      │  │                 │
    └────────────┘  └────────────┘  └────────┬───────┘
                                             │
                                    ┌────────▼───────┐
    ┌────────────┐                  │ Groq LLM       │
    │ Alt.me     │                  │ (summaries,    │
    │ (Fear &    │                  │  sentiment,    │
    │  Greed)    │                  │  chat)         │
    └────────────┘                  └────────────────┘
```

## Caching Strategy (Vercel KV)

| Data | Key Pattern | TTL | Reason |
|------|-------------|-----|--------|
| Delta tickers (all) | `delta:tickers` | 30s | Near real-time prices |
| Delta ticker (single) | `delta:ticker:{symbol}` | 30s | Research tab |
| Delta candles | `delta:candles:{symbol}:{res}` | 5min | Chart data |
| Delta products | `delta:products` | 1h | Rarely changes |
| CoinGecko prices | `cg:prices:{ids}` | 60s | Rate limit protection |
| CoinGecko coin list | `cg:coins:list` | 24h | Static mapping |
| Fear & Greed | `fg:index` | 1h | Updates daily |
| News headlines | `news:headlines` | 15min | Fresh enough |
| AI News Summary | `ai:summary` | 1h | Expensive to generate |
| AI Sentiment scores | `ai:sentiment` | 1h | Batched with summary |
| Token sentiment | `ai:token:{symbol}` | 30min | Per-token score |
| Technical indicators | `ta:{symbol}` | 5min | Derived from candles |

## Fallback Strategy

| Primary | Fallback | Trigger |
|---------|----------|---------|
| Delta tickers | Cached data + stale badge | API timeout > 5s |
| CoinGecko | Delta tickers (price/volume only) | 429 rate limit |
| RSS feeds | Cached headlines + "last updated X ago" | Parse failure |
| Groq | Cached AI summary + "AI unavailable" badge | 429 or timeout |
| Fear & Greed | Cached value + stale indicator | API down |
| Self-calc indicators | "Calculating..." skeleton | Insufficient candle data |
