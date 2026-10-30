import type { Metadata } from 'next';
import Link from 'next/link';
import { GlowBoundGame } from '@/components/game/GlowBoundGame';
import { ControlLegend } from '@/components/game/GameControls';
import { StructuredData } from '@/components/seo/StructuredData';
import { SCORING_RULES } from '@/lib/content/glowbound';
import { breadcrumbSchema, videoGameSchema } from '@/lib/seo/structured-data';
import { ROUTES, pageMetadata } from '@/lib/seo/site';

const TITLE = 'Play GlowBound — Neon Arcade Survival Game Online';
const DESCRIPTION =
  'Play GlowBound free in your browser: dodge neon hazards, collect energy gems and chain an 8x multiplier. Keyboard and touch supported, plus a daily challenge.';

export const metadata: Metadata = pageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: ROUTES.game,
  keywords: ['play GlowBound', 'GlowBound game', 'neon browser game', 'arcade survival game online'],
});

const BREADCRUMBS = [
  { name: 'Home', path: ROUTES.home },
  { name: 'GlowBound', path: ROUTES.game },
];

export default function GlowBoundPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <li>
            <Link href={ROUTES.home} className="transition hover:text-white">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-slate-300">
            GlowBound
          </li>
        </ol>
      </nav>

      <div className="max-w-2xl">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Play GlowBound</h1>
        <p className="mt-3 text-slate-400">
          A free neon arcade survival game. Move the orb, collect energy gems, dodge shards, drones
          and laser gates. Three hits end the run — your personal best is saved in this browser.
        </p>
      </div>

      <div className="mt-8">
        <GlowBoundGame />
      </div>

      <div className="mt-14 grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <section aria-labelledby="controls-heading">
          <h2 id="controls-heading" className="text-2xl font-semibold">
            Controls at a glance
          </h2>
          <p className="mt-3 text-sm text-slate-400">
            Everything works with one hand on a phone or one hand on a keyboard. There is nothing to
            install and no account to create.
          </p>
          <div className="mt-5">
            <ControlLegend />
          </div>
          <p className="mt-4 text-sm text-slate-400">
            New to the game? Read the{' '}
            <Link href={ROUTES.howToPlay} className="text-electric-300 underline underline-offset-4 hover:text-white">
              full guide to controls, scoring and strategies
            </Link>
            .
          </p>
        </section>

        <section aria-labelledby="scoring-heading" className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 id="scoring-heading" className="text-xl font-semibold">
            How scoring works
          </h2>
          <dl className="mt-4 space-y-4">
            {SCORING_RULES.map((rule) => (
              <div key={rule.title}>
                <dt className="text-sm font-semibold text-white">{rule.title}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-slate-400">{rule.detail}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-5 text-xs leading-relaxed text-slate-400">
            Scores are stored locally with <code className="rounded bg-white/10 px-1 py-0.5 text-[0.7rem]">localStorage</code>.
            There is no backend and no global leaderboard.
          </p>
        </section>
      </div>

      <section aria-labelledby="daily-heading" className="mt-14 rounded-2xl border border-neon-400/25 bg-gradient-to-br from-void-800/80 to-void-950 p-6 sm:p-8">
        <h2 id="daily-heading" className="text-2xl font-semibold">
          Today&apos;s daily challenge
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
          Pick <strong className="font-semibold text-white">Daily</strong> on the start screen to play
          a seeded run. The seed is derived from the current UTC date, so every player faces the same
          hazard and gem sequence that day, at a slightly faster pace than classic mode. Your best
          score for today is kept on this device.
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">
          The daily challenge resets at 00:00 UTC. Because GlowBound has no server, daily scores are
          personal rather than public — a deliberate choice that keeps the game free, private and
          instant to load.
        </p>
      </section>

      <nav aria-label="Related pages" className="mt-12">
        <h2 className="text-lg font-semibold">Keep reading</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          <li>
            <Link href={ROUTES.howToPlay} className="card block transition hover:border-neon-300/50">
              <span className="font-medium text-white">How to play GlowBound</span>
              <span className="mt-1 block text-sm text-slate-400">
                Controls, scoring rules, strategies and the full FAQ.
              </span>
            </Link>
          </li>
          <li>
            <Link href={ROUTES.about} className="card block transition hover:border-neon-300/50">
              <span className="font-medium text-white">About the game</span>
              <span className="mt-1 block text-sm text-slate-400">
                What GlowBound is, how it is built and what it deliberately avoids.
              </span>
            </Link>
          </li>
        </ul>
      </nav>

      <StructuredData id="video-game-jsonld" data={videoGameSchema()} />
      <StructuredData id="breadcrumb-jsonld" data={breadcrumbSchema(BREADCRUMBS)} />
    </div>
  );
}
