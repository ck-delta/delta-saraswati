# Delta Saraswati

**AI-powered crypto perpetuals research dashboard.**

[![Next.js 16](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Tailwind v4](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Groq AI](https://img.shields.io/badge/Groq-AI-F55036?style=flat-square)](https://groq.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000?style=flat-square&logo=vercel)](https://vercel.com/)

![Delta Saraswati Dashboard](./screenshots/dashboard.png)

**Live Demo**: [https://delta-saraswati.vercel.app](https://delta-saraswati.vercel.app)

---

## Overview

Delta Saraswati is a premium dark-themed research dashboard purpose-built for crypto perpetual futures traders. It aggregates real-time market data from Delta Exchange India, pairs it with institutional-grade technical analysis, and layers on AI-driven market intelligence powered by Groq's Llama 3.3 70B model. The result is a unified command center where traders can monitor positions, evaluate sentiment, and execute research workflows without switching between fragmented tools.

The platform is designed for serious traders and institutional desks who demand low-latency data, actionable signals, and professional-grade visualization. TradingView Lightweight Charts provide interactive, multi-timeframe charting. AI systems deliver structured market briefings, per-headline sentiment scoring, and a conversational assistant with live market context injection — turning raw data into decision-ready intelligence.

Delta Saraswati is India-first in its data sourcing and regulatory context, built on Delta Exchange India's perpetual futures API, but its analytical framework and user experience are designed for global reach. Whether you are a quantitative researcher in Mumbai or a portfolio manager in Singapore, the dashboard provides the depth and precision required for professional perpetuals trading.

---

## Features

### Real-Time Market Data

- Live perpetual futures pricing streamed from the Delta Exchange India API
- Top tokens ranked by 24-hour trading volume with automatic refresh
- Configurable live polling intervals for latency-sensitive workflows
- Inline sparkline charts for rapid visual trend assessment across the watchlist

### AI Intelligence

- **AI Market Summary** — Structured five-section briefing covering macro conditions, sector rotation, volatility outlook, key levels, and actionable takeaways, generated on demand via Groq
- **AI Sentiment Scoring** — Per-headline sentiment analysis on a 0-100 scale, applied across aggregated news feeds to surface directional bias
- **AI Chat Assistant** — Conversational interface with live market context injection, enabling natural-language queries against real-time pricing, technicals, and news data

### Technical Analysis

- RSI (Relative Strength Index) with overbought/oversold threshold alerts
- MACD (Moving Average Convergence Divergence) with histogram and signal line crossover detection
- Simple Moving Averages across 20, 50, and 200 periods for short-, medium-, and long-term trend identification
- ADX (Average Directional Index) for trend strength quantification
- Pivot Point calculations with support and resistance levels (S1/S2/S3, R1/R2/R3)
- Overall Buy/Sell signal aggregation with weighted reasoning across all indicators
- TradingView Lightweight Charts with multiple timeframe support and interactive crosshairs

### Market Intelligence

- Crypto Fear and Greed Index integration for broad market sentiment context
- News aggregation pipeline pulling from CoinDesk, CoinTelegraph, and Decrypt via RSS
- Automated feed refresh with deduplication and timestamp normalization

### Premium User Interface

- Dark theme engineered in oklch color space for perceptually uniform contrast and readability
- Framer Motion animations for fluid transitions, micro-interactions, and data state changes
- Fully responsive layout adapting from ultrawide monitors to mobile viewports
- Progressive Web App (PWA) support for installable, offline-capable access

---

## Pages

### Home — Daily Pulse

The default landing view. Presents a consolidated market overview: top movers, AI-generated market summary, Fear and Greed Index, aggregated news feed with sentiment scores, and sparkline charts for high-volume perpetual contracts. Designed for a sub-30-second daily briefing.

### Research — Token Analysis

Deep-dive analysis for individual tokens. Select any listed perpetual contract to access full technical indicator suites, multi-timeframe TradingView charts, support/resistance levels, and the aggregated Buy/Sell signal with per-indicator reasoning breakdowns.

### Chat — AI Assistant

A conversational AI interface powered by Groq's Llama 3.3 70B model. The assistant receives injected context including live prices, technical indicator states, and recent news headlines, enabling informed responses to natural-language trading queries without manual data lookup.

---

## Tech Stack

| Category       | Technology                                      |
| -------------- | ----------------------------------------------- |
| Framework      | Next.js 16 (App Router)                         |
| UI Library     | React 19                                        |
| Styling        | Tailwind CSS v4, oklch color system              |
| Components     | shadcn/ui, Framer Motion                        |
| AI Engine      | Groq SDK, Llama 3.3 70B Versatile               |
| Charts         | TradingView Lightweight Charts                  |
| Data Source    | Delta Exchange India API, RSS aggregation        |
| State          | Zustand, SWR                                    |
| Infrastructure | Vercel, Vercel KV (Redis)                       |
| Analysis       | technicalindicators library                     |
| Language       | TypeScript 5                                    |

---

## Architecture

Delta Saraswati follows a layered architecture pattern built on the Next.js App Router. Server Components handle data fetching and SSR for SEO-critical pages, while Client Components manage interactive charting, real-time polling, and AI chat state. External data flows through server-side API routes that normalize, cache (via Vercel KV), and relay responses to the frontend. AI inference is offloaded to Groq's hosted API for sub-second response latency.

For a detailed breakdown of the system architecture, data flow diagrams, and component hierarchy, see [Architecture Documentation](./ARCHITECTURE.md).

---

## Documentation

| Document                                   | Description                                      |
| ------------------------------------------ | ------------------------------------------------ |
| [Architecture](./ARCHITECTURE.md)          | System architecture, data flow, component layers |
| [Design System](./DESIGN.md)               | Color tokens, typography, spacing, theming       |
| [Data Sources](./DATASOURCES.md)           | API integrations, RSS feeds, data normalization  |
| [UI Components](./UI.md)                   | Component library reference and usage patterns   |
| [User Experience](./UX.md)                 | UX principles, interaction patterns, navigation  |
| [Visual Design](./VISUAL.md)              | Visual language, animations, dark theme system   |
| [AI Features](./AI.md)                     | AI models, prompts, context injection, scoring   |
| [SEO Strategy](./SEO.md)                   | Metadata, structured data, indexing strategy     |
| [Geo-Targeting](./GEO.md)                  | India-first targeting, regional considerations   |
| [OG Tags](./OG-TAGS.md)                    | Open Graph and social preview configuration      |
| [Executive Summary](./SUMMARY.md)          | High-level product overview for stakeholders     |
| [Privacy Policy](./PRIVACY.md)             | Data handling, cookies, third-party services     |
| [Terms of Service](./TERMS.md)             | Usage terms and legal disclaimers                |
| [Contributing](./CONTRIBUTING.md)          | Contribution guidelines and development setup    |

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/your-org/delta-saraswati.git
cd delta-saraswati/lima

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
```

Open `.env.local` and add your API keys:

```env
GROQ_API_KEY=your_groq_api_key_here
```

```bash
# Start the development server
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable        | Required | Description                          |
| --------------- | -------- | ------------------------------------ |
| `GROQ_API_KEY`  | Yes      | Groq API key for AI inference        |
| `KV_REST_API_URL` | No     | Vercel KV endpoint for caching       |
| `KV_REST_API_TOKEN` | No   | Vercel KV authentication token       |

---

## Deployment

Delta Saraswati is deployed on Vercel with automatic CI/CD from the main branch. Production builds leverage Next.js static optimization, edge caching, and Vercel KV for server-side data persistence.

Production URL: [https://delta-saraswati.vercel.app](https://delta-saraswati.vercel.app)

---

## License

This software is proprietary and confidential. Unauthorized copying, distribution, or modification is strictly prohibited. See [LICENSE](./LICENSE) for full terms.

---

Built with precision for the perpetuals trading community.
