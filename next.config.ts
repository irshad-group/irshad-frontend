import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  reactStrictMode: true,
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
