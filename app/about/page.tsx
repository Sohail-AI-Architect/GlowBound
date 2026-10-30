import type { Metadata } from 'next';
import Link from 'next/link';
import { ButtonLink } from '@/components/ui/Button';
import { StructuredData } from '@/components/seo/StructuredData';
import { breadcrumbSchema } from '@/lib/seo/structured-data';
import { ROUTES, pageMetadata } from '@/lib/seo/site';

const DESCRIPTION =
  'GlowBound is a free neon arcade survival game built with Next.js, TypeScript and HTML5 Canvas. Read its design principles and what it leaves out.';

export const metadata: Metadata = pageMetadata({
  title: 'About GlowBound — A Free Neon Browser Arcade Game',
  description: DESCRIPTION,
  path: ROUTES.about,
});

const BREADCRUMBS = [
  { name: 'Home', path: ROUTES.home },
  { name: 'About', path: ROUTES.about },
];

const PRINCIPLES = [
  {
    title: 'One input, real depth',
    body: 'There is a single verb — move. Every score comes from reading space and timing, not from unlocking abilities or memorising a build order.',
  },
  {
    title: 'Honest difficulty',
    body: 'Hazards enter from predictable edges and never spawn on top of the player. When a run ends, it is clear which decision went wrong.',
  },
  {
    title: 'Short sessions',
    body: 'A run lasts seconds to minutes. Restart is one tap, so losing never feels like wasted time.',
  },
  {
    title: 'No dark patterns',
    body: 'No accounts, no energy timers, no paywalls, no purchases, no notifications begging you to return.',
  },
];

const STACK = [
  ['Framework', 'Next.js 16 with the App Router, React 19 and React Server Components by default'],
  ['Language', 'TypeScript in strict mode'],
  ['Styling', 'Tailwind CSS with a custom neon palette and reduced-motion support'],
  ['Gameplay', 'HTML5 Canvas 2D with a deterministic engine separated from rendering'],
  ['Audio', 'Synthesised effects with the Web Audio API — no audio files to download'],
  ['Storage', 'localStorage for personal bests and the sound preference, nothing server-side'],
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 pb-20 pt-8 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <li>
            <Link href={ROUTES.home} className="transition hover:text-white">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-slate-300">
            About
          </li>
        </ol>
      </nav>

      <article className="prose-neon max-w-none">
        <header className="max-w-3xl">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">About GlowBound</h1>
          <p className="mt-4 text-lg text-slate-300">
            GlowBound is an independent, free-to-play browser arcade game about light, momentum and
            making one more attempt. You are a single energy orb in an arena that slowly stops being
            friendly.
          </p>
        </header>

        <section aria-labelledby="idea" className="mt-12">
          <h2 id="idea">The idea</h2>
          <p>
            Most arcade survival games ask you to react. GlowBound asks you to <em>place</em> yourself.
            Hazards travel across the arena on readable paths, gems appear where you want to be, and
            your multiplier rewards you for staying in motion instead of hiding in a corner. The
            result is a game that is calm for the first twenty seconds and genuinely tense by minute
            two.
          </p>
          <p>
            It is designed to be played in a browser tab during a break: load it, play three runs,
            leave. Nothing is gated behind a sign-up and there is no daily reward loop to maintain.
          </p>
        </section>

        <section aria-labelledby="principles" className="mt-12">
          <h2 id="principles">Design principles</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {PRINCIPLES.map((item) => (
              <div key={item.title} className="card">
                <h3 className="mt-0 text-base font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="stack" className="mt-12">
          <h2 id="stack">How it is built</h2>
          <p>
            GlowBound is a server-rendered marketing site wrapped around a client-side canvas game.
            Information pages ship as static HTML with no game JavaScript, and the game page loads the
            engine only where it is needed.
          </p>
          <dl className="mt-5 divide-y divide-white/10 rounded-2xl border border-white/10">
            {STACK.map(([label, value]) => (
              <div key={label} className="grid gap-1 px-5 py-3 sm:grid-cols-[9rem_1fr] sm:gap-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</dt>
                <dd className="text-sm text-slate-300">{value}</dd>
              </div>
            ))}
          </dl>
          <p>
            The engine is deliberately free of browser APIs: it receives a delta time and updates
            positions, spawning and collisions. A seeded random number generator makes a run
            reproducible, which is exactly how the daily challenge gives every player the same arena.
            Rendering is a separate layer, so gameplay can be tested in Node without a canvas.
          </p>
        </section>

        <section aria-labelledby="absent" className="mt-12">
          <h2 id="absent">What is deliberately absent</h2>
          <ul>
            <li>
              <strong>No global leaderboard.</strong> There is no backend and no database. Claiming a
              worldwide ranking would be dishonest, so scores are stored locally and can be shared
              through your device&apos;s share sheet.
            </li>
            <li>
              <strong>No accounts or first-party tracking.</strong> The site runs no analytics of its
              own and builds no profile of you; the only cookies come from advertising, disclosed on
              the <Link href={ROUTES.privacy}>privacy page</Link>.
            </li>
            <li>
              <strong>No paywalls or purchases.</strong> The game is complete and free: nothing is
              locked behind a payment, there is no subscription, and no paid API is required to run
              it. The site carries advertising, disclosed on the{' '}
              <Link href={ROUTES.privacy}>privacy page</Link>, which is what keeps it that way.
            </li>
          </ul>
        </section>

        <section aria-labelledby="accessibility" className="mt-12">
          <h2 id="accessibility">Accessibility</h2>
          <p>
            The interface is keyboard navigable, uses visible focus rings, keeps text contrast high on
            dark backgrounds, exposes game state to screen readers through a live region, and honours
            the <code>prefers-reduced-motion</code> setting by disabling particles, screen shake and
            decorative animation. The game itself is input-driven, so it is not fully playable with a
            screen reader; the surrounding content and controls are.
          </p>
        </section>

        <div className="mt-12 flex flex-wrap gap-3">
          <ButtonLink href={ROUTES.game} size="lg">
            Play GlowBound
          </ButtonLink>
          <ButtonLink href={ROUTES.howToPlay} variant="secondary" size="lg">
            Read how to play
          </ButtonLink>
        </div>
      </article>

      <StructuredData id="breadcrumb-jsonld" data={breadcrumbSchema(BREADCRUMBS)} />
    </div>
  );
}
