import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GlowBound - Play Free Neon Browser Arcade Game',
  description: 'Experience high-speed neon arcade action right in your browser! Play GlowBound live now.',
  metadataBase: new URL('https://glow-bound.vercel.app'),
  openGraph: {
    title: 'GlowBound - Neon Browser Arcade Game',
    description: 'Play high-performance neon arcade game online for free.',
    url: 'https://glow-bound.vercel.app',
    siteName: 'GlowBound',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GlowBound Arcade Game',
    description: 'Play high-performance neon arcade game online for free.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
