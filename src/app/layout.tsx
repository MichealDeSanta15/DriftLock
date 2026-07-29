import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DriftLock — Selector Repair for Web Scrapers',
  description: 'Automatically repair broken selectors when websites redesign',
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps): React.ReactElement {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
