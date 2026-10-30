import type { Metadata } from 'next';
import Link from 'next/link';
import { AD_SLOTS, AdBanner } from '@/components/AdBanner';
import { ButtonLink } from '@/components/ui/Button';
import { StructuredData } from '@/components/seo/StructuredData';
import { breadcrumbSchema } from '@/lib/seo/structured-data';
import { ROUTES, pageMetadata } from '@/lib/seo/site';

const DESCRIPTION =
  'How to reach the GlowBound project: there is no support inbox, account system or live chat. Where to send feedback, bug reports and privacy questions.';

export const metadata: Metadata = pageMetadata({
  title: 'Contact — GlowBound',
  description: DESCRIPTION,
  path: ROUTES.contact,
});

const BREADCRUMBS = [
  { name: 'Home', path: ROUTES.home },
  { name: 'Contact', path: ROUTES.contact },
];

const BUG_REPORT_DETAILS = [
  'Your browser and version (for example Chrome 142 on Windows 11, or Safari on iOS 19).',
  'Whether you were playing on desktop or a phone or tablet.',
  'What you did, what happened, and what you expected instead.',
  'Whether the run was classic or the daily challenge, and the level or score shown when it happened.',
];

export default function ContactPage() {
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
            Contact
          </li>
        </ol>
      </nav>

      <article className="prose-neon max-w-none">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Contact</h1>
        <p className="mt-4 text-lg text-slate-300">
          GlowBound is a small, independent browser game. There is no support desk, no account
          system and no live chat, so this page explains what can and cannot be answered.
        </p>

        <section aria-labelledby="no-inbox">
          <h2 id="no-inbox">There is no support inbox published yet</h2>
          <p>
            No public contact address is listed on this site, because none has been set up. Nothing
            on this page is a placeholder address: if an inbox is opened later, it will appear here
            and in the site footer. Do not send mail to addresses guessed from this domain —
            unrelated addresses may belong to someone else.
          </p>
        </section>

        <section aria-labelledby="scores">
          <h2 id="scores">What cannot be recovered</h2>
          <p>
            Scores, combo records and the sound setting are stored only in your own browser under{' '}
            <code>glowbound.progress.v1</code>. Nothing is uploaded, so there is no server-side copy
            to look up, restore or delete. Clearing site data in your browser is the only removal
            path, and it also removes your personal bests. The{' '}
            <Link href={ROUTES.privacy}>privacy page</Link> lists exactly what is kept.
          </p>
        </section>

        <section aria-labelledby="feedback">
          <h2 id="feedback">Reporting a bug or sharing feedback</h2>
          <p>
            When an inbox is available, a useful report includes the following. Having these details
            ready now also makes it easy to check whether a problem is on your device or on the site.
          </p>
          <ul>
            {BUG_REPORT_DETAILS.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
          <p>
            Before reporting a gameplay problem, reload the page once. A stale tab after a new
            deployment is the most common cause of odd behaviour, and a hard refresh fixes it.
          </p>
        </section>

        <section aria-labelledby="project">
          <h2 id="project">Questions about the project</h2>
          <p>
            Most questions about how GlowBound works are already answered on the site: the{' '}
            <Link href={ROUTES.howToPlay}>how-to-play guide</Link> covers controls, scoring, hazards
            and strategy, the <Link href={ROUTES.about}>about page</Link> explains the technology and
            design principles, and the <Link href={ROUTES.terms}>terms of use</Link> describe the
            conditions for playing.
          </p>
        </section>

        <div className="mt-12 flex flex-wrap gap-3">
          <ButtonLink href={ROUTES.game} size="lg">
            Play GlowBound
          </ButtonLink>
          <ButtonLink href={ROUTES.about} variant="secondary" size="lg">
            About the project
          </ButtonLink>
        </div>
      </article>

      <AdBanner slot={AD_SLOTS.content} className="mt-12" />

      <StructuredData id="breadcrumb-jsonld" data={breadcrumbSchema(BREADCRUMBS)} />
    </div>
  );
}
