import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

/**
 * Placeholder only.
 *
 * The citizen-facing pages are deliberately not built yet — they are waiting on
 * the UI/UX design. This exists so the app has a valid route at `/` and so the
 * i18n and routing wiring can be exercised; replace it wholesale when the
 * designs land. Do not grow it into the real home page by accretion.
 */
export default async function PublicPlaceholder({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-medium tracking-wide text-brand-600 uppercase">
        {t('site.name')} — {t('site.tagline')}
      </p>
      <h1 className="mt-3 text-3xl font-semibold text-ink-900">{t('site.underConstruction')}</h1>
      <p className="mt-4 leading-relaxed text-ink-600">{t('site.underConstructionBody')}</p>
      <div className="mt-8">
        <Link
          href="/admin"
          className="inline-flex items-center rounded-md bg-brand-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-600"
        >
          {t('site.goToAdmin')}
        </Link>
      </div>
    </main>
  );
}
