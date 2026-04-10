"use client";

import { useEffect, useState } from "react";

export function useSparklines(symbols: string[]) {
  const [data, setData] = useState<Record<string, number[]>>({});
  const key = symbols.join(",");

  useEffect(() => {
    if (symbols.length === 0) return;
    let cancelled = false;

    Promise.all(
      symbols.map(async (sym) => {
        try {
          const res = await fetch(`/api/delta/candles?symbol=${sym}&resolution=1h`);
          const json = await res.json();
          if (json.success && json.data) {
            const closes = (json.data as any[])
              .sort((a: any, b: any) => a.time - b.time)
              .slice(-24)
              .map((c: any) => c.close as number);
            return [sym, closes] as [string, number[]];
          }
        } catch {
          // silent — sparkline is non-critical
        }
        return [sym, []] as [string, number[]];
      })
    ).then((entries) => {
      if (!cancelled) setData(Object.fromEntries(entries));
    });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return data;
}
