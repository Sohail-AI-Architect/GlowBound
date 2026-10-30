import type { Metadata } from 'next';
import Link from 'next/link';
import { ControlLegend } from '@/components/game/GameControls';
import { ButtonLink } from '@/components/ui/Button';
import { StructuredData } from '@/components/seo/StructuredData';
import { FAQ_ITEMS, SCORING_RULES, STRATEGY_TIPS } from '@/lib/content/glowbound';
import { breadcrumbSchema, faqSchema } from '@/lib/seo/structured-data';
import { ROUTES, pageMetadata } from '@/lib/seo/site';

const DESCRIPTION =
  'Learn GlowBound controls for mouse, touch and keyboard, how scoring and the 8x multiplier work, how to read each hazard and how to score higher.';

export const metadata: Metadata = pageMetadata({
  title: 'How to Play GlowBound — Controls, Scoring & Tips',
  description: DESCRIPTION,
  path: ROUTES.howToPlay,
  keywords: ['how to play GlowBound', 'GlowBound controls', 'GlowBound tips', 'arcade game scoring'],
});

const BREADCRUMBS = [
  { name: 'Home', path: ROUTES.home },
  { name: 'How to play', path: ROUTES.howToPlay },
];

const MULTIPLIER_TIERS = [
  { gems: '0 – 3', multiplier: '1x' },
  { gems: '4 – 7', multiplier: '2x' },
  { gems: '8 – 11', multiplier: '3x' },
  { gems: '12 – 15', multiplier: '4x' },
  { gems: '16 – 19', multiplier: '5x' },
  { gems: '20 – 23', multiplier: '6x' },
  { gems: '24 – 27', multiplier: '7x' },
  { gems: '28+', multiplier: '8x' },
];

const HAZARDS = [
  {
    name: 'Shards',
    colour: 'Pink bars',
    body: 'Rotating neon bars that drift in from the right edge, sometimes tumbling from the top. They keep their angle while crossing, so watch the whole bar, not just its centre.',
  },
  {
    name: 'Drones',
    colour: 'Red hexagons',
    body: 'Slow, round hazards with a pulsing aura. They are wider than they look and often arrive in loose clusters, so leave yourself two escape routes.',
  },
  {
    name: 'Laser gates',
    colour: 'Magenta beams',
    body: 'A full-height beam with one cyan safe gap. Align with the gap before the beam reaches you — from level 3 onward they appear more often.',
  },
];

