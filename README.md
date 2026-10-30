# GlowBound

A free neon arcade survival game for the browser. You control a glowing energy orb, dodge
shards, drones and laser gates, and collect energy gems to build a score multiplier. Built with
Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS and an HTML5 Canvas game loop.

---

## Stack

| Layer     | Choice                                                                  |
| --------- | ----------------------------------------------------------------------- |
| Framework | Next.js 16.4.3, App Router, Server Components by default, Turbopack       |
| UI        | React 19.3, TypeScript 5.9 (strict), Tailwind CSS 3.4                    |
| Gameplay  | Canvas 2D renderer + framework-free deterministic engine                 |
| Audio     | Web Audio API, synthesised cues (no audio files)                         |
| Storage   | `localStorage` for personal bests and sound preference (no backend)      |
| Quality   | ESLint 9 flat config, Node test runner, optional CDP smoke test          |

## Getting started

Requires Node.js >= 20.9 (Next.js 16 minimum). Verified locally on Node 24.22.0 / npm 12.2.1.

```bash
npm install
npm run dev          # http://localhost:3000
```

Production build:

```bash
npm run build        # Turbopack production build
npm start
```

Other scripts:

```bash
npm run typecheck    # tsc --noEmit
npm run lint         # eslint . (Next.js 16 removed `next lint`)
npm test             # engine + storage + formatting unit tests (node --test)
npm run check        # typecheck + lint + tests
npm run smoke        # optional browser smoke test, see "Testing"
```

## Environment variables

| Variable                 | Required    | Purpose                                                                                                    |
| ------------------------ | ----------- | ---------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`   | Production  | Absolute origin used for `metadataBase`, canonical URLs, Open Graph URLs, `sitemap.xml` and `robots.txt`. No trailing slash. |

`VERCEL_PROJECT_PRODUCTION_URL` is used automatically as a fallback on Vercel when
`NEXT_PUBLIC_SITE_URL` is not set, so a fresh deployment canonicalises to its own production
domain instead of an unpublished one.

**No real production domain is configured in this repository.** If neither variable is present:

* the canonical origin falls back to `http://localhost:3000` for local development;
* every page is served with `noindex, nofollow`;
* `robots.txt` disallows crawling and the sitemap is empty.

That prevents a preview or local build from being indexed under a placeholder domain. Reserved
documentation domains (`example.com`, `.example`, `localhost`, …) are rejected on purpose, so
`https://glowbound.example.com` can never become the production canonical. Set
`NEXT_PUBLIC_SITE_URL=https://your-domain.com` locally in `.env.local` and in the host's
environment variables before going live, then rebuild (the value is inlined at build time).

No secrets are used anywhere in this project.

## Project structure

```
app/
  layout.tsx                 Root layout: fonts, metadata, header/footer, WebSite JSON-LD
  page.tsx                   Homepage (hero, features, FAQ)
  globals.css                Tailwind entry + neon prose styles + reduced-motion rules
  games/glowbound/page.tsx   The game page (canvas arena + supporting content)
  how-to-play/page.tsx       Controls, scoring, hazards, strategies, full FAQ
  about/page.tsx             Project background and technology
  contact/page.tsx           Contact information (no invented email address)
  privacy/page.tsx           Privacy policy (localStorage only, no ads today)
  terms/page.tsx             Terms of use
  icon.svg                   Favicon
  opengraph-image.tsx        Generated 1200x630 social card (Node runtime)
  robots.ts                  robots.txt
  sitemap.ts                 sitemap.xml
components/
  game/    GlowBoundGame, GameCanvas, GameHUD, GameOver, GameControls,
           StartScreen, PauseScreen
  layout/  Header, Footer
  seo/     StructuredData
  ui/      Button, ButtonLink
lib/
  game/    engine.ts (rules), renderer.ts (canvas), audio.ts, storage.ts
  seo/     site.ts (URLs/metadata helper), structured-data.ts (JSON-LD builders)
  content/ glowbound.ts (single source for controls, scoring, tips and FAQ copy)
  utils/   format.ts, share.ts, cn.ts
scripts/
  smoke-test.mjs             Optional end-to-end browser test
tests/
  engine.test.ts             Determinism, collisions, scoring, pause, restart, spawn safety
  storage.test.ts            Persistence, corrupt data, storage failures, subscriptions
  utils.test.ts              Score/duration/date formatting
eslint.config.mjs            ESLint 9 flat config
```

## How the game is built

* `lib/game/engine.ts` has **no browser APIs**. It receives `update(dt)` calls and owns movement,
  spawning, collisions, scoring, combos and the daily seed. Randomness comes from a seeded
  `mulberry32` PRNG, so a seed reproduces a run exactly — that is what makes the daily challenge
  identical for every player.
