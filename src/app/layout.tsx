import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'DriftLock — Selector Repair for Web Scrapers',
  description: 'Automatically repair broken selectors when websites redesign',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps): React.ReactElement {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body className="bg-slate-950 text-white font-sans antialiased">
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
