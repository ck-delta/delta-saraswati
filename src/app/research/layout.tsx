import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Research",
  description:
    "In-depth crypto token analysis with TradingView charts, technical indicators (RSI, MACD, SMA, ADX), and AI-powered trading insights.",
  openGraph: {
    title: "Research | Delta Saraswati",
    description:
      "In-depth crypto token analysis with TradingView charts, technical indicators, and AI insights.",
    images: [
      {
        url: "/api/og?title=Research&description=Token+Analysis+%26+Technical+Indicators",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Research | Delta Saraswati",
    description:
      "In-depth crypto token analysis with TradingView charts, technical indicators, and AI insights.",
    images: ["/api/og?title=Research&description=Token+Analysis+%26+Technical+Indicators"],
  },
};

export default function ResearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
