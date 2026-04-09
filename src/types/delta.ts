// Types for Delta Exchange API responses
// Docs: https://docs.delta.exchange/

export interface DeltaTicker {
  symbol: string;
  product_id: number;
  contract_type: string; // 'perpetual_futures' | 'call_options' | 'put_options' | 'spot'
  description: string;
  underlying_asset_symbol: string;
  close: string;       // All decimals returned as strings
  open: string;
  high: string;
  low: string;
  mark_price: string;
  spot_price: string;
  funding_rate: string;
  volume: string;
  turnover_usd: string;
  oi: string;          // Open interest in contracts
  oi_value_usd: string;
  best_bid: string;
  best_ask: string;
  best_bid_size: string;
  best_ask_size: string;
  timestamp: number;
  // Computed fields we add
  price_change_24h?: number;
  price_change_pct_24h?: number;
}

export interface DeltaProduct {
  id: number;
  symbol: string;
  description: string;
  contract_type: string;
  underlying_asset: {
    symbol: string;
    name: string;
  };
  quoting_asset: {
    symbol: string;
  };
  tick_size: string;
  default_leverage: string;
  max_leverage: string;
  maintenance_margin: string;
  initial_margin: string;
  maker_commission_rate: string;
  taker_commission_rate: string;
  trading_status: string;
}

export interface DeltaCandle {
  time: number;  // Unix timestamp
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface DeltaOrderBook {
  buy: OrderBookEntry[];
  sell: OrderBookEntry[];
}

export interface OrderBookEntry {
  price: string;
  size: number;
}

export interface DeltaApiResponse<T> {
  success: boolean;
  result: T;
  meta?: {
    after?: string;
    before?: string;
  };
}
