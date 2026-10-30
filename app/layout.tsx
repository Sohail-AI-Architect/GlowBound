import type { Metadata, Viewport } from 'next';
import { Inter, Orbitron } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { StructuredData } from '@/components/seo/StructuredData';
import { webSiteSchema } from '@/lib/seo/structured-data';
import {
  ROBOTS_METADATA,
  ROUTES,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
  absoluteUrl,
} from '@/lib/seo/site';

const bodyFont = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
});

const displayFont = Orbitron({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-display',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // Each page ships a fully self-contained title (no template suffix) so titles
  // stay inside the recommended length and never repeat the brand name.
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  category: 'games',
  keywords: [
    'GlowBound',
    'free browser game',
    'neon arcade game',
    'online survival game',
    'HTML5 canvas game',
    'daily challenge game',
  ],
  alternates: { canonical: absoluteUrl(ROUTES.home) },
  formatDetection: { telephone: false, address: false, email: false },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'en_US',
    url: '/',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'GlowBound neon arcade survival game' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ['/opengraph-image'],
  },
  // index,follow only once a real production origin is configured; otherwise
  // the deployment stays out of search results instead of advertising a
  // localhost or placeholder canonical URL (see lib/seo/site.ts).
  robots: ROBOTS_METADATA,
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#050313',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bodyFont.variable} ${displayFont.variable}`}>
      <body className="flex min-h-screen flex-col">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <Header />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer />
        <StructuredData id="website-jsonld" data={webSiteSchema()} />
      </body>
    </html>
  );
}
