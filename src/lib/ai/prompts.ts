import type { TokenCardData } from '@/types/market';
import type { NewsItem, SentimentScore } from '@/types/news';

// ---------------------------------------------------------------------------
// 1. Daily Pulse — market overview
// ---------------------------------------------------------------------------

export function getDailyPulsePrompt(
  marketData: {
    topTokens: TokenCardData[];
    fearGreedValue?: number;
    fearGreedLabel?: string;
    totalVolume24h?: number;
  },
  newsHeadlines: string[],
): string {
  const tokenSummaries = marketData.topTokens
    .map(
      (t) =>
        `${t.symbol}: $${t.price.toLocaleString()} (${t.priceChangePct24h >= 0 ? '+' : ''}${t.priceChangePct24h.toFixed(2)}%), ` +
        `vol $${(t.turnoverUsd / 1e6).toFixed(1)}M, OI $${(t.openInterestUsd / 1e6).toFixed(1)}M, ` +
        `funding ${(t.fundingRate * 100).toFixed(4)}%`,
    )
    .join('\n');

  const headlines = newsHeadlines.slice(0, 8).map((h, i) => `${i + 1}. ${h}`).join('\n');

  return `You are Saraswati, Delta Exchange's AI research assistant specializing in cryptocurrency markets.

Write a concise daily market overview (2-3 short paragraphs) covering:
- Current price action and notable movements for major tokens
- Market sentiment and macro context (if relevant from the headlines)
- Key observations about derivatives data (funding rates, open interest changes, volume)

Also produce 3-5 bullet-point highlights for a "Key Takeaways" section.

Be authoritative but balanced. Do NOT give financial advice. Always note that this is AI-generated analysis, not a trade recommendation.

=== LIVE MARKET DATA ===
${tokenSummaries}

Fear & Greed Index: ${marketData.fearGreedValue ?? 'N/A'} (${marketData.fearGreedLabel ?? 'N/A'})
Total 24h Volume: $${marketData.totalVolume24h ? (marketData.totalVolume24h / 1e9).toFixed(2) + 'B' : 'N/A'}

=== RECENT HEADLINES ===
${headlines || 'No headlines available.'}

Respond in JSON format:
{
  "summary": "Your 2-3 paragraph overview here...",
  "highlights": ["Highlight 1", "Highlight 2", "Highlight 3"]
}`;
}

// ---------------------------------------------------------------------------
// 2. Sentiment Analysis
// ---------------------------------------------------------------------------

export function getSentimentPrompt(
  tickers: TokenCardData[],
  headlines: string[],
): string {
  const tickerData = tickers
    .map(
      (t) =>
        `${t.symbol}: price $${t.price.toLocaleString()}, 24h change ${t.priceChangePct24h >= 0 ? '+' : ''}${t.priceChangePct24h.toFixed(2)}%, ` +
        `funding ${(t.fundingRate * 100).toFixed(4)}%, OI $${(t.openInterestUsd / 1e6).toFixed(1)}M`,
    )
    .join('\n');

  const headlinesList = headlines.slice(0, 10).map((h, i) => `${i + 1}. ${h}`).join('\n');

  return `You are a crypto market sentiment analyst. Given the market data and recent headlines below, produce a sentiment score for each token.

Scoring scale (0-100):
- 0-20: Very Bearish
- 21-40: Bearish
- 41-60: Neutral
- 61-80: Bullish
- 81-100: Very Bullish

Consider: price momentum, funding rate bias (positive = longs paying shorts, negative = shorts paying longs), open interest trends, and relevant news sentiment.

=== MARKET DATA ===
${tickerData}

=== HEADLINES ===
${headlinesList || 'No recent headlines.'}

Respond ONLY with valid JSON in this exact format:
{
  "scores": [
    {
      "symbol": "BTCUSD",
      "score": 72,
      "label": "Bullish",
      "reasoning": "One sentence explaining the score."
    }
  ]
}

Include one entry per token provided.`;
}

// ---------------------------------------------------------------------------
// 3. Chat System Prompt
// ---------------------------------------------------------------------------

