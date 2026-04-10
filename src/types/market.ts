export interface FearGreedData {
  value: number;
  classification: string; // "Extreme Fear" | "Fear" | "Neutral" | "Greed" | "Extreme Greed"
  timestamp: number;
}

export interface NewsHeadline {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  sentiment: "positive" | "negative" | "neutral";
  sentimentScore: number;
}

export interface NewsSummary {
  summary: string;
  generatedAt: string;
  headlines: NewsHeadline[];
}

export interface TokenSentiment {
  symbol: string;
  score: number;
  explanation: string;
}

export interface Indicators {
  rsi: number | null;
  macd: { value: number; signal: number; histogram: number } | null;
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
}

export interface TokenData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap?: number;
  fundingRate: number;
  oiValueUsd: number;
  oiChange6h: number;
  markPrice: number;
  spotPrice: number;
  icon?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  cached: boolean;
  timestamp: number;
  error?: string;
}
