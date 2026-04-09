# Delta Saraswati — Data Sources

## 1. Delta Exchange (Primary — All Delta-Specific Data)

**Docs**: https://docs.delta.exchange/ | https://www.delta.exchange/algo/delta-exchange-apis
**Base URL**: `https://api.delta.exchange/v2` (or `https://api.india.delta.exchange/v2`)
**Auth**: None required for public market data
**Rate Limit**: 10,000 units per 5-min rolling window (most reads: 1-3 units)
**Cost**: FREE

### Endpoints Used

| Endpoint | Data | Cache | Units |
|----------|------|-------|-------|
| `GET /products` | All 387 products (perpetuals, options, spot) | 5min | 1 |
| `GET /tickers` | All live tickers: price, volume, OI, funding, mark price | 30s | 1 |
| `GET /tickers/{symbol}` | Single ticker (e.g. `BTCUSD`) | 30s | 1 |
| `GET /l2orderbook/{symbol}` | Level 2 order book (bid/ask depth) | 10s | 1 |
| `GET /trades/{symbol}` | Recent public trades | 30s | 1 |
| `GET /history/candles` | OHLC candles (1m to 30d resolution) | 60s | 10 |

### Ticker Response Shape
```json
{
  "symbol": "BTCUSD",
  "contract_type": "perpetual_futures",
  "close": "67500.50",
  "open": "66800.00",
  "high": "68000.00",
  "low": "66500.00",
  "mark_price": "67510.25",
  "funding_rate": "0.0001",
  "volume": "15234567",
  "turnover_usd": "1023456789",
  "oi": "45678",
  "oi_value_usd": "3082567800",
  "spot_price": "67495.00"
}
```
Note: All decimal values returned as strings for precision.

### WebSocket (Real-Time)
- Channel: `funding_rate` — live funding rate + next funding timestamp
- Channel: `v2/ticker` — real-time price updates
- Connection: `wss://socket.delta.exchange` (or India equivalent)

### Key Notes
- Filter perpetuals: `contract_type === 'perpetual_futures'`
- Top gainers/losers: sort `/tickers` by `ltp_change_24h`
- Candle resolutions: 1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 1d, 7d, 30d, 1w, 2w

---

## 2. CoinGecko (Market Cap, Volume, Historical Data)

**Base URL**: `https://api.coingecko.com/api/v3`
**Auth**: Optional API key for higher limits
**Rate Limit**: 10-50 calls/min (free tier), 10k calls/month (demo plan)
**Cost**: FREE (demo plan)

### Endpoints Used

| Endpoint | Data |
|----------|------|
| `/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true` | Price, market cap, volume, 24h change |
| `/coins/{id}/market_chart?vs_currency=usd&days=90` | Historical prices for charts |
| `/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100` | Top coins by market cap |

### Mapping Delta Symbols → CoinGecko IDs
```
BTCUSD → bitcoin
ETHUSD → ethereum
SOLUSD → solana
DOGEUSD → dogecoin
```

### Fallback
If CoinGecko is down, market cap fields return `null`. Prices still come from Delta.

---

## 3. Alternative.me — Fear & Greed Index

**Endpoint**: `https://api.alternative.me/fng/?limit=1`
**Auth**: None
**Rate Limit**: Generous (no documented limits)
**Cost**: FREE

### Response
```json
{
  "data": [{
    "value": "14",
    "value_classification": "Extreme Fear",
    "timestamp": "1775692800",
    "time_until_update": "44157"
  }]
}
```

### Classification Ranges
| Value | Label | Color |
|-------|-------|-------|
| 0-24 | Extreme Fear | `#ff4d4f` (red) |
| 25-44 | Fear | `#ff8c00` (orange) |
| 45-55 | Neutral | `#ffd700` (yellow) |
| 56-75 | Greed | `#90ee90` (light green) |
| 76-100 | Extreme Greed | `#00c076` (green) |

---

## 4. Coinglass (Liquidations, Long/Short, Funding Across Exchanges)

**Base URL**: `https://open-api-v3.coinglass.com/api`
**Auth**: API key required (free tier available)
**Rate Limit**: Limited on free tier
**Cost**: FREE tier available, paid for more

### Endpoints Used (if API key available)
| Endpoint | Data |
|----------|------|
| `/futures/liquidation/chart` | Liquidation heatmap data |
| `/futures/longShort/chart` | Long/short ratio (global + top traders) |
| `/futures/funding-rate/ohlc-history` | Historical funding rates |
| `/futures/openInterest/ohlc-history` | OI history |