export function getChatSystemPrompt(
  contextData?: {
    tokens?: TokenCardData[];
    fearGreed?: { value: number; classification: string } | null;
    headlines?: string[];
  },
): string {
  let liveContext = '';

  if (contextData?.tokens?.length) {
    const prices = contextData.tokens
      .slice(0, 10)
      .map(
        (t) =>
          `${t.symbol}: $${t.price.toLocaleString()} (${t.priceChangePct24h >= 0 ? '+' : ''}${t.priceChangePct24h.toFixed(2)}%)`,
      )
      .join(' | ');
    liveContext += `\n\nLive prices: ${prices}`;
  }

  if (contextData?.fearGreed) {
    liveContext += `\nFear & Greed Index: ${contextData.fearGreed.value}/100 (${contextData.fearGreed.classification})`;
  }

  if (contextData?.headlines?.length) {
    liveContext += `\nRecent headlines: ${contextData.headlines.slice(0, 5).join('; ')}`;
  }

  return `You are Saraswati, an AI crypto research assistant built for Delta Exchange.

Your role:
- Provide clear, concise analysis of crypto markets and derivatives data.
- Explain complex DeFi, on-chain, and derivatives concepts in accessible terms.
- Help users understand market conditions, funding rates, open interest, and price action.
- Reference Delta Exchange products and features when relevant.

Rules:
1. ALWAYS include a brief disclaimer that your analysis is not financial advice.
2. Format prices with appropriate precision (e.g., $67,432.50 for BTC, $0.1234 for small caps).
3. Be concise. Use bullet points for lists. Bold key numbers.
4. When citing data, note the source (Delta Exchange, CoinGecko, etc.).
5. If you don't have enough data to answer confidently, say so rather than guessing.
6. For technical analysis questions, explain your reasoning step by step.
7. Use markdown formatting for readability.${liveContext}`;
}

// ---------------------------------------------------------------------------
// 4. Token Research Prompt
// ---------------------------------------------------------------------------

export function getTokenResearchPrompt(
  tokenData: TokenCardData & {
    rsi14?: number | null;
    macdSignal?: 'bullish_cross' | 'bearish_cross' | 'neutral' | null;
    bollingerPosition?: 'above_upper' | 'near_upper' | 'middle' | 'near_lower' | 'below_lower' | null;
  },
): string {
  const price = `$${tokenData.price.toLocaleString()}`;
  const change = `${tokenData.priceChangePct24h >= 0 ? '+' : ''}${tokenData.priceChangePct24h.toFixed(2)}%`;
  const funding = `${(tokenData.fundingRate * 100).toFixed(4)}%`;
  const oi = `$${(tokenData.openInterestUsd / 1e6).toFixed(1)}M`;
  const vol = `$${(tokenData.turnoverUsd / 1e6).toFixed(1)}M`;

  let taSection = '';
  if (tokenData.rsi14 != null) {
    taSection += `\nRSI (14): ${tokenData.rsi14.toFixed(1)}`;
  }
  if (tokenData.macdSignal) {
    taSection += `\nMACD Signal: ${tokenData.macdSignal.replace(/_/g, ' ')}`;
  }
  if (tokenData.bollingerPosition) {
    taSection += `\nBollinger Position: ${tokenData.bollingerPosition.replace(/_/g, ' ')}`;
  }

  return `You are Saraswati, specialized in researching ${tokenData.name} (${tokenData.symbol}) on Delta Exchange.

Answer the user's question using the live data below. Be specific and data-driven.

=== ${tokenData.symbol} LIVE DATA ===
Price: ${price} (${change} 24h)
24h High / Low: $${tokenData.high24h.toLocaleString()} / $${tokenData.low24h.toLocaleString()}
24h Volume: ${vol}
Mark Price: $${tokenData.markPrice.toLocaleString()}
Spot Price: $${tokenData.spotPrice.toLocaleString()}
Funding Rate: ${funding}
Open Interest: ${oi}
${tokenData.marketCap ? `Market Cap: $${(tokenData.marketCap / 1e9).toFixed(2)}B` : ''}
${tokenData.sentimentLabel ? `AI Sentiment: ${tokenData.sentimentLabel} (${tokenData.sentimentScore}/100)` : ''}${taSection ? `\n\n=== TECHNICAL INDICATORS ===${taSection}` : ''}

Rules:
- Include a disclaimer that this is not financial advice.
- Explain derivative-specific metrics (funding rate, OI) in context.
- Use markdown formatting with bold numbers.
- Be concise but thorough.`;
}
