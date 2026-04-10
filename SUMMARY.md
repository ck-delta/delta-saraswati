# Delta Saraswati -- Executive Summary

## What It Is

Delta Saraswati is a proprietary, AI-powered crypto perpetuals research dashboard
that delivers real-time market data from Delta Exchange alongside instant AI-generated
analysis. Built for traders and analysts who require institutional-quality tooling
in a streamlined interface, the platform combines live pricing, deep technical
indicators, TradingView charting, and a conversational AI assistant into a single,
high-performance web application.

---

## Key Differentiators

- **Real-Time Delta Exchange Data** -- Direct integration with the Delta Exchange
  API surfaces live perpetual contract prices, funding rates, volumes, and order
  book depth with minimal latency.

- **Groq-Powered AI Inference** -- Natural-language market summaries and an
  interactive chat assistant run on Groq's ultra-low-latency infrastructure using
  Llama 3.3 70B, delivering institutional-grade analysis in milliseconds.

- **Institutional-Grade Dark UI** -- A purpose-built dark terminal aesthetic
  (#08080c background, amber/gold accents) reduces eye strain during extended
  sessions and presents dense financial data with exceptional clarity.

- **India-First with Global Reach** -- Designed around the Indian crypto derivatives
  market while remaining fully accessible to a global audience; all data and
  insights are denominated in USD perpetuals.

- **Comprehensive Technical Analysis** -- Fourteen technical indicators (RSI, MACD,
  Bollinger Bands, ADX, Stochastic, pivot points, and more) with computed
  Buy/Sell/Neutral signals give traders a complete analytical toolkit without
  leaving the dashboard.

---

## Tech Stack Summary

| Layer              | Technology                          |
|--------------------|-------------------------------------|
| Framework          | Next.js 16 (App Router)             |
| UI Library         | React 19                            |
| Styling            | Tailwind CSS v4                     |
| AI Model           | Llama 3.3 70B via Groq              |
| Charting           | TradingView Lightweight Charts      |
| Hosting / Edge     | Vercel Edge Network                 |
| Caching            | Vercel KV (Redis)                   |

---

## Live Demo

https://delta-saraswati.vercel.app

---

## Feature Highlights

- **Daily Pulse** -- AI-generated market summary refreshed throughout the trading
  day, covering top movers, macro sentiment, and notable funding rate shifts.
- **Token Analysis** -- Full-page research view with TradingView charts, real-time
  order book snapshots, and a panel of technical indicators with overall
  Buy/Sell signal aggregation.
- **AI Chat Assistant** -- Conversational interface for on-demand market questions,
  strategy brainstorming, and data lookups powered by Groq inference.
- **Responsive Design** -- Optimized for desktop workstations and mobile devices
  alike, ensuring access from any trading environment.

---

## Status and Roadmap

The platform is live in production and under active development. Near-term
priorities include portfolio tracking and alerting, expanded asset coverage
beyond perpetuals, and user authentication for personalized watchlists. Longer-term
plans encompass backtesting integrations, multi-exchange data aggregation, and
on-chain analytics.
