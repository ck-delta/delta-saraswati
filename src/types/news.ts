// Types for news data

export interface NewsItem {
  id: string;
  title: string;
  description: string;
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
