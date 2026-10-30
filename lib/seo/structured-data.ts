import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, absoluteUrl } from './site';

type JsonLd = Record<string, unknown>;

/**
 * Structured-data builders.
 *
 * Only properties that are verifiably true for this project are emitted: no
 * invented ratings, review counts, prices, publisher details or player counts.
 */

export function webSiteSchema(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: absoluteUrl('/'),
    description: SITE_DESCRIPTION,
    inLanguage: 'en',
  };
}

export function videoGameSchema(): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    name: SITE_NAME,
    url: absoluteUrl('/games/glowbound'),
    description:
      'GlowBound is a free browser arcade survival game. Guide a glowing energy orb through neon hazards, collect energy gems, build score multipliers and survive increasingly difficult waves.',
    genre: ['Arcade', 'Survival', 'Casual'],
    gamePlatform: ['Web browser'],
    playMode: 'SinglePlayer',
    applicationCategory: 'Game',
    operatingSystem: 'Any modern web browser on desktop or mobile',
    inLanguage: 'en',
    isAccessibleForFree: true,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
  };
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export function breadcrumbSchema(items: BreadcrumbItem[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export interface FaqItem {
  question: string;
  answer: string;
}

export function faqSchema(items: FaqItem[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

export function siteUrlForPath(path: string): string {
  return `${SITE_URL}${path === '/' ? '' : path}`;
}
