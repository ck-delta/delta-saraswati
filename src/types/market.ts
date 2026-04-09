// Types for aggregated market data used by the frontend

export interface TokenCardData {
  symbol: string;           // Delta symbol e.g. 'BTCUSD'
  name: string;             // Full name e.g. 'Bitcoin'
  underlying: string;       // e.g. 'BTC'
  price: number;
  priceChange24h: number;   // Absolute change
  priceChangePct24h: number; // Percentage change
  high24h: number;
  low24h: number;
  volume24h: number;
  turnoverUsd: number;
  openInterest: number;
  openInterestUsd: number;
  fundingRate: number;
  markPrice: number;
  spotPrice: number;
  // From CoinGecko (may be null if API fails)
  marketCap: number | null;
  // AI-generated sentiment
  sentimentScore: number | null;  // 0-100
  sentimentLabel: string | null;  // 'Bearish' | 'Neutral' | 'Bullish' | etc.
}

export interface FearGreedData {
  value: number;           // 0-100
  classification: string;  // 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed'
  timestamp: number;
}

export interface MarketDataResponse {
  tokens: TokenCardData[];
  fearGreed: FearGreedData | null;
  allTickers: TokenCardData[];
  stale?: boolean;
  timestamp: number;
}
