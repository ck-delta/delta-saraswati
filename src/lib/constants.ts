// === Delta Saraswati Constants ===

// Delta Exchange API
export const DELTA_API_BASE = 'https://api.delta.exchange/v2';
// Use India endpoint if needed: 'https://api.india.delta.exchange/v2'

// CoinGecko API
export const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';

// Fear & Greed Index
export const FEAR_GREED_API = 'https://api.alternative.me/fng';

// Groq AI
export const GROQ_MODEL = 'llama-3.3-70b-versatile';

// === Top tokens to feature on the Daily Pulse home page ===
export const TOP_TOKENS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'] as const;

// === Symbol mapping: Delta symbol → display info ===
// Delta Exchange uses USDT-suffixed symbols for perpetual futures
export const TOKEN_INFO: Record<string, { name: string; coingeckoId: string; icon: string }> = {
  BTCUSDT: { name: 'Bitcoin', coingeckoId: 'bitcoin', icon: '/icons/btc.svg' },
  ETHUSDT: { name: 'Ethereum', coingeckoId: 'ethereum', icon: '/icons/eth.svg' },
  SOLUSDT: { name: 'Solana', coingeckoId: 'solana', icon: '/icons/sol.svg' },
  DOGEUSDT: { name: 'Dogecoin', coingeckoId: 'dogecoin', icon: '/icons/doge.svg' },
  XRPUSDT: { name: 'XRP', coingeckoId: 'ripple', icon: '/icons/xrp.svg' },
  METAXUSDT: { name: 'Meta', coingeckoId: 'meta-platforms', icon: '/icons/meta.svg' },
  TSLAXUSDT: { name: 'Tesla', coingeckoId: 'tesla-stock-token', icon: '/icons/tsla.svg' },
  NVDAXUSDT: { name: 'Nvidia', coingeckoId: 'nvidia-stock-token', icon: '/icons/nvda.svg' },
  PAXGUSDT: { name: 'Pax Gold', coingeckoId: 'pax-gold', icon: '/icons/paxg.svg' },
};

// === Cache TTLs (milliseconds) ===
export const CACHE_TTL = {
  TICKERS: 30 * 1000,        // 30 seconds
  CANDLES: 60 * 1000,        // 1 minute
  ORDERBOOK: 10 * 1000,      // 10 seconds
  MARKET_DATA: 30 * 1000,    // 30 seconds
  NEWS: 5 * 60 * 1000,       // 5 minutes
  FEAR_GREED: 30 * 60 * 1000, // 30 minutes
  DAILY_PULSE: 15 * 60 * 1000, // 15 minutes
  SENTIMENT: 5 * 60 * 1000,  // 5 minutes
} as const;

// === RSS News Feeds ===
export const RSS_FEEDS = [
  { name: 'CoinTelegraph', url: 'https://cointelegraph.com/rss' },
  { name: 'Decrypt', url: 'https://decrypt.co/feed' },
  { name: 'Bitcoin Magazine', url: 'https://bitcoinmagazine.com/feed' },
  { name: 'CoinDesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/' },
] as const;

// === Fear & Greed color mapping ===
export const FEAR_GREED_COLORS: Record<string, string> = {
  'Extreme Fear': '#ff4d4f',
  'Fear': '#ff8c00',
  'Neutral': '#ffd700',
  'Greed': '#90ee90',
  'Extreme Greed': '#00c076',
};

// === Chat quick actions ===
export const QUICK_ACTIONS = [
  {
    id: 'market_overview',
    label: 'Market Overview',
    icon: 'BarChart3',
    prompt: 'Give me a comprehensive overview of the current crypto market. Include price movements of major tokens, market sentiment, and any notable events.',
    contextType: 'market_overview' as const,
  },
  {
    id: 'gainers_losers',
    label: 'Top Gainers / Losers',
    icon: 'TrendingUp',
    prompt: 'Show me the top gainers and losers on Delta Exchange in the last 24 hours with their percentage changes.',
    contextType: 'gainers_losers' as const,
  },
  {
    id: 'news',
    label: 'News Summary',
    icon: 'Newspaper',
    prompt: 'Summarize the most important crypto news from the past 24 hours. Include any macro events affecting the market.',
    contextType: 'news' as const,
  },
  {
    id: 'whale',
    label: 'Whale Activity',
    icon: 'Fish',
    prompt: 'What whale activity and large transactions have been notable recently? Include any institutional buying or selling signals.',
    contextType: 'whale' as const,
  },
  {
    id: 'liquidation',
    label: 'Liquidation Data',
    icon: 'Flame',
    prompt: 'What are the recent liquidation numbers across the crypto market? Break down long vs short liquidations.',
    contextType: 'liquidation' as const,
  },
  {
    id: 'funding',
    label: 'Funding Rates',
    icon: 'Percent',
    prompt: 'Show me the current funding rates for the top perpetual futures on Delta Exchange and explain what they indicate.',
    contextType: 'funding' as const,
  },
];

// === Design tokens (matching Delta Exchange) ===
export const DESIGN = {
  colors: {
    dark: '#101013',
    light: '#fafafa',
    surface: '#1a1a1f',
    surfaceAlt: '#222228',
    border: '#2a2a32',
    accent: '#fd7d02',     // Orange (Indian theme default)
    accentBlue: '#2894f9', // Blue (global theme)
    buy: '#00c076',
    sell: '#ff4d4f',
    textPrimary: '#ffffff',
    textSecondary: '#9ca3af',
    textMuted: '#6b7280',
  },
} as const;
