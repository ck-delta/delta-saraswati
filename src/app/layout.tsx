import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Sidebar, { MobileSidebar } from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
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
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="h-full bg-[#08090a] text-[#eaedf3] antialiased">
        <div className="flex h-full">
          {/* Desktop sidebar — fixed left column */}
          <Sidebar />

          {/* Mobile sidebar overlay */}
          <MobileSidebar />

          {/* Main content area: header + scrollable body */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <Header />

            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
