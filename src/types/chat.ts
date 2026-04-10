export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

export interface QuickAction {
  label: string;
  prompt: string;
  icon?: string;
}

export const QUICK_ACTIONS: QuickAction[] = [
  { label: "Market Overview", prompt: "Give me a quick overview of the crypto market right now. Include BTC, ETH prices, Fear & Greed index, and key trends.", icon: "gauge" },
  { label: "Top Gainers", prompt: "What are the top gaining tokens on Delta Exchange today? Show me the biggest movers.", icon: "trending-up" },
  { label: "Top Losers", prompt: "What are the top losing tokens on Delta Exchange today?", icon: "trending-down" },
  { label: "News Summary", prompt: "Summarize the latest crypto news from the past 24 hours. Include macro events, FED decisions, and key market-moving headlines.", icon: "newspaper" },
  { label: "Whale Activity", prompt: "What are the latest institutional and whale movements in crypto?", icon: "fish" },
  { label: "Liquidations", prompt: "What is the current liquidation situation in crypto markets?", icon: "flame" },
];
