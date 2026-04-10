import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useFearGreed() {
  const { data, error, isLoading } = useSWR("/api/market/fear-greed", fetcher, {
    refreshInterval: 3600000, // 1h
    revalidateOnFocus: false,
  });
  return { fearGreed: data?.success ? data.data : null, isLoading, error };
}
