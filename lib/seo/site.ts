import type { Metadata } from 'next';

/**
 * Canonical production origin.
 *
 * Set `NEXT_PUBLIC_SITE_URL` to the real origin (e.g. `https://glowbound.com`,
 * no trailing slash) in Vercel's environment variables **before** the production
 * deployment. On Vercel, `VERCEL_PROJECT_PRODUCTION_URL` (the stable production
 * domain of the project) is used automatically when the explicit variable is
 * missing.
 *
 * Both variables are inlined at build time, so changing either one requires a
 * rebuild — restarting the server alone has no effect. Values are also accepted
 * without a scheme (`glowbound.com`) and are normalised to `https://`.
 *
 * If neither is available the site falls back to `http://localhost:3000` for
 * local development and marks every page `noindex, nofollow` (see
 * `IS_CANONICAL_URL_CONFIGURED`), and `robots.txt` disallows crawling. That
 * guarantees a reserved placeholder such as `glowbound.example.com` is never
 * emitted as a canonical URL or treated as the live domain.
 */
const PRODUCTION_URL_ENV = process.env.NEXT_PUBLIC_SITE_URL?.trim();
const VERCEL_PRODUCTION_URL_ENV = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();

const LOCAL_FALLBACK_URL = 'http://localhost:3000';

/** Reserved documentation domains that must never be used as a live origin. */
function isReservedHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return (
    host === 'example.com' ||
    host === 'example.org' ||
    host === 'example.net' ||
    host.endsWith('.example.com') ||
    host.endsWith('.example.org') ||
    host.endsWith('.example.net') ||
    host.endsWith('.example') ||
    host === 'localhost'
  );
}

function normalizeOrigin(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  // Accept values pasted without a scheme (e.g. `glowbound.com` copied from a
  // DNS panel) instead of silently discarding them and falling back to another
  // origin — a mistyped variable would otherwise change canonical URLs without
  // any visible sign of the problem.
  const candidate = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(candidate);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    if (isReservedHost(url.hostname)) return null;
    return url.origin;
  } catch {
    return null;
  }
}

const configuredOrigin =
  normalizeOrigin(PRODUCTION_URL_ENV) ??
  (VERCEL_PRODUCTION_URL_ENV ? normalizeOrigin(`https://${VERCEL_PRODUCTION_URL_ENV}`) : null);

/** True only when a real, non-placeholder production origin is configured. */
export const IS_CANONICAL_URL_CONFIGURED = configuredOrigin !== null;

/** Absolute origin without a trailing slash. Never a placeholder domain. */
export const SITE_URL = configuredOrigin ?? LOCAL_FALLBACK_URL;

export const SITE_NAME = 'GlowBound';
export const SITE_TITLE = 'GlowBound — Free Neon Arcade Survival Game';
export const SITE_DESCRIPTION =
  'Play GlowBound free in your browser: steer a glowing orb through neon hazards, collect energy gems and chain combos for a higher score. No download, no sign-up.';
export const SITE_TAGLINE = 'Bound by light. Chased by the dark.';

/** The generated social card lives at this route (app/opengraph-image.tsx). */
export const OG_IMAGE = {
  url: '/opengraph-image',
  width: 1200,
  height: 630,
  alt: 'GlowBound — a free neon arcade survival game played in the browser',
} as const;

export const ROUTES = {
  home: '/',
  game: '/games/glowbound',
  howToPlay: '/how-to-play',
  about: '/about',
  contact: '/contact',
  privacy: '/privacy',
  terms: '/terms',
} as const;

export const NAV_LINKS = [
  { href: ROUTES.game, label: 'Play', description: 'Jump straight into the arcade' },
  { href: ROUTES.howToPlay, label: 'How to play', description: 'Controls, scoring and strategies' },
  { href: ROUTES.about, label: 'About', description: 'Why GlowBound exists' },
] as const;

export function absoluteUrl(path = '/'): string {
  const url = new URL(path, `${SITE_URL}/`).toString();
  // The homepage is published without a trailing slash so the canonical tag,
  // Open Graph URL and sitemap entry all describe the same URL.
  return url === `${SITE_URL}/` ? SITE_URL : url;
}

/** Robots directives shared by the layout and every page. */
export const ROBOTS_METADATA: Metadata['robots'] = IS_CANONICAL_URL_CONFIGURED
  ? {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    }
  : {
      index: false,
      follow: false,
      googleBot: { index: false, follow: false },
    };

interface PageMetadataInput {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  noIndex?: boolean;
}

/** Builds consistent per-page metadata with canonical, Open Graph and Twitter tags. */
export function pageMetadata({
  title,
  description,
  path,
  keywords,
  noIndex = false,
}: PageMetadataInput): Metadata {
  // Absolute (not relative) so the trailing slash of the homepage canonical is
  // consistent with the sitemap entry.
  const canonical = absoluteUrl(path);
  const blocked = noIndex || !IS_CANONICAL_URL_CONFIGURED;
  return {
    title,
    description,
    keywords,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      url: canonical,
      siteName: SITE_NAME,
      title,
      description,
      locale: 'en_US',
      images: [{ ...OG_IMAGE }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [{ ...OG_IMAGE }],
    },
    robots: blocked
      ? { index: false, follow: false, googleBot: { index: false, follow: false } }
      : ROBOTS_METADATA,
  };
}
