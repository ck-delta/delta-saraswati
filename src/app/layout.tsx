import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import TopNav from '@/components/layout/TopNav';
import './globals.css';

// ---------------------------------------------------------------------------
// Fonts
// ---------------------------------------------------------------------------

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: 'Delta Saraswati',
  description:
    'AI-powered crypto intelligence dashboard built on Delta Exchange. Real-time market data, technical analysis, news, and conversational AI insights.',
  icons: { icon: '/favicon.ico' },
};

// ---------------------------------------------------------------------------
// Root Layout
// ---------------------------------------------------------------------------

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      data-brand="india"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body
        className="h-full antialiased"
        style={{
          background: 'var(--bg-sub-surface)',
          color: 'var(--text-primary)',
        }}
      >
        <TopNav />
        <main className="min-h-[calc(100vh-56px)]">{children}</main>
      </body>
    </html>
  );
}
