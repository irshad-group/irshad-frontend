'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Container, buttonClass } from '@/components/ui/primitives';

/**
 * Something failed while rendering inside a locale.
 *
 * In practice that almost always means PocketBase was unreachable or answered
 * with something unexpected. A visitor is told that in their own language and
 * given a way forward; they are never shown the underlying message, which would
 * be English, technical, and occasionally revealing about the backend.
 *
 * This sits inside `[locale]/layout.tsx`, so the translation provider is
 * available. An error thrown by that layout itself escapes this boundary and is
 * caught by `app/global-error.tsx`, which cannot know the locale.
 */
export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations();

  useEffect(() => {
    // The server log is where the detail belongs, not the page.
    console.error('Public route failed:', error);
  }, [error]);

  return (
    <Container width="narrow" className="py-20 text-center">
      <h1 className="text-3xl font-semibold text-ink-900">{t('error.title')}</h1>
      <p className="mt-4 text-ink-600">{t('error.body')}</p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {/* Re-runs the failed render. Worth offering first: the usual cause is
            a backend blip that has already passed. */}
        <button type="button" onClick={reset} className={buttonClass('primary')}>
          {t('error.retry')}
        </button>
        {/* A real anchor, not next/link, on purpose: this renders after a
            failed render, when the client router and the React tree may both
            be in a bad state. A full document load is the more reliable way
            out; a soft navigation could carry the broken state with it. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/" className={buttonClass('secondary')}>
          {t('error.home')}
        </a>
      </div>

      {/* The digest is the only handle support has to find this in the logs. */}
      {error.digest ? (
        <p className="mt-8 text-xs text-ink-400">
          {t('error.reference')} <code>{error.digest}</code>
        </p>
      ) : null}
    </Container>
  );
}
