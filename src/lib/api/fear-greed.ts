export async function fetchFearGreed() {
  const res = await fetch("https://api.alternative.me/fng/?limit=1");
  if (!res.ok) throw new Error(`Fear & Greed failed: ${res.status}`);
  const json = await res.json();
  const entry = json.data?.[0];
  if (!entry) throw new Error("No Fear & Greed data");
  return {
    value: parseInt(entry.value, 10),
    classification: entry.value_classification,
    timestamp: parseInt(entry.timestamp, 10) * 1000,
  };
}
