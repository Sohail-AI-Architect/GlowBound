import type { MetadataRoute } from 'next';
import { IS_CANONICAL_URL_CONFIGURED, SITE_URL, absoluteUrl } from '@/lib/seo/site';

export default function robots(): MetadataRoute.Robots {
  if (!IS_CANONICAL_URL_CONFIGURED) {
    // No real production domain has been provided. Keep previews and local
    // builds out of search results instead of serving canonical URLs that point
    // at an unpublished origin.
    return {
      rules: [{ userAgent: '*', disallow: '/' }],
    };
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: SITE_URL,
  };
}
