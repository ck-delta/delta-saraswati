# Geographic Strategy — Delta Saraswati

## Overview

Delta Saraswati is built with an India-first approach, reflecting the use of the Delta Exchange India API and INR-denominated perpetual futures data. The application is accessible globally via Vercel Edge CDN but is designed primarily for Indian crypto traders and researchers.

---

## India-First Strategy

### Delta Exchange India API

- **Base URL:** `https://api.india.delta.exchange/v2`
- The application exclusively uses the India-region Delta Exchange API, which serves perpetual futures contracts available on the Indian platform.
- Product listings, ticker data, OHLCV candles, and order book snapshots all originate from this endpoint.

### INR-Denominated Perpetuals

- Delta Exchange India lists perpetual futures contracts settled and margined in INR (Indian Rupees).
- The dashboard displays prices in the native denomination of the exchange, ensuring accuracy for Indian users without currency conversion artifacts.
- USD price equivalents are displayed alongside where relevant, sourced from market data.

### Target Audience

- Indian retail crypto traders researching perpetual futures positions.
- Indian investors seeking AI-assisted market analysis in a regulatory-compliant research context.
- Developers and analysts in the Indian crypto ecosystem evaluating Delta Exchange products.

---

## India Crypto Regulations

The following regulatory context is relevant to the application and its users. This section is informational and does not constitute legal or tax advice.

### Taxation Framework

| Provision                    | Detail                                                        |
| ---------------------------- | ------------------------------------------------------------- |
| Capital gains tax on VDAs    | 30% flat tax on gains from transfer of Virtual Digital Assets |
| Tax Deducted at Source (TDS) | 1% TDS on transfer of VDAs above threshold limits             |
| Loss offset                  | No offset of crypto losses against other income categories     |
| Classification               | VDAs classified under the Income Tax Act, 1961                |

### Regulatory Environment

- The Reserve Bank of India (RBI) does not recognize cryptocurrencies as legal tender.
- Crypto exchanges operating in India must comply with Prevention of Money Laundering Act (PMLA) requirements.
- The regulatory landscape remains evolving; users should consult qualified tax professionals for compliance guidance.

### Application Disclaimer

Delta Saraswati is a research and analysis tool. It is not a crypto exchange, does not facilitate trading, and does not custody any user funds. The application:

- Does not execute trades on behalf of users.
- Does not collect KYC or financial information.
- Does not provide financial, tax, or investment advice.
- Displays publicly available market data and AI-generated research summaries for informational purposes only.

---

## Global Reach

### Vercel Edge CDN

- The application is deployed on Vercel and served via its global Edge Network.
- Static assets and pre-rendered pages are distributed to edge nodes worldwide, ensuring low-latency access regardless of user location.
- Serverless API functions execute in Vercel's default region but respond with cached data for most requests.

### Language and Currency

- All UI content is in English.
- Primary price display uses the denomination native to Delta Exchange India (INR-settled contracts).
- USD equivalent prices are shown where sourced from market data (e.g., Fear and Greed Index, global BTC price).

### International Accessibility

- No geographic access restrictions are enforced at the application level.
- Users outside India can access the dashboard but should note that the data reflects the Delta Exchange India product catalog, which may differ from global Delta Exchange offerings.

---

## Localization Roadmap

### Multi-Language Support

- The Next.js app router supports internationalized routing via middleware-based locale detection.
- Priority languages for future consideration: Hindi, Tamil, Telugu, Kannada (Indian regional languages with significant crypto trading populations).
- Implementation would use Next.js `i18n` routing with locale-prefixed paths (e.g., `/hi/`, `/ta/`).

### Regional News Sources

- Current RSS feeds (CoinDesk, CoinTelegraph, Decrypt) are English-language and globally focused.
- Future iterations could integrate India-specific crypto news sources for more relevant sentiment analysis and market summaries.

### Local Regulatory Pages

- Dedicated pages explaining Indian crypto tax obligations and compliance requirements could serve both SEO and user education purposes.
- These pages would target long-tail keywords such as "crypto tax India 2026" and "VDA TDS rules."

---

## Technical Implementation

### API Base URL Configuration

The Delta Exchange India API base URL is configured as a constant, enabling straightforward migration to other regional endpoints if needed:

```
API Base: https://api.india.delta.exchange/v2
```

Switching to the global Delta Exchange API (`https://api.delta.exchange/v2`) would require updating this single configuration value and verifying product ID compatibility.

### Vercel Edge Deployment

- The application is deployed to Vercel with automatic edge distribution.
- No region pinning is applied to static assets; they propagate to all edge nodes.
- Serverless functions default to the deployment region but can be configured for multi-region execution if latency-sensitive API routes require it.
- Future optimization: pin serverless functions to `bom1` (Mumbai) for lowest latency to the Delta Exchange India API servers.
