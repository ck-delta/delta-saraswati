const BASE_URL = process.env.NEXT_PUBLIC_DELTA_API_BASE || "https://api.india.delta.exchange/v2";

export async function fetchDeltaTickers() {
  const res = await fetch(`${BASE_URL}/tickers`, { next: { revalidate: 30 } });
  if (!res.ok) throw new Error(`Delta tickers failed: ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error("Delta API returned success: false");
  return json.result;
}

export async function fetchDeltaTicker(symbol: string) {
  const res = await fetch(`${BASE_URL}/tickers/${symbol}`);
  if (!res.ok) throw new Error(`Delta ticker ${symbol} failed: ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error("Delta API returned success: false");
  return json.result;
}

export async function fetchDeltaCandles(symbol: string, resolution: string, start: number, end: number) {
  const url = `${BASE_URL}/history/candles?resolution=${resolution}&symbol=${symbol}&start=${start}&end=${end}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Delta candles failed: ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error("Delta API returned success: false");
  return json.result;
}

export async function fetchDeltaProducts() {
  const res = await fetch(`${BASE_URL}/products?page_size=3000`);
  if (!res.ok) throw new Error(`Delta products failed: ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error("Delta API returned success: false");
  return json.result;
}