* `lib/game/renderer.ts` owns all drawing and visual-only state (trail, particles, starfield).
  Device pixel ratio is capped at 2 to bound fill-rate cost.
* `components/game/GameCanvas.tsx` owns the `requestAnimationFrame` loop, `ResizeObserver` sizing and
  pointer/keyboard input. It pauses rendering entirely while overlays are shown.
* `components/game/GlowBoundGame.tsx` orchestrates UI phases, sound, persistence and sharing. Browser
  state (progress, reduced motion, the daily date) is read through `useSyncExternalStore`, so the
  server render and hydration always agree.

Gameplay summary: three hearts, 9 survival points per second scaled by the multiplier, 25 points per
gem scaled by the multiplier, +1 multiplier every 4 gems (max 8x), ~3.2s combo window, level up every
18 seconds. Hazards: rotating shards (capsule collision), drones (circle collision) and laser gates
with a safe gap (AABB + gap check). Hazards always enter from outside the arena and gates always
leave a passable gap.

## SEO implementation

* Unique title, description, canonical, Open Graph and Twitter card metadata on every page
  (`pageMetadata()` in `lib/seo/site.ts`). `metadataBase` is set from the configured origin.
* `app/robots.ts` and `app/sitemap.ts` generate `robots.txt` and `sitemap.xml` with absolute URLs.
  While no production origin is configured they intentionally emit a disallow rule and an empty
  sitemap, and every page is `noindex, nofollow`.
* The sitemap lists only the seven real public pages: `/`, `/games/glowbound`, `/how-to-play`,
  `/about`, `/contact`, `/privacy`, `/terms`.
* JSON-LD is emitted only for content that exists on the page: `WebSite` (site-wide), `VideoGame`
  (game page, with a real free `Offer`), `BreadcrumbList` (inner pages) and `FAQPage`
  (homepage + how-to-play, generated from the same copy that is rendered).
* No invented ratings, review counts, prices, player counts, organization details or fake global
  leaderboard are present. Scores are described (accurately) as local to the browser.
* Semantic headings (one `h1` per page), descriptive internal links, `header`/`main`/`footer`
  landmarks, and all content is server-rendered HTML.

## Performance notes

* Informational pages are static Server Components and ship no game JavaScript. Only the game page
  loads the engine/renderer.
* Fonts are self-hosted through `next/font` with `display: swap` (Orbitron + Inter), so there are no
  runtime requests to Google.
* The canvas loop idles when a menu, pause or results overlay is visible; the arena repaints only
  when playing or after a resize/phase change.
* No layout shift from the canvas: the arena box has a fixed responsive height, and the canvas is
  absolutely positioned inside it.

Measured with Lighthouse 12.8.2 (headless Chrome, mobile simulated throttling, `next start` on
localhost), one run per page after the Next.js 16 upgrade:

| Page               | Performance | Accessibility | Best practices | SEO | LCP  | CLS | TBT   |
| ------------------ | ----------- | ------------- | -------------- | --- | ---- | --- | ----- |
| `/` (homepage)     | 68          | 100           | 100            | 100 | 3.0s | 0   | 1.06s |
| `/games/glowbound` | 69          | 100           | 100            | 100 | 3.4s | 0   | 0.75s |

These are single-run numbers on one machine; hardware, network and hosting change them. The
performance score is dominated by framework hydration under simulated CPU throttling (no
third-party scripts are present). Re-measure against the deployed URL after launch.

## Accessibility

* Keyboard-operable UI, visible focus rings, skip link, labelled icon buttons and `aria-pressed`
  state on toggles.
* Game overlays are announced as dialogs; game status is announced through a polite live region and
  the canvas is decorative to assistive tech.
* `prefers-reduced-motion` disables particles, screen shake and decorative CSS animation.
* Lighthouse reports zero accessibility failures and no contrast failures.

The game itself is input-driven and is not playable with a screen reader; only the surrounding
content and controls are fully accessible.

## Security

* No secrets, API keys or third-party scripts are used. Client code contains no server-only values.
* `JSON-LD` is serialised with `<` escaped, so page content cannot break out of the script tag.
* Production responses set `Content-Security-Policy` (self-only, no third-party origins),
  `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` and a
  restrictive `Permissions-Policy`. The CSP is only applied in production so HMR keeps working.
* Dependencies are pinned and `npm audit` reports **0 vulnerabilities**.

## Testing

Automated (run and passing):

```bash
npm run typecheck   # clean
npm run lint        # clean
npm test            # 33/33 passing
npm run build       # production build succeeds
```

Unit tests cover seed determinism, daily seeds, survival scoring, gem collection, multiplier growth
and cap, combo expiry, drone/shard/gate collisions, invulnerability, game over, pause, restart,
player bounds, resize, off-screen hazard entry, gate gap safety, gem spawn distance, and
localStorage read/write/validation/failure handling.

