import Link from 'next/link';
import { ROUTES, SITE_NAME } from '@/lib/seo/site';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-white/10 bg-void-950">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-display text-lg font-bold tracking-widest text-white">GLOWBOUND</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-400">
            A free neon arcade survival game that runs entirely in your browser. No accounts, no
            ads, no downloads — just one glowing orb against the dark.
          </p>
        </div>
        <nav aria-label="Game links">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Play</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link href={ROUTES.game} className="text-slate-300 transition hover:text-white">
                Play GlowBound
              </Link>
            </li>
            <li>
              <Link href={ROUTES.howToPlay} className="text-slate-300 transition hover:text-white">
                How to play
              </Link>
            </li>
            <li>
              <Link href={`${ROUTES.howToPlay}#daily-challenge`} className="text-slate-300 transition hover:text-white">
                Daily challenge
              </Link>
            </li>
            <li>
              <Link href={`${ROUTES.howToPlay}#faq`} className="text-slate-300 transition hover:text-white">
                FAQ
              </Link>
            </li>
          </ul>
        </nav>
        <nav aria-label="Site links">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Site</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link href={ROUTES.about} className="text-slate-300 transition hover:text-white">
                About GlowBound
              </Link>
            </li>
            <li>
              <Link href={ROUTES.contact} className="text-slate-300 transition hover:text-white">
                Contact
              </Link>
            </li>
            <li>
              <Link href={ROUTES.privacy} className="text-slate-300 transition hover:text-white">
                Privacy
              </Link>
            </li>
            <li>
              <Link href={ROUTES.terms} className="text-slate-300 transition hover:text-white">
                Terms of use
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-white/5">
        <p className="mx-auto max-w-6xl px-4 py-6 text-xs text-slate-400 sm:px-6">
          © {year} {SITE_NAME}. Scores are saved locally in your browser — GlowBound has no global
          leaderboard.
        </p>
      </div>
    </footer>
  );
}
