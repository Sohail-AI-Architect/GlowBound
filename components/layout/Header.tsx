import Link from 'next/link';
import { NAV_LINKS, ROUTES } from '@/lib/seo/site';

function OrbLogo() {
  return (
    <span
      aria-hidden="true"
      className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-electric-300 via-neon-400 to-magenta-500 shadow-glow"
    >
      <span className="h-3 w-3 rounded-full bg-white" />
      <span className="absolute inset-0 rounded-full ring-1 ring-white/40" />
    </span>
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-void-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href={ROUTES.home} className="flex items-center gap-3 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-300">
          <OrbLogo />
          <span className="font-display text-lg font-bold tracking-widest text-white">GLOWBOUND</span>
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-300"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href={ROUTES.game}
            className="ml-2 rounded-full bg-gradient-to-r from-electric-400 via-neon-500 to-magenta-500 px-5 py-2 text-sm font-semibold text-void-950 shadow-glow transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-300 focus-visible:ring-offset-2 focus-visible:ring-offset-void-950"
          >
            Play now
          </Link>
        </nav>

        {/* JS-free mobile menu: native <details> keeps the header a Server Component. */}
        <details className="group relative md:hidden">
          <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-300 [&::-webkit-details-marker]:hidden">
            <span aria-hidden="true" className="flex flex-col gap-1">
              <span className="block h-0.5 w-4 rounded bg-current" />
              <span className="block h-0.5 w-4 rounded bg-current" />
              <span className="block h-0.5 w-4 rounded bg-current" />
            </span>
            Menu
          </summary>
          <div className="absolute right-0 top-12 w-56 rounded-2xl border border-white/10 bg-void-900 p-2 shadow-2xl">
            <ul className="flex flex-col">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="block rounded-xl px-4 py-3 text-sm text-slate-200 transition hover:bg-white/5 hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li className="mt-1">
                <Link
                  href={ROUTES.game}
                  className="block rounded-xl bg-gradient-to-r from-electric-400 via-neon-500 to-magenta-500 px-4 py-3 text-center text-sm font-semibold text-void-950"
                >
                  Play now
                </Link>
              </li>
            </ul>
          </div>
        </details>
      </div>
    </header>
  );
}
