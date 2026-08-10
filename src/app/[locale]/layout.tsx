import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { IBM_Plex_Sans_Arabic } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { directionOf, isLocale, locales } from '@/i18n/routing';
import '../globals.css';

/**
 * One family for all three languages.
 *
 * IBM Plex Sans Arabic draws Latin and Arabic script from a single design, so
 * mixed-script lines — common here, where an Arabic sentence carries a Latin
 * acronym or a Western numeral — do not show a seam between two faces. Its
 * coverage of the Kurdish Sorani letters (ڕ ڵ ۆ ێ گ چ پ ژ ڤ ک ھ ە ی) was
 * verified against the font's character map, not assumed: a family that
 * "supports Arabic" can still miss these, and the browser then substitutes a
 * different face for single letters inside a word — which looks broken to a
 * Kurdish reader and fine to everyone else.
 *
 * `next/font` self-hosts the files at build time, so no visitor's browser ever
 * requests anything from Google.
 */
const sans = IBM_Plex_Sans_Arabic({
  subsets: ['latin', 'arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-plex',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Irshad',
  description: 'Guide to government services in Iraq.',
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} dir={directionOf(locale)} className={sans.variable}>
      <body className="min-h-screen antialiased">
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
