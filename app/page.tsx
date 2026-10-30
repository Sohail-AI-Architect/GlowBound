import type { Metadata } from 'next';
import Link from 'next/link';
import { AD_SLOTS, AdBanner } from '@/components/AdBanner';
import { ButtonLink } from '@/components/ui/Button';
import { StructuredData } from '@/components/seo/StructuredData';
import { HOME_FAQ_ITEMS } from '@/lib/content/glowbound';
import { faqSchema } from '@/lib/seo/structured-data';
import { ROUTES, SITE_DESCRIPTION, SITE_TITLE, pageMetadata } from '@/lib/seo/site';

const base = pageMetadata({
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  path: ROUTES.home,
  keywords: ['play GlowBound', 'free neon arcade game', 'browser survival game', 'online arcade game'],
});

export const metadata: Metadata = {
  ...base,
  title: { absolute: SITE_TITLE },
};

const FEATURES = [
  {
    title: 'Move with intent',
    body: 'The orb carries momentum. Glide with your mouse, drag anywhere on a touch screen, or steer with WASD and the arrow keys.',
  },
  {
    title: 'Chain energy gems',
    body: 'Every gem adds points and tops up your combo timer. Each fourth gem raises your multiplier, up to 8x — but a single hit resets it.',
  },
  {
    title: 'Survive the escalation',
    body: 'Drifting shards, hunting drones and laser gates arrive faster every 18 seconds. Three hearts is all you get.',
  },
  {
    title: 'Play the daily challenge',
    body: 'Each UTC day uses one fixed seed, so everyone faces the same hazard sequence. Chase your own daily best, stored on your device.',
  },
];

const STEPS = [
  {
    step: '01',
    title: 'Steer the orb',
    body: 'Keep the glowing core moving and read the arena. Mouse steering is direct; touch is relative so your thumb never hides the action.',
  },
  {
    step: '02',
    title: 'Collect, do not chase',
    body: 'Grab gems that sit on your safe path. Crossing the arena for a distant gem is how combos die.',
  },
  {
    step: '03',
    title: 'Bank the multiplier',
    body: 'Survival points scale with your multiplier. Stay clean, keep the chain alive, and watch the score accelerate.',
  },
];

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 pb-14 pt-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:pb-20 lg:pt-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-neon-400/30 bg-white/5 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-neon-300">
              Free browser arcade · No download
            </p>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Dodge the dark.
              <span className="mt-2 block bg-gradient-to-r from-electric-300 via-neon-300 to-magenta-400 bg-clip-text text-transparent">
                Collect the light.
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-300">
              GlowBound is a fast, free neon arcade survival game. Guide a glowing energy orb
              through shifting hazards, collect energy gems to build your multiplier, and see how
              long you can last before the third hit ends the run.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <ButtonLink href={ROUTES.game} size="lg">
                Play now
              </ButtonLink>
              <ButtonLink href={ROUTES.howToPlay} variant="secondary" size="lg">
                How to play
              </ButtonLink>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400">
              <li>Instant play</li>
              <li>Keyboard &amp; touch</li>
              <li>Daily challenge</li>
              <li>No sign-up</li>
            </ul>
          </div>

          <div aria-hidden="true" className="relative mx-auto flex w-full max-w-sm items-center justify-center py-6">
            <div className="absolute inset-0 rounded-full bg-neon-500/20 blur-3xl" />
            <div className="relative aspect-square w-3/4 animate-float">
              <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_38%_32%,#ffffff,#a5f3fc_28%,#38bdf8_60%,#8b5cf6_100%)] shadow-[0_0_120px_-10px_rgba(139,92,246,0.95)]" />
              <div className="absolute inset-[-14%] rounded-full border border-neon-400/30" />
              <div className="absolute inset-[-28%] rounded-full border border-electric-400/20" />
              <div className="absolute inset-[-42%] rounded-full border border-magenta-400/10" />
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="how-it-works" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 id="how-it-works" className="text-2xl font-semibold sm:text-3xl">
          How a GlowBound run works
        </h2>
        <p className="mt-3 max-w-2xl text-slate-400">
          One orb, three hearts, an arena that never stops moving. A typical run lasts between thirty
          seconds and three minutes — long enough to feel the difficulty curve, short enough to retry
          immediately.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {STEPS.map((item) => (
            <div key={item.step} className="card">
              <p className="font-display text-sm font-bold tracking-widest text-electric-300">{item.step}</p>
              <h3 className="mt-3 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="features" className="border-y border-white/5 bg-white/[0.02]">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 id="features" className="text-2xl font-semibold sm:text-3xl">
            Built for replayable arcade runs
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="card">
                <h3 className="text-base font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{feature.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="play-now" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl border border-neon-400/25 bg-gradient-to-br from-void-800 via-void-900 to-void-950 p-8 sm:p-12">
          <div aria-hidden="true" className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-magenta-500/20 blur-3xl" />
          <div aria-hidden="true" className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-electric-500/20 blur-3xl" />
          <div className="relative max-w-xl">
            <h2 id="play-now" className="text-2xl font-semibold sm:text-3xl">
              Ready to find out how long you last?
            </h2>
            <p className="mt-3 text-slate-300">
              The full game loads in the browser, not in an app store. Start a classic run, or take
              on today&apos;s seeded daily challenge.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href={ROUTES.game} size="lg">
                Play GlowBound
              </ButtonLink>
              <ButtonLink href={`${ROUTES.howToPlay}#strategies`} variant="secondary" size="lg">
                Read the strategies
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="home-faq" className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
        <h2 id="home-faq" className="text-2xl font-semibold sm:text-3xl">
          GlowBound questions, answered
        </h2>
        <div className="mt-6 divide-y divide-white/10 rounded-2xl border border-white/10">
          {HOME_FAQ_ITEMS.map((item) => (
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
        <p className="mt-6 text-sm text-slate-400">
          More answers in the{' '}
          <Link href={`${ROUTES.howToPlay}#faq`} className="text-electric-300 underline underline-offset-4 hover:text-white">
            full GlowBound FAQ
          </Link>
          , or read{' '}
          <Link href={ROUTES.about} className="text-electric-300 underline underline-offset-4 hover:text-white">
            about the project
          </Link>
          .
        </p>
      </section>

      <div className="mx-auto max-w-3xl px-4 pb-6 sm:px-6">
        <AdBanner slot={AD_SLOTS.content} />
      </div>

      <StructuredData id="home-faq-jsonld" data={faqSchema(HOME_FAQ_ITEMS)} />
    </>
  );
}
