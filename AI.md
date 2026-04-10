# AI Architecture — Delta Saraswati

## Overview

Delta Saraswati integrates three distinct AI-powered features built on the Groq inference platform using the Llama 3.3 70B Versatile model. Each feature serves a specific role in the trading research workflow: market summarization, sentiment quantification, and interactive analysis. All AI responses are cached via Vercel KV (Redis) with in-memory fallback to minimize latency and API costs.

---

## AI Features

### 1. AI Market Summary

**Function:** `generateNewsSummary()` in `/src/lib/api/groq.ts`

Produces a structured five-section briefing from aggregated crypto news headlines:

| Section             | Purpose                                      |
| ------------------- | -------------------------------------------- |
| Market Pulse        | Overall market direction and momentum        |
| Big Movers          | Notable price action on specific assets      |
| Macro Watch         | Broader economic factors affecting crypto     |
| Derivatives Insight | Futures, funding rates, open interest trends |
| Signal              | Condensed actionable outlook                 |

**Configuration:**

- Model: `llama-3.3-70b-versatile`
- Temperature: `0.5` — balances factual grounding with readable prose
- Max tokens: ~700
- Cache TTL: 15 minutes (Vercel KV)

The summary is regenerated only when the cache expires, ensuring that concurrent dashboard visitors receive the same briefing without redundant inference calls.

---

### 2. AI Sentiment Scoring

**Function:** `scoreSentiment()` in `/src/lib/api/groq.ts`

Assigns a numeric sentiment score (0-100) to each news headline. Headlines are processed in batch to reduce round-trip overhead.

**Configuration:**

- Model: `llama-3.3-70b-versatile`
- Temperature: `0.3` — low variance ensures consistent scoring across requests
- Output format: JSON structured output
- Cache TTL: 15 minutes (Vercel KV)

**Scoring scale:**

- 0-25: Strongly bearish
- 26-45: Bearish
- 46-55: Neutral
- 56-75: Bullish
- 76-100: Strongly bullish

Batch processing means all available headlines are scored in a single inference call. The structured JSON output constraint ensures parseable results without post-processing heuristics.

---

### 3. AI Chat

**Route:** `/src/app/api/chat/route.ts`

An interactive research assistant that streams responses via Server-Sent Events (SSE). Each request is augmented with live Delta Exchange ticker data so the model can reference current prices, volumes, and funding rates.

**Configuration:**

- Model: `llama-3.3-70b-versatile`
- Temperature: `0.6` — permits conversational flexibility while staying factual
- Max tokens: 512
- Streaming: SSE (Server-Sent Events)

**System prompt enforces:**

- Short, direct sentences
- Bullet-point formatting
- Bold formatting on numerical values
- Mandatory "Takeaway" section at the end of every response

---

## Data Flow

```
RSS Feeds (CoinDesk, CoinTelegraph, Decrypt)
        |
        v
  Headline Extraction
        |
        +---------------------------+
        |                           |
        v                           v
  scoreSentiment()          generateNewsSummary()
  (per-headline 0-100)     (5-section briefing)
        |                           |
        v                           v
  Vercel KV Cache            Vercel KV Cache
  (TTL: 15 min)             (TTL: 15 min)
        |                           |
        +---------------------------+
        |
        v
  Dashboard UI (News Panel, Sentiment Indicators, Market Brief)
```

---

## Context Injection Architecture

The AI Chat feature injects live market context into every request to ground the model in current data. The flow is as follows:

1. **Ticker Fetch:** Before each chat inference call, the server fetches the top perpetual futures contracts by volume from the Delta Exchange India API.
2. **Context Assembly:** Ticker data (symbol, last price, 24h volume, mark price, funding rate) is serialized into a structured text block.
3. **System Prompt Injection:** The assembled context is prepended to the system prompt, making it available to the model without consuming user message tokens.
4. **Inference:** The model generates its response with awareness of live market conditions.

This architecture ensures that when a user asks "What is BTC doing right now?", the model has access to the actual current price rather than relying on training data or hallucinating a value.

---

## Caching Strategy

All caching uses Vercel KV (Redis) as the primary store with an in-memory Map as fallback when KV is unavailable.

| Data Type       | TTL       | Rationale                                      |
| --------------- | --------- | ---------------------------------------------- |
| Tickers         | 30 seconds | Price data must stay near-real-time             |
| Candles (OHLCV) | 5 minutes  | Historical bars change infrequently             |
| News headlines  | 15 minutes | RSS feeds update at moderate intervals          |
| Sentiment scores| 15 minutes | Aligned with news cache to avoid stale pairings |
| Market summary  | 15 minutes | Aligned with news cache                         |
| Products list   | 1 hour     | Exchange product catalog rarely changes         |

The fallback in-memory cache ensures the dashboard remains functional during Vercel KV outages, though it does not persist across serverless cold starts.

---

## Rate Limits and Mitigations

**Groq API:**

- Groq enforces per-minute token and request limits on free and paid tiers.
- Mitigation: Aggressive caching (15-minute TTLs on all AI outputs) reduces inference calls to a small fraction of total page views.
- Mitigation: Batch sentiment scoring processes all headlines in a single request rather than one per headline.
- Mitigation: Chat responses are capped at 512 tokens to stay within per-request budgets.

**Delta Exchange API:**

- Public endpoints are rate-limited by IP.
- Mitigation: Ticker data is cached for 30 seconds; product data for 1 hour.

**RSS Feeds:**

- Standard HTTP caching headers are respected. News data is cached for 15 minutes to avoid excessive polling.

---

## Limitations

1. **Hallucination Risk.** Despite context injection, the model may generate inaccurate price targets, incorrect historical data, or fabricated events. All AI outputs are presented as research aids, not trading signals.

2. **No Real-Time Streaming Data.** Market context is fetched at the time of each chat request. Prices may shift between the fetch and the user reading the response. The dashboard displays live tickers separately to mitigate this.

3. **Sentiment Approximation.** Headline-level sentiment scoring is inherently reductive. A single score cannot capture nuance, sarcasm, or context buried in the full article body. Scores should be treated as directional indicators, not precision measurements.

4. **Language Constraint.** All AI features operate in English only. Non-English headlines from RSS feeds may produce unreliable sentiment scores or be excluded from summaries.

5. **Model Dependency.** The system is tightly coupled to Groq and the Llama 3.3 70B Versatile model. Provider outages or model deprecation would require migration effort.

6. **Cache Staleness Window.** During the 15-minute cache window, breaking news will not appear in the AI summary until the cache expires.

---

## Future Roadmap

- **Multi-model support.** Abstract the inference layer to support fallback models (e.g., Groq Mixtral, OpenAI GPT-4o) for redundancy.
- **Streaming sentiment.** Move from batch to incremental sentiment scoring as new headlines arrive via WebSocket or polling.
- **User-scoped chat history.** Persist conversation threads per session to enable multi-turn research workflows.
- **Portfolio-aware context.** Inject user watchlist or portfolio data into chat context for personalized analysis.
- **Fine-tuned scoring model.** Train a lightweight sentiment classifier on crypto-specific data to reduce dependence on general-purpose LLMs for scoring.
- **Alerting integration.** Trigger notifications when AI sentiment shifts beyond configurable thresholds.
