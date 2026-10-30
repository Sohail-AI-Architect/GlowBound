import type { Metadata } from 'next';
import Link from 'next/link';
import { ButtonLink } from '@/components/ui/Button';
import { StructuredData } from '@/components/seo/StructuredData';
import { breadcrumbSchema } from '@/lib/seo/structured-data';
import { ROUTES, pageMetadata } from '@/lib/seo/site';

const DESCRIPTION =
  'The terms of use for GlowBound: free to play, no accounts or purchases, no warranty, and how the game and its content may be used.';

export const metadata: Metadata = pageMetadata({
  title: 'Terms of Use — GlowBound',
  description: DESCRIPTION,
  path: ROUTES.terms,
});

const BREADCRUMBS = [
  { name: 'Home', path: ROUTES.home },
  { name: 'Terms', path: ROUTES.terms },
];

export default function TermsPage() {
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
            Terms
          </li>
        </ol>
      </nav>

      <article className="prose-neon max-w-none">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Terms of use</h1>
        <p className="mt-4 text-slate-400">
          These terms cover your use of the GlowBound website and browser game. By playing or
          browsing the site you accept them. If you do not, please stop using the site.
        </p>

        <section aria-labelledby="free">
          <h2 id="free">Free to play</h2>
          <p>
            GlowBound costs nothing to play. There is no account, no subscription and no in-game
            purchase. Nothing on the site asks for payment details, and you should never enter
            them here. The site is funded by advertising, which never gates gameplay or content.
          </p>
        </section>

        <section aria-labelledby="licence">
          <h2 id="licence">What you may do</h2>
          <p>
            You may play GlowBound for personal enjoyment, including at home, at school or at work,
            and share links to it freely. Scores are stored on your own device and belong to you;
            there is no global leaderboard and no submitted content.
          </p>
        </section>

        <section aria-labelledby="restrictions">
          <h2 id="restrictions">What you may not do</h2>
          <ul>
            <li>
              Copy, republish, sell or redistribute the game, its code or its written content as your
              own product or service.
            </li>
            <li>
              Present GlowBound as an official app or use its name to imply endorsement of another
              site.
            </li>
            <li>
              Attempt to disrupt the site, overload it, or interfere with other visitors&apos; access.
            </li>
          </ul>
          <p>
            Nothing here restricts you from reading, studying or tinkering with the game for
            learning, or from using rights that applicable law gives you regardless of these terms.
          </p>
        </section>

        <section aria-labelledby="availability">
          <h2 id="availability">Availability and changes</h2>
          <p>
            The game is offered as-is and may change, be interrupted or be withdrawn at any time.
            Runs are client-side, so a new deployment or a cleared browser may reset your local
            bests. There is no guarantee that a score, feature or page will still exist later.
          </p>
        </section>

        <section aria-labelledby="warranty">
          <h2 id="warranty">No warranty</h2>
          <p>
            GlowBound is provided without warranties of any kind, express or implied, including
            fitness for a particular purpose and uninterrupted or error-free operation. It is an
            arcade game, not a service you rely on for work, data storage or safety.
          </p>
        </section>

        <section aria-labelledby="liability">
          <h2 id="liability">Limitation of liability</h2>
          <p>
            To the extent permitted by law, the project is not liable for indirect or consequential
            loss arising from use of the game, such as lost local scores or lost time. Nothing in
            these terms excludes liability that cannot lawfully be excluded, and mandatory consumer
            rights where you live are unaffected.
          </p>
        </section>

        <section aria-labelledby="privacy">
          <h2 id="privacy">Privacy</h2>
          <p>
            The game stores progress locally in your browser and collects nothing else. The{' '}
            <Link href={ROUTES.privacy}>privacy policy</Link> explains this in detail, including how
            to delete the stored data.
          </p>
        </section>

        <section aria-labelledby="changes">
          <h2 id="changes">Changes to these terms</h2>
          <p>
            These terms may be updated as the site changes — for example if a leaderboard or new game
            mode is introduced later. The current version always applies to the site as it is
            published.
          </p>
        </section>

        <div className="mt-12 flex flex-wrap gap-3">
          <ButtonLink href={ROUTES.game} size="lg">
            Play GlowBound
          </ButtonLink>
          <ButtonLink href={ROUTES.contact} variant="secondary" size="lg">
            Contact
          </ButtonLink>
        </div>
      </article>

      <StructuredData id="breadcrumb-jsonld" data={breadcrumbSchema(BREADCRUMBS)} />
    </div>
  );
}
