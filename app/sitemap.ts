import type { MetadataRoute } from 'next';
import { IS_CANONICAL_URL_CONFIGURED, ROUTES, absoluteUrl } from '@/lib/seo/site';

export default function sitemap(): MetadataRoute.Sitemap {
  // Without a real production origin every URL would be wrong, so publish an
  // empty sitemap. `robots.txt` disallows crawling in the same state.
  if (!IS_CANONICAL_URL_CONFIGURED) return [];

  const lastModified = new Date();

  return [
    {
      url: absoluteUrl(ROUTES.home),
      lastModified,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: absoluteUrl(ROUTES.game),
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: absoluteUrl(ROUTES.howToPlay),
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: absoluteUrl(ROUTES.about),
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: absoluteUrl(ROUTES.contact),
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: absoluteUrl(ROUTES.privacy),
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: absoluteUrl(ROUTES.terms),
      lastModified,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ];
}
