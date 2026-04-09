// Types for news data

export interface NewsItem {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;  // ISO date string
  imageUrl?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  sentimentScore?: number; // -1 to 1
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
