# Bybit TradeGPT — Feature Analysis

## Overview
TradeGPT is Bybit's AI-powered crypto market assistant providing real-time analysis and expert insights. It serves as a research companion for traders — answering market questions, analyzing tokens, and surfacing trading signals.

---

## Interface Structure

### Navigation Tabs
1. **New Chat** — fresh conversation with the AI
2. **Lens** — market intelligence/overview dashboard
3. **Daily Pulse** — trending information and daily market highlights

### Chat Interface
- Input prompt: "Ask me anything about the crypto markets"
- **Deep Think mode** — extended analysis with longer processing time for complex queries
- Session management with rename/delete capabilities
- Chat history preserved across sessions

---

## Core Capabilities

### 1. Market Analysis
- Real-time price movements and trend analysis
- Trading volume metrics and breakdowns
- Market-wide sentiment indicators
- Macro news integration and impact analysis

### 2. Smart Token Insights
Individual token deep-dives including:

**Price & Market Data**
- Current price, 24H high/low, all-time high with date
- Market cap, fully diluted valuation (FDV)
- Circulating supply, total supply, max supply
- 24H trading volume and turnover rate
- Network and contract address details

**Technical Indicators**
- Golden Cross / Death Cross signals
- Oversold / Overbought conditions
- Bollinger Band touches (upper/lower)
- Bullish vs bearish signal counts
- Expected pump/dip projections

**Tokenomics Analysis**
- Token allocation breakdowns
- Unlock timeline visualization
- Supply distribution metrics

**Fundraising Intelligence**
- Investment round history (past year + historical)
- Valuation data per round
- Lead investor information
- Portfolio diversification metrics

### 3. Whale & Flow Signals
- Real-time whale trader signals from Bybit
- Long vs short ratio analysis
- 24H inflow/outflow tracking with net flow
- User behavior trends (most traded, searched, starred tokens)

### 4. Community & Social Metrics
- X (Twitter) followers and engagement stats
- GitHub code submission tracking
- Google Trends data
- Media exposure quantification
- Social popularity scoring
- AI-generated community assessment score

### 5. News Integration
- Latest crypto news with AI-generated summaries
- Source citations with article counts ("Found {n} article(s)")
- Expandable "More sources" sections
- Timestamp updates in UTC
- Token-specific activity summaries

### 6. Bybit Product Updates
- Platform feature announcements
- New trading product launches
- Promotional offers and campaigns

---

## Response Format

### Content Presentation
- AI-generated text responses with structured sections
- Data tables for token metrics (price, market cap, supply, etc.)
- Signal indicators (bullish/bearish counts)
- Ranked lists (most traded, most searched)
- Citation links to source articles
- Timestamp for data freshness

### Disclaimers
- Every response labeled: "AI-generated. Please use for reference only"
- Third-party data attribution: "Information on this page is provided by third parties and is for reference only"
- Not financial advice positioning

---

## User Access Model

### Authentication
- Limited trial queries without login
- Bybit account required for extended access
- Subaccount restrictions (trading bots unavailable on subaccounts)

### Query Limits
- Daily submission caps (reset every 24 hours)
- "Daily query limit reached. Please try again tomorrow" message
- Session expiration when context exceeds limits

---

## Trading Integration
Direct links from analysis to action:
- **Spot trading** — buy/sell tokens directly
- **Futures trading** — open leveraged positions
- **Margin trading** — borrow and trade
- **Crypto loans** — collateralized borrowing
- **Grid trading bot** — automated grid strategies
- **DCA bot** — dollar-cost averaging automation
- **Trade Now** button on token analysis pages

---

## Social & Sharing Features
- Share project summaries with custom messages
- Multi-item selection (max 3 items per share)
- Favorite tokens/projects for quick access
- Export capabilities

---

## Deep Think Mode
- Togglable mode for complex queries
- Longer processing time for more thorough analysis
- Presumably uses more compute/longer reasoning chains
- Useful for multi-factor analysis and detailed token evaluations

---

## Key Takeaways for Saraswati

### What Works Well
- **Data richness**: Whale signals, technical indicators, tokenomics, social metrics all in one place
- **Actionable**: Direct trading links from analysis
- **Structured responses**: Clean data tables, clear sections
- **Source transparency**: Citations and timestamps build trust
- **Deep Think**: Power user feature for complex analysis

### Gaps / Opportunities
- Daily query limits frustrate active users
- No portfolio-aware analysis (doesn't know your positions)
- Limited to Bybit ecosystem data
- No custom alerts or watchlist integration within chat
- No backtesting or strategy simulation
- No options-specific analysis (Delta's differentiator)

### Saraswati Differentiators (potential)
- **Options & derivatives focus** — Greeks, IV analysis, strategy recommendations
- **Delta Exchange data integration** — order book depth, funding rates, OI analysis
- **Indian market context** — INR settlement, Indian regulatory awareness
- **Portfolio-aware** — analyze user's actual positions and suggest hedges
- **No arbitrary query limits** — or more generous tier structure
- **Strategy builder integration** — AI-suggested multi-leg strategies
