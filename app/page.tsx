import type { Metadata } from 'next';
import Link from 'next/link';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { GlowBoundGame } from '@/components/game/GlowBoundGame';
import { StructuredData } from '@/components/seo/StructuredData';
import { videoGameSchema } from '@/lib/seo/structured-data';
import { ROUTES, pageMetadata } from '@/lib/seo/site';

const TITLE = 'GlowBound — Neon Arcade Survival Game';
const DESCRIPTION =
  'Play GlowBound free in your browser: steer a glowing orb through neon hazards, collect energy gems and chain combos for a higher score. No download, no sign-up.';

export const metadata: Metadata = pageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: ROUTES.game,
  keywords: [
    'play GlowBound',
    'GlowBound game',
    'neon browser game',
    'arcade survival game online',
  ],
});

export default function Home() {
  return (
    <>
      <Header />
      <main className="relative flex min-h-screen flex-col items-center justify-center overflow-auto bg-void-950 px-4 py-12 sm:px-6">
        <div className="w-full max-w-4xl">
          <GlowBoundGame />
        </div>
      </main>
      <Footer />
      <StructuredData id="video-game-jsonld" data={videoGameSchema()} />
    </>
  );
}
