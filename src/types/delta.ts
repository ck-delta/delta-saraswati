export interface DeltaTicker {
  symbol: string;
  description: string;
  contract_type: string;
  underlying_asset_symbol: string;
  close: number;
  open: number;
  high: number;
  low: number;
  mark_price: string;
  spot_price: string;
  funding_rate: string;
  volume: number;
  turnover_usd: number;
  oi_value_usd: string;
  oi_contracts: string;
  oi_change_usd_6h: string;
  mark_change_24h: string;
  product_id: number;
  quotes: {
    best_bid: string;
    best_ask: string;
  };
}

export interface DeltaCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface DeltaProduct {
  id: number;
  symbol: string;
  description: string;
  contract_type: string;
  underlying_asset: { symbol: string; name?: string };
  state: string;
  trading_status: string;
}

export interface DeltaApiResponse<T> {
  success: boolean;
  result: T;
  meta?: { total_count?: number };
}