### Fallback (No API Key)
- Use Delta's own funding rate from `/tickers`
- Liquidation data: show "Connect Coinglass for full data" message
- Long/short ratio: omit or show Delta-only data

---

## 5. News Sources

### Primary: free-crypto-news API
**URL**: TBD (research needed at build time)
**Auth**: None
**Coverage**: 200+ sources including CoinDesk, CoinTelegraph, Blockbeats
**Format**: JSON REST + RSS/Atom

### Backup: Direct RSS Feeds
| Source | RSS URL |
|--------|---------|
| CoinTelegraph | `https://cointelegraph.com/rss` |
| Decrypt | `https://decrypt.co/feed` |
| The Block | `https://www.theblock.co/rss.xml` |
| Bitcoin Magazine | `https://bitcoinmagazine.com/feed` |
| CoinDesk | `https://www.coindesk.com/arc/outboundfeeds/rss/` |

### Implementation
- Parse with `rss-parser` npm package
- Per-feed error isolation (one failure doesn't break all)
- Cache for 5 minutes
- LLM summarizes top headlines into daily pulse

---

## 6. Technical Indicators (Self-Calculated)

**Source**: Delta Exchange candle data (`/history/candles`)
**Library**: Custom implementation in `src/lib/ta/indicators.ts`

### Indicators Computed
| Indicator | Formula | Parameters |
|-----------|---------|------------|
| RSI(14) | Relative Strength Index | 14-period lookback |
| MACD | Moving Average Convergence Divergence | 12, 26, 9 periods |
| Bollinger Bands | SMA ± 2σ | 20-period, 2 std dev |
| SMA | Simple Moving Average | 20, 50, 200 periods |
| EMA | Exponential Moving Average | 12, 26 periods |

### Process
1. Fetch 200 daily candles from Delta
2. Compute indicators client-side after data arrives
3. Display in Research tab metrics grid

---

## 7. Whale & Institutional Proxies

### Whale Alert (Large Transfers)
- Public Telegram/Discord feeds
- Basic API available
- Useful for "X BTC moved from exchange" signals

### Best Free Proxies for Institutional Flow
- ETF inflows/outflows (BTC/ETH spot ETFs) — from Coinglass or public dashboards
- Exchange inflows/outflows — Coinglass net position data
- Large on-chain wallet movements — Arkham Intelligence free tier

### Implementation
- LLM summarizes available whale/institutional data into narrative
- Show as part of Daily Pulse and Chat responses
- If no real-time API: use news-based proxy (LLM extracts institutional activity from news)

---

## 8. Macro / FED Events

### Sources
- Investing.com Economic Calendar (most complete)
- TradingEconomics API
- Federal Reserve official calendar (federalreserve.gov)

### Implementation
- Include in AI daily pulse prompt: "mention upcoming FED decisions, CPI data, FOMC minutes"
- LLM uses its training data for macro context
- No real-time API integration needed for MVP — LLM handles this contextually

---

## 9. LLM — Groq API

**SDK**: `groq-sdk` (npm)
**Model**: `llama-3.3-70b-versatile` (fast, high quality)
**Base URL**: `https://api.groq.com/openai/v1`
**Auth**: `GROQ_API_KEY` environment variable
**Cost**: Free tier generous, very fast inference

### Use Cases
| Feature | Prompt Type | Cache |
|---------|-------------|-------|
| Daily Pulse summary | Market data + news → narrative | 15min |
| Sentiment scoring | Ticker + news → JSON scores | 5min |
| Chat responses | Context-aware conversation | Never |
| Token research Q&A | Token data + question → answer | Never |

### Streaming
- Use Groq SDK streaming for chat responses
- Return `text/event-stream` from API route
- Client reads with `ReadableStream` reader

---

## Rate Limit Budget (per 5 minutes)

| Source | Budget | Estimated Usage | Headroom |
|--------|--------|-----------------|----------|
| Delta Exchange | 10,000 units | ~300 units | 97% free |
| CoinGecko | ~150 calls | ~10 calls | 93% free |
| Alternative.me | Unlimited | ~10 calls | ∞ |
| Groq | Generous | ~20-50 calls | Plenty |
| RSS Feeds | Unlimited | ~5 calls | ∞ |
