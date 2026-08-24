import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mphmeistrid.ee';
const apexHost = new URL(siteUrl).host;

/**
 * No CSP here yet. The site loads Cloudflare Turnstile and is worth pinning against a real
 * deployment rather than guessing origins up front — same call as diipsolutions.eu.
 */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,

  images: {
    // Photos are pre-optimised into a WebP ladder in R2. See src/lib/image-loader.ts.
    loader: 'custom',
    loaderFile: './src/lib/image-loader.ts',
  },

  // sharp is a native module; bundling it breaks the binary resolution on Vercel.
  serverExternalPackages: ['sharp'],

  experimental: {
    serverActions: {
      // Default is 1 MB, which the quote form's photo attachments exceed. The real ceiling
      // is Vercel's 4.5 MB serverless request-body limit, so this is set just under it —
      // raising it further would not work, it would only move where the failure appears.
      bodySizeLimit: '4mb',
    },
  },

  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      {
        // HSTS only over TLS. Sending it on plain HTTP makes Chrome force-upgrade
        // http://localhost and refuse to load the page, which breaks local Lighthouse runs.
        source: '/:path*',
        has: [{ type: 'header', key: 'x-forwarded-proto', value: 'https' }],
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
      {
        // The admin must never be indexed or embedded, whatever a crawler decides to do.
        source: '/admin/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
    ];
  },

  async redirects() {
    return [
      // Consolidate on the apex so ranking signal is not split across two hosts.
      {
        source: '/:path*',
        has: [{ type: 'host', value: `www.${apexHost}` }],
        destination: `${siteUrl}/:path*`,
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
