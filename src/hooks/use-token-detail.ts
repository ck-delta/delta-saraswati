import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useTokenDetail(symbol: string | null) {
  const { data: tickerData, isLoading: tickerLoading } = useSWR(
    symbol ? `/api/delta/tickers` : null,
    fetcher,
    { refreshInterval: 30000, revalidateOnFocus: false }
  );

  const { data: indicatorData, isLoading: indicatorLoading } = useSWR(
    symbol ? `/api/market/indicators/${symbol}` : null,
    fetcher,
    { refreshInterval: 300000, revalidateOnFocus: false }
  );

  const ticker = tickerData?.success
    ? tickerData.data.find((t: any) => t.symbol === symbol)
    : null;

  return {
    ticker,
    indicators: indicatorData?.success ? indicatorData.data : null,
    isLoading: tickerLoading || indicatorLoading,
  };
}
