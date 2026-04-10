import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useDeltaTickers() {
  const { data, error, isLoading, mutate } = useSWR("/api/delta/tickers", fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: false,
  });
  return {
    tickers: data?.success ? data.data : [],
    isLoading,
    error: data?.success === false ? data.error : error?.message,
    mutate,
  };
}
