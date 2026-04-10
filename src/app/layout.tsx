import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { JsonLd } from "@/components/seo/json-ld";
import { ServiceWorkerRegister } from "@/components/seo/sw-register";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://delta-saraswati.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Delta Saraswati — AI Crypto Research Dashboard",
    template: "%s | Delta Saraswati",
  },
  description:
    "AI-powered crypto perpetuals research dashboard. Real-time market data from Delta Exchange, technical analysis, sentiment scoring, and intelligent trading insights powered by Groq AI.",
  keywords: [
    "crypto dashboard",
    "AI crypto research",
    "crypto perpetuals",
    "Delta Exchange",
    "crypto trading dashboard",
    "crypto sentiment analysis",
    "technical analysis crypto",
    "Bitcoin perpetuals",
    "crypto market summary",
  ],
  authors: [{ name: "Delta Saraswati" }],
  creator: "Delta Saraswati",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Delta Saraswati",
    title: "Delta Saraswati — AI Crypto Research Dashboard",
    description:
      "Real-time crypto perpetuals data, AI market summaries, and intelligent trading insights powered by Groq AI and Delta Exchange.",
    images: [
      {
        url: "/api/og?title=Delta+Saraswati&description=AI-Powered+Crypto+Research+Dashboard",
        width: 1200,
        height: 630,
        alt: "Delta Saraswati — AI Crypto Research Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Delta Saraswati — AI Crypto Research Dashboard",
    description:
      "Real-time crypto perpetuals data, AI market summaries, and intelligent trading insights.",
    images: ["/api/og?title=Delta+Saraswati&description=AI-Powered+Crypto+Research+Dashboard"],
  },
  robots: { index: true, follow: true },
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/apple-touch-icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} dark h-full`}
    >
      <head>
        <meta name="theme-color" content="#F59E0B" />
        <JsonLd />
      </head>
      <body className="min-h-full bg-background text-foreground antialiased ambient-glow">
        <TooltipProvider>
          <div className="flex h-screen">
            <Sidebar />
            <div className="flex flex-1 flex-col">
              <Header />
              <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                {children}
              </main>
            </div>
          </div>
          <MobileNav />
        </TooltipProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
