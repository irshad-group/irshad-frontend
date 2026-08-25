import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  reactStrictMode: true,

  /**
   * Cap how long a cache may serve a prerendered page *after* it has gone
   * stale.
   *
   * Next's default is a year. Combined with the hour-long `revalidate` on the
   * public routes that produces
   * `s-maxage=3600, stale-while-revalidate=31532400`, which reads as: serve
   * this HTML for an hour, and if you cannot reach the origin, keep serving it
   * for the next twelve months. A returning visitor sat on a pre-deploy home
   * page for exactly that reason — the fix had shipped, the browser was still
   * showing HTML from before it.
   *
   * Matching `expireTime` to the revalidate period removes the stale window
   * entirely: the header ships as a bare `s-maxage=3600`, with the
   * `stale-while-revalidate` directive dropped rather than set to zero. A
   * cache must now revalidate the moment the hour is up, and a browser — which
   * ignores `s-maxage`, that being a shared-cache directive — revalidates on
   * every navigation, so a deploy lands on the next page load. Verified by
   * rebuilding behind a warm browser cache and reloading without bypassing it.
   *
   * The hour of fresh shared caching — the portal's largest performance lever —
   * is untouched.
   *
   * Do not reach for `headers()` to sharpen this further. A rule matching
   * `/:path*` *replaces* `Cache-Control` on every HTML response, which strips
   * the `s-maxage` from these pages and, far worse, overwrites the
   * `private, no-cache, no-store` that Next puts on dynamically rendered ones —
   * marking `/account` and `/admin` `public`. `e2e:public` asserts both halves.
   */
  expireTime: 3600,
  images: {
    // PocketBase serves record files from its own origin.
    remotePatterns: process.env.NEXT_PUBLIC_PB_URL
      ? [
          {
            protocol: new URL(process.env.NEXT_PUBLIC_PB_URL).protocol.replace(':', '') as 'http' | 'https',
            hostname: new URL(process.env.NEXT_PUBLIC_PB_URL).hostname,
          },
        ]
      : [],
  },
};

export default withNextIntl(nextConfig);
