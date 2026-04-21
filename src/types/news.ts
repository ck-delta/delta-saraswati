// Types for news data

export interface NewsItem {
  id: string;
  title: string;
  description: string;
  /** First ~400 chars of article body/snippet, used for Groq classification. */
  body?: string;
  url: string;
  source: string;
  /** Domain of the source, used for favicon fetch. */
  sourceDomain?: string;
  publishedAt: string;  // ISO date string
  imageUrl?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  sentimentScore?: number; // 0-100 (AI-assigned impact-weighted score)
  // Filled by the Groq batch classifier:
  affectedTokens?: string[];            // e.g. ["BTCUSDT", "ETHUSDT"]
  priceImpactTier?: 'severe' | 'major' | 'moderate' | 'minor' | 'negligible';
  breadthTier?: 'systemic' | 'cross-asset' | 'sector-wide' | 'token-specific';
  forwardTier?: 'regime-change' | 'trend-confirmation' | 'isolated' | 'contrary';
  /** How many *other* sources corroborated this story. 0 = unique. */
  corroborations?: number;
  /** Names of corroborating sources (for tooltip). */
  corroboratingSources?: string[];
  /** True when this headline is part of a news storm (velocity boost). */
  inStorm?: boolean;
}

export interface DailyPulseResponse {
  summary: string;       // AI-generated market overview paragraph(s)
  highlights: string[];  // 3-5 bullet points
  timestamp: number;
  stale?: boolean;
}

export interface SentimentScore {
  symbol: string;
  score: number;    // 0-100
  label: string;    // 'Very Bearish' | 'Bearish' | 'Neutral' | 'Bullish' | 'Very Bullish'
  reasoning: string; // One sentence explanation
}
