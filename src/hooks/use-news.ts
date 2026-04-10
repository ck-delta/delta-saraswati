import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useNews() {
  const { data, error, isLoading } = useSWR("/api/market/news", fetcher, {
    refreshInterval: 900000, // 15min
    revalidateOnFocus: false,
  });
  return {
    summary: data?.success ? data.data.summary : null,
    headlines: data?.success ? data.data.headlines : [],
    generatedAt: data?.success ? data.data.generatedAt : null,
    isLoading,
    error,
  };
}
