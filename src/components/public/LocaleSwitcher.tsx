'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { localeLabels, locales } from '@/i18n/routing';
import { cn } from '@/components/ui/primitives';

/**
 * Language switcher: English / العربية / کوردی.
 *
 * Locale is the first path segment (`localePrefix: 'always'`), so switching
 * language is a navigation, not a setting. `usePathname` from next-intl returns
 * the path *without* the locale prefix and next-intl's `Link` re-adds the one
 * for its `locale` prop, so a visitor on `/en/procedures/renew-iraqi-passport`
 * lands on `/ar/procedures/renew-iraqi-passport` rather than being dumped back
 * on the home page.
 *
 * Slugs are single-valued in the schema — one `slug` per record, shared by all
 * three languages — so preserving the path is a plain segment swap with no slug
 * translation involved.
 */
function LocaleLinks({ label, query }: { label: string; query: string }) {
  const pathname = usePathname();
  const active = useLocale();
  const href = query ? `${pathname}?${query}` : pathname;

  return (
    <nav aria-label={label} className="flex items-center gap-1">
      {locales.map((locale) => {
        const current = locale === active;
        return (
          <Link
            key={locale}
            href={href}
            locale={locale}
            // `lang`/`hrefLang` let a screen reader switch to the right voice
            // for each label, and tell crawlers what they point at.
            lang={locale}
            hrefLang={locale}
            aria-current={current ? 'true' : undefined}
            className={cn(
              // The switcher is the one control a reader who cannot read the
              // current language depends on, so it gets a full 44px touch
              // target on a phone and settles back to 36px once there is a
              // mouse. `px-1.5` on the narrowest screens keeps three languages
              // plus the brand and drawer inside 320px.
              'flex min-h-11 items-center rounded-md px-1.5 text-sm transition-colors sm:px-2 md:min-h-9',
              current
                ? 'bg-brand-50 font-medium text-brand-700'
                : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900',
            )}
          >
            {localeLabels[locale]}
          </Link>
        );
      })}
    </nav>
  );
}

function LocaleLinksWithQuery({ label }: { label: string }) {
  return <LocaleLinks label={label} query={useSearchParams().toString()} />;
}

/**
 * `useSearchParams` forces a static page to bail out to client rendering, and a
 * production build fails outright unless it sits behind a Suspense boundary.
 * The boundary is owned here rather than left to each caller, and the fallback
 * is the same switcher minus the query string — so the prerendered HTML still
 * carries real, crawlable language links that work without JavaScript, and the
 * query-preserving version takes over once the client knows the search params.
 */
export default function LocaleSwitcher({ label }: { label: string }) {
  return (
    <Suspense fallback={<LocaleLinks label={label} query="" />}>
      <LocaleLinksWithQuery label={label} />
    </Suspense>
  );
}
