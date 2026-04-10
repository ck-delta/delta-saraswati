import { NextResponse } from "next/server";
import { fetchDeltaTickers } from "@/lib/api/delta";
import { cached } from "@/lib/cache";

// Curated list of major/established crypto perpetual futures for research tab
// Excludes meme coins, micro-caps, and obscure tokens
const MAJOR_CRYPTO_SYMBOLS = new Set([
  "BTCUSD", "ETHUSD", "SOLUSD", "XRPUSD", "BNBUSD", "DOGEUSD",
  "ADAUSD", "AVAXUSD", "DOTUSD", "LINKUSD", "LTCUSD", "BCHUSD",
  "UNIUSD", "AAVEUSD", "XLMUSD", "TRXUSD", "NEARUSD", "APTUSD",
  "SUIUSD", "ARBUSD", "OPUSD", "INJUSD", "FILUSD", "HBARUSD",
  "ETCUSD", "XMRUSD", "TIAUSD", "STXUSD", "DYDXUSD", "PENDLEUSD",
  "ENAUSD", "LDOUSD", "RUNEUSD", "ZROUSD", "JUPUSD", "JTOUSD",
  "ONDOUSD", "PAXGUSD", "SEIUSD", "TAOUSD", "WLDUSD",
  "HYPEUSD", "BERAUSD", "GALAUSD", "AXSUSD", "MANAUSD",
  "MASKUSD", "POLUSD", "ZKUSD", "STRKUSD", "MOVEUSD",
  "EIGENUSD", "ETHFIUSD", "DASHUSD", "ZECUSD", "IOTAUSD",
  "KSMUSD", "ARUSD", "VIRTUALUSD",
]);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const filter = url.searchParams.get("filter");

  try {
    const { data, fromCache } = await cached("delta:tickers", 30, fetchDeltaTickers);

    // Filter to crypto perpetual futures only (exclude xStock/equity tokens), sort by volume
    let perps = (data as any[])
      .filter((t: any) =>
        t.contract_type === "perpetual_futures" &&
        t.turnover_usd > 0 &&
        !(t.description || "").toLowerCase().includes("xstock")
      )
      .sort((a: any, b: any) => b.turnover_usd - a.turnover_usd);

    // For research tab: only show major established crypto tokens
    if (filter === "major") {
      perps = perps.filter((t: any) => MAJOR_CRYPTO_SYMBOLS.has(t.symbol));
    }

    return NextResponse.json({ success: true, data: perps, cached: fromCache, timestamp: Date.now() });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, timestamp: Date.now() }, { status: 500 });
  }
}