Optional browser smoke test against a running production build:

```bash
npm run build
npm start -- -p 3123
npm run smoke         # uses installed Chrome; set CHROME_PATH if needed
```

It drives a real browser with the DevTools Protocol and checks: Play starts a run, the score climbs,
the canvas paints, keyboard input works, pause freezes the score, the run ends, the result is written
to `localStorage` and a personal best is recorded, Play again restarts, and the mobile layout has no
horizontal overflow with working touch drag. Last run: 16/16 checks passed on the Next.js 16 build.

SEO was verified by fetching the rendered HTML for every route with and without
`NEXT_PUBLIC_SITE_URL`: unique titles and descriptions, exactly one `h1`, absolute canonicals,
`og:image`/`twitter:image`, valid JSON-LD, `robots.txt` and `sitemap.xml` in both states, the
generated social card, and a real 404.

Not performed: Google Rich Results Test (requires a public URL), Search Console submission,
cross-browser manual testing on physical iOS/Android devices, and screen-reader testing with real
assistive technology.

## Deploying to Vercel (free Hobby plan)

Nothing is deployed automatically; these are the steps for you to run when you approve. The first
build needs **no environment variables at all**: on Vercel the site canonicalises itself to the
project's own production URL (`VERCEL_PROJECT_PRODUCTION_URL`, i.e. `https://<project>.vercel.app`
for a free project, or your custom domain once one is added). No domain is hard-coded in the
repository.

1. Push the repository to GitHub (or GitLab/Bitbucket).
2. In Vercel: **Add New → Project → Import** the repository. The framework preset is detected as
   Next.js; build command `next build`, install `npm install`. No custom server, output directory
   override or extra configuration is required. The project uses only Next.js, React and Tailwind
   and is fully static, so it fits the free Hobby plan with no paid add-on.
3. Deploy. Node.js 20.9+ is required (Vercel's Node 22 runtime is fine). The game needs no paid
   service, database, API key or cron job.
4. Open the deployment URL Vercel gives you and confirm `/robots.txt` returns `Allow: /` with a
   `Sitemap:` line, and that page source contains `index, follow` with a canonical pointing at that
   same `*.vercel.app` origin.
5. Optional: add a custom domain later, then set `NEXT_PUBLIC_SITE_URL` to it (no trailing slash) in
   the project's Environment Variables and re-deploy. That variable takes priority over the Vercel
   URL and is inlined at build time, so a new deployment is required after changing it.
6. Do not set `NEXT_PUBLIC_SITE_URL` to a placeholder (for example `https://glowbound.example.com`);
   reserved domains are rejected and the site would fall back to `noindex`.

## Google Search Console after deployment

1. Add the property: `https://your-domain.com` (domain property if you can add a DNS record,
   otherwise a URL-prefix property).
2. Verify ownership via the DNS TXT record or the HTML meta tag route your DNS host provides.
3. Submit `https://your-domain.com/sitemap.xml` under **Indexing → Sitemaps**.
4. Use **URL Inspection** on `/`, `/games/glowbound`, `/how-to-play` and request indexing.
5. Watch **Pages** for "Duplicate, Google chose different canonical" or accidental `noindex`
   reports.
6. Validate the structured data with Google's Rich Results Test and the Schema Markup Validator.

Ranking for competitive queries depends on factors outside this codebase (competition, content
authority, backlinks, user engagement). This project provides the technical and content foundation;
it cannot promise a specific position.

## Google AdSense

GlowBound is **not** connected to AdSense and no ad code, publisher ID or placeholder slot exists in
the repository. The site is structurally ready for a review — original content on every page,
working navigation, a functional game, an accurate privacy policy and no deceptive click patterns —
but approval is decided by Google, not by this codebase.

If the owner opens an AdSense account and receives a publisher ID:

1. Set the site's privacy policy to describe the ad provider, cookies and consent choices in your
   region (the current page has an "Advertising" section ready to expand).
2. Add the AdSense script and ad slots only after approval, using the owner's real publisher ID and
   an approved consent management platform for EEA/UK traffic.
3. Update the CSP in `next.config.mjs` to allow only the exact AdSense domains required.
4. Re-test the game page, Lighthouse and the privacy policy after the change.

Nobody should claim AdSense approval until Google has actually granted it.

## Known limitations

* **No global leaderboard.** There is no backend, so scores are local and shareable via text/link
  only. Adding a real leaderboard would require a database and anti-cheat validation.
* **Daily challenge resets at 00:00 UTC** and is seeded client-side; a player could technically
  inspect the client code. It is a fairness convention, not a competitive ranking system.
* **Single-player, client-side game.** A determined player can manipulate local scores; they are
  personal bests, not verified records.
* Canvas gameplay is intentionally not screen-reader playable.
* The social card is generated at build time and is refreshed by a new deployment.
