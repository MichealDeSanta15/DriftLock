import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuroraBackground } from '@/components/common/AuroraBackground';
import { PageTransition } from '@/components/common/PageTransition';
import { AuthProvider } from '@/lib/AuthContext';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'DriftLock — Selector Repair for Web Scrapers',
  description: 'Automatically repair broken selectors when websites redesign',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps): React.ReactElement {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body className="bg-slate-950 text-white font-sans antialiased">
        <AuroraBackground intensity="subtle" />
        <div className="min-h-screen">
          <AuthProvider>
            <PageTransition>{children}</PageTransition>
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}
