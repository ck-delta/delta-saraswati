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
export const TOKEN_INFO: Record<string, { name: string; coingeckoId: string; icon: string; tagline?: string }> = {
  BTCUSDT:   { name: 'Bitcoin',  coingeckoId: 'bitcoin',           icon: '/icons/btc.svg',  tagline: 'First cryptocurrency · digital gold · largest crypto by market cap' },
  ETHUSDT:   { name: 'Ethereum', coingeckoId: 'ethereum',          icon: '/icons/eth.svg',  tagline: 'Leading smart contract platform · ETH 2.0 proof-of-stake · DeFi + NFT backbone' },
  SOLUSDT:   { name: 'Solana',   coingeckoId: 'solana',            icon: '/icons/sol.svg',  tagline: 'High-throughput L1 · fast, cheap transactions · memecoin hub' },
  DOGEUSDT:  { name: 'Dogecoin', coingeckoId: 'dogecoin',          icon: '/icons/doge.svg', tagline: 'Original memecoin · PoW · retail-driven narrative' },
  XRPUSDT:   { name: 'XRP',      coingeckoId: 'ripple',            icon: '/icons/xrp.svg',  tagline: 'Cross-border payments network · Ripple-led ecosystem' },
  METAXUSDT: { name: 'Meta',     coingeckoId: 'meta-platforms',    icon: '/icons/meta.svg', tagline: 'Tokenised stock — Meta Platforms (Facebook, Instagram, WhatsApp)' },
  TSLAXUSDT: { name: 'Tesla',    coingeckoId: 'tesla-stock-token', icon: '/icons/tsla.svg', tagline: 'Tokenised stock — Tesla, electric vehicles and energy' },
  NVDAXUSDT: { name: 'Nvidia',   coingeckoId: 'nvidia-stock-token',icon: '/icons/nvda.svg', tagline: 'Tokenised stock — Nvidia, AI chip maker' },
  AMZNXUSDT: { name: 'Amazon',   coingeckoId: 'amazon',            icon: '/icons/amzn.svg', tagline: 'Tokenised stock — Amazon, e-commerce and AWS cloud' },
  AAPLXUSDT: { name: 'Apple',    coingeckoId: 'apple',             icon: '/icons/aapl.svg', tagline: 'Tokenised stock — Apple, largest consumer electronics company' },
  GOOGLXUSDT:{ name: 'Google',   coingeckoId: 'google',            icon: '/icons/googl.svg',tagline: 'Tokenised stock — Alphabet / Google' },
  PAXGUSDT:  { name: 'Pax Gold', coingeckoId: 'pax-gold',          icon: '/icons/paxg.svg', tagline: 'Gold-backed token · each PAXG = 1 troy oz of LBMA-certified gold' },
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
// `domain` is used for favicon fetching (Google Favicon Service).
// `tier` is informational: 'crypto-core' | 'generalist' | 'defi' | 'tradfi'.
export const RSS_FEEDS = [
  // Core crypto press
  { name: 'CoinTelegraph',     url: 'https://cointelegraph.com/rss',                        domain: 'cointelegraph.com',    tier: 'crypto-core' },
  { name: 'Decrypt',           url: 'https://decrypt.co/feed',                              domain: 'decrypt.co',           tier: 'crypto-core' },
  { name: 'Bitcoin Magazine',  url: 'https://bitcoinmagazine.com/feed',                     domain: 'bitcoinmagazine.com',  tier: 'crypto-core' },
  { name: 'CoinDesk',          url: 'https://www.coindesk.com/arc/outboundfeeds/rss/',      domain: 'coindesk.com',         tier: 'crypto-core' },

  // Generalist crypto
  { name: 'The Block',         url: 'https://www.theblock.co/rss.xml',                      domain: 'theblock.co',          tier: 'generalist' },
  { name: 'Crypto Briefing',   url: 'https://cryptobriefing.com/feed/',                     domain: 'cryptobriefing.com',   tier: 'generalist' },
  { name: 'Blockworks',        url: 'https://blockworks.co/feed',                           domain: 'blockworks.co',        tier: 'generalist' },
  { name: 'U.Today',           url: 'https://u.today/rss',                                  domain: 'u.today',              tier: 'generalist' },

  // DeFi + analytical
  { name: 'The Defiant',       url: 'https://thedefiant.io/feed',                           domain: 'thedefiant.io',        tier: 'defi' },
  { name: 'DL News',           url: 'https://www.dlnews.com/arc/outboundfeeds/rss/',        domain: 'dlnews.com',           tier: 'defi' },
  { name: 'Bankless',          url: 'https://www.bankless.com/rss.xml',                     domain: 'bankless.com',         tier: 'defi' },
  { name: 'Milk Road',         url: 'https://milkroad.com/feed/',                           domain: 'milkroad.com',         tier: 'defi' },

  // Macro / TradFi crypto coverage
  { name: 'Reuters Crypto',    url: 'https://www.reuters.com/technology/rss',               domain: 'reuters.com',          tier: 'tradfi' },
  { name: 'Bloomberg Crypto',  url: 'https://feeds.bloomberg.com/crypto/news.rss',          domain: 'bloomberg.com',        tier: 'tradfi' },
  { name: 'FT Crypto',         url: 'https://www.ft.com/cryptocurrencies?format=rss',       domain: 'ft.com',               tier: 'tradfi' },
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
