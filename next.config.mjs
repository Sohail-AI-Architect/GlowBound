/**
 * Content-Security-Policy for production only: development uses eval for HMR,
 * and every rendered page relies on Next.js inline bootstrap scripts and inline
 * styles, so 'unsafe-inline' is required for script-src and style-src.
 */
/**
 * Hosts Google AdSense needs: the loader script, the ad iframes it embeds and
 * the endpoints this document calls for ads and measurement. Ad creative images
 * and styles live inside Google's cross-origin iframe, which this policy does
 * not govern — only the frame URL itself must be allowed here.
 */
const ADSENSE_SCRIPT_SRC = [
  'https://pagead2.googlesyndication.com',
  'https://googleads.g.doubleclick.net',
  'https://www.googleadservices.com',
  'https://tpc.googlesyndication.com',
];
const ADSENSE_FRAME_SRC = [
  'https://googleads.g.doubleclick.net',
  'https://ad.doubleclick.net',
  'https://www.google.com',
  'https://adservice.google.com',
  'https://tpc.googlesyndication.com',
];
const ADSENSE_CONNECT_SRC = [
  'https://pagead2.googlesyndication.com',
  'https://googleads.g.doubleclick.net',
  'https://www.googleadservices.com',
  'https://tpc.googlesyndication.com',
  'https://www.google.com',
];
const ADSENSE_IMG_SRC = [
  'https://pagead2.googlesyndication.com',
  'https://googleads.g.doubleclick.net',
  'https://ad.doubleclick.net',
  'https://tpc.googlesyndication.com',
  'https://www.google.com',
];

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  `script-src 'self' 'unsafe-inline' ${ADSENSE_SCRIPT_SRC.join(' ')}`,
  `style-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com`,
  `img-src 'self' data: blob: ${ADSENSE_IMG_SRC.join(' ')}`,
  "font-src 'self' data:",
  `connect-src 'self' ${ADSENSE_CONNECT_SRC.join(' ')}`,
  `frame-src ${ADSENSE_FRAME_SRC.join(' ')}`,
  "manifest-src 'self'",
].join('; ');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    const securityHeaders = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
      },
    ];

    if (process.env.NODE_ENV === 'production') {
      securityHeaders.push({ key: 'Content-Security-Policy', value: CONTENT_SECURITY_POLICY });
    }

    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