export default function HowToPlayPage() {
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
            How to play
          </li>
        </ol>
      </nav>

      <article className="prose-neon max-w-none">
        <header className="max-w-3xl">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">How to play GlowBound</h1>
          <p className="mt-4 text-lg text-slate-300">
            GlowBound takes about ten seconds to learn and a lot longer to master. You control one
            glowing orb in a dark arena. Energy gems raise your score and your multiplier; shards,
            drones and laser gates take your hearts. Survive as long as you can with three hearts.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink href={ROUTES.game} size="lg">
              Play GlowBound
            </ButtonLink>
            <ButtonLink href="#strategies" variant="secondary" size="lg">
              Jump to strategies
            </ButtonLink>
          </div>
        </header>

        <section aria-labelledby="controls" className="mt-14">
          <h2 id="controls">Controls</h2>
          <p>
            Every input is optional — pick whichever feels natural. Desktop players usually prefer
            the mouse; phone players should drag.
          </p>
          <div className="mt-5">
            <ControlLegend />
          </div>
          <p className="mt-4">
            Touch steering is <strong>relative</strong>: wherever you put your thumb, the orb follows
            the direction you drag instead of jumping under your finger. That keeps the orb visible
            while you play. Keyboard movement adds acceleration and drag, so the orb eases into
            motion rather than snapping between directions.
          </p>
        </section>

        <section aria-labelledby="objective" className="mt-14">
          <h2 id="objective">Objective and hearts</h2>
          <p>
            A run ends when you lose all three hearts. A hit costs one heart, gives you 1.5 seconds of
            invulnerability, clears nearby hazards, and resets your combo and multiplier back to 1x.
            The invulnerability window is a rescue, not a strategy: you cannot brute-force through a
            second hazard.
          </p>
          <p>
            You do not need to destroy anything. There is no shooting and no power-up: positioning is
            the entire skill ceiling.
          </p>
        </section>

        <section aria-labelledby="scoring" className="mt-14">
          <h2 id="scoring">Scoring and the multiplier</h2>
          <ul>
            {SCORING_RULES.map((rule) => (
              <li key={rule.title}>
                <strong>{rule.title}.</strong> {rule.detail}
              </li>
            ))}
          </ul>

          <h3>Multiplier tiers</h3>
          <p>
            The multiplier is based on how many gems you have collected in the current chain. Miss the
            combo window for roughly three seconds and it drops back to 1x.
          </p>
          <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">GlowBound multiplier tiers by gems collected in a combo</caption>
              <thead className="bg-white/5 text-xs uppercase tracking-[0.16em] text-slate-400">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Gems in combo</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Multiplier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {MULTIPLIER_TIERS.map((tier) => (
                  <tr key={tier.gems}>
                    <th scope="row" className="px-4 py-2.5 font-normal text-slate-300">{tier.gems}</th>
                    <td className="px-4 py-2.5 font-display font-semibold text-electric-300">{tier.multiplier}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            Because survival points are also multiplied, the real score engine is time spent at 4x and
            above. A cautious run that never breaks its chain beats a reckless run with more gems.
          </p>
        </section>

        <section aria-labelledby="difficulty" className="mt-14">
          <h2 id="difficulty">Difficulty curve and hazards</h2>
          <p>
            Every 18 seconds the game levels up: hazards spawn more often and travel faster. The level
            counter in the HUD is your early warning that a speed bump is coming.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {HAZARDS.map((hazard) => (
              <div key={hazard.name} className="card">
                <p className="text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  {hazard.colour}
                </p>
                <h3 className="mt-2 text-base font-semibold">{hazard.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{hazard.body}</p>
              </div>
            ))}
          </div>
          <p>
            Hazards mostly enter from the right edge, with a smaller share dropping from the top.
            Nothing spawns directly on top of you — if something feels unfair, it usually means you
            drifted into a lane you had already committed to.
          </p>
        </section>

        <section aria-labelledby="strategies" className="mt-14">
          <h2 id="strategies">Strategies for a higher score</h2>
          <ol>
            {STRATEGY_TIPS.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="daily-challenge" className="mt-14">
          <h2 id="daily-challenge">Daily challenge</h2>
          <p>
            The daily challenge uses a seed derived from the current UTC date, so the same hazards and
            gems appear in the same order for everyone who plays on that date. It runs slightly faster
            than classic mode and gems spawn a little more often.
          </p>
          <p>
            Your best daily score is saved per date in your browser. There is no account and no public
            ranking, so the daily challenge is a personal benchmark: come back tomorrow for a new
            arena and a clean slate.
          </p>
        </section>

        <section aria-labelledby="faq" className="mt-14">
          <h2 id="faq">Frequently asked questions</h2>
          <div className="mt-5 divide-y divide-white/10 rounded-2xl border border-white/10">
            {FAQ_ITEMS.map((item) => (
              <details key={item.question} className="group px-5 py-4">
                <summary className="cursor-pointer list-none font-medium text-white marker:hidden [&::-webkit-details-marker]:hidden">
                  <span className="flex items-center justify-between gap-4">
                    {item.question}
                    <span aria-hidden="true" className="text-electric-300 transition group-open:rotate-45">
                      +
                    </span>
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </article>

      <div className="mt-14 rounded-2xl border border-neon-400/25 bg-gradient-to-br from-void-800/80 to-void-950 p-6 text-center sm:p-8">
        <h2 className="text-xl font-semibold">Put it into practice</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-400">
          The fastest way to learn GlowBound is a few short runs. Start with survival, then add the
          combo chase.
        </p>
        <ButtonLink href={ROUTES.game} size="lg" className="mt-5">
          Play GlowBound
        </ButtonLink>
      </div>

      <StructuredData id="faq-jsonld" data={faqSchema(FAQ_ITEMS)} />
      <StructuredData id="breadcrumb-jsonld" data={breadcrumbSchema(BREADCRUMBS)} />
    </div>
  );
}
