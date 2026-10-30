import type { Metadata } from 'next';
import Link from 'next/link';
import { AD_SLOTS, AdBanner } from '@/components/AdBanner';
import { StructuredData } from '@/components/seo/StructuredData';
import { breadcrumbSchema } from '@/lib/seo/structured-data';
import { ROUTES, pageMetadata } from '@/lib/seo/site';

const DESCRIPTION =
  'GlowBound stores personal bests and a sound preference in your browser only. No accounts and no first-party analytics; Google AdSense advertising funds the site and is disclosed here.';

export const metadata: Metadata = pageMetadata({
  title: 'Privacy Policy — GlowBound',
  description: DESCRIPTION,
  path: ROUTES.privacy,
});

const BREADCRUMBS = [
  { name: 'Home', path: ROUTES.home },
  { name: 'Privacy', path: ROUTES.privacy },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-20 pt-8 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <li>
            <Link href={ROUTES.home} className="transition hover:text-white">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-slate-300">
            Privacy
          </li>
        </ol>
      </nav>

      <article className="prose-neon max-w-none">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Privacy policy</h1>
        <p className="mt-4 text-slate-400">
          GlowBound is a static website with a browser game. It has no accounts, no database and no
          server-side application logic to collect personal information.
        </p>

        <section aria-labelledby="stored">
          <h2 id="stored">What is stored in your browser</h2>
          <p>
            The game saves a small progress record in <code>localStorage</code> under the key{' '}
            <code>glowbound.progress.v1</code>. It contains:
          </p>
          <ul>
            <li>your best classic score;</li>
            <li>your best daily-challenge score for each date you have played;</li>
            <li>your best combo;</li>
            <li>the number of runs you have played;</li>
            <li>whether sound effects are enabled.</li>
          </ul>
          <p>
            This data never leaves your device. It is not transmitted to a server, not shared with
            third parties, and not used for advertising or profiling.
          </p>
        </section>

        <section aria-labelledby="not-collected">
          <h2 id="not-collected">What is not collected</h2>
          <ul>
            <li>No first-party cookies, tracking pixels or analytics are used.</li>
            <li>No accounts, email addresses or payment details are requested.</li>
            <li>Apart from the advertising scripts described below, no fonts, scripts or images are
              loaded from third-party domains at runtime.</li>
          </ul>
        </section>

        <section aria-labelledby="advertising">
          <h2 id="advertising">Advertising and cookies</h2>
          <p>
            GlowBound is free because it displays advertising, served by Google AdSense. Ads fund the
            hosting of the site and the game; there are no purchases, subscriptions or paywalls.
            Advertising is the only third-party service that may set cookies on this site.
          </p>
          <p>Google, as a third-party vendor, uses cookies to serve ads on this site:</p>
          <ul>
            <li>
              Google&apos;s use of advertising cookies (including the DoubleClick DART cookie) allows
              it and its partners to serve ads based on your visits to this site and other sites on
              the internet. You can opt out of personalised advertising by visiting{' '}
              <a href="https://adssettings.google.com/" rel="noopener noreferrer nofollow">
                Google Ads Settings
              </a>
              .
            </li>
            <li>
              Third-party vendors may use cookies to serve ads based on your visits to this site and
              other sites. See{' '}
              <a href="https://policies.google.com/technologies/cookies" rel="noopener noreferrer nofollow">
                How Google uses cookies
              </a>{' '}
              and{' '}
              <a href="https://policies.google.com/technologies/ads" rel="noopener noreferrer nofollow">
                How Google uses information from sites or apps that use our services
              </a>{' '}
              for details on the cookies used, how they are used and how to opt out of third-party
              cookies.
            </li>
          </ul>
          <p>
            Advertising scripts and cookies are loaded only when ads are shown. Disabling
            personalised ads in your Google account does not remove ads; it stops them being
            personalised. You can also opt out of many other ad networks through the industry tools
            linked from{' '}
            <a href="https://policies.google.com/technologies/ads" rel="noopener noreferrer nofollow">
              Google&apos;s advertising policies
            </a>
            .
          </p>
        </section>

        <section aria-labelledby="sharing">
          <h2 id="sharing">Share buttons</h2>
          <p>
            The results screen can share your score using your device&apos;s native share sheet (Web
            Share API) or your clipboard. Nothing is sent anywhere unless you choose to share, and the
            action is carried out by your browser or operating system, not by GlowBound.
          </p>
        </section>

        <section aria-labelledby="hosting">
          <h2 id="hosting">Hosting logs</h2>
          <p>
            The site is deployed to a static hosting provider (for example Vercel). Like any web host,
            it may record standard technical request logs such as IP address, user agent and requested
            URL for security and reliability. Those logs are handled by the host, not by the game, and
            no code on this site reads them.
          </p>
        </section>

        <section aria-labelledby="deleting">
          <h2 id="deleting">Deleting your data</h2>
          <p>
            To remove all GlowBound data, clear site data for this domain in your browser settings, or
            run this in the browser console:
          </p>
          <p>
            <code>localStorage.removeItem(&apos;glowbound.progress.v1&apos;)</code>
          </p>
          <p>
            Because nothing is stored on a server, there is no account to delete and no remote copy to
            request.
          </p>
        </section>

        <section aria-labelledby="children">
          <h2 id="children">Children</h2>
          <p>
            GlowBound does not collect personal information from anyone, including children. There
            are no chat features and no user-generated content, and no account system through which
            a child could hand over data.
          </p>
        </section>

        <section aria-labelledby="changes">
          <h2 id="changes">Changes to this policy</h2>
          <p>
            If the game ever adds a feature that changes this policy — a backend leaderboard, for
            example — this page will be updated before the feature ships.
          </p>
        </section>

        <p>
          Questions about the project can be answered from the <Link href={ROUTES.about}>about page</Link>
          . Ready to play? <Link href={ROUTES.game}>Open GlowBound</Link>.
        </p>
      </article>

      <AdBanner slot={AD_SLOTS.content} className="mt-12" />

      <StructuredData id="breadcrumb-jsonld" data={breadcrumbSchema(BREADCRUMBS)} />
    </div>
  );
}
