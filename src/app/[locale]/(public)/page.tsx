import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { localized } from '@/lib/i18n';
import { listPublic } from '@/lib/pb/queries/public';
import { Container, Prose } from '@/components/ui/primitives';
import ProcedureCard from '@/components/public/ProcedureCard';
import SearchBox from '@/components/public/SearchBox';

// See PUBLIC_REVALIDATE — segment config must be a literal.
export const revalidate = 3600;

/**
 * Home.
 *
 * Search comes first and large, because most visitors arrive knowing roughly
 * what they need. Featured procedures are the second path, for people who
 * cannot name it. The FAQ preview is third, answering the questions that are
 * not about any single procedure.
 *
 * The slider in the schema is deliberately not rendered as a carousel: rotating
 * banners bury content, are awkward with a screen reader, and on a slow
 * connection cost more than they return. Its entries are surfaced as static
 * cards instead.
 */
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const [featured, recent, faq] = await Promise.all([
    listPublic('procedures', { filter: 'featured = true', expand: 'tags', perPage: 6 }),
    listPublic('procedures', { sort: '-publish_date', expand: 'tags', perPage: 3 }),
    listPublic('faq', { sort: 'sort_order', perPage: 4 }),
  ]);

  const cardLabels = {
    free: t('procedure.free'),
    fee: t('procedure.fee'),
    time: t('procedure.processingTime'),
  };

  return (
    <>
      <section className="border-b border-ink-200/70 bg-white">
        <Container className="py-14">
          <h1 className="max-w-[var(--measure-narrow)] text-4xl font-semibold text-ink-900">
            {t('home.heading')}
          </h1>
          <p className="mt-4 max-w-[var(--measure-prose)] text-lg text-ink-600">
            {t('home.intro')}
          </p>
          <div className="mt-8 max-w-xl">
            <SearchBox
              locale={locale}
              size="large"
              labels={{
                label: t('search.label'),
                placeholder: t('search.placeholder'),
                submit: t('search.submit'),
              }}
            />
          </div>
        </Container>
      </section>

      <Container className="py-12">
        {featured.items.length > 0 ? (
          <section>
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-xl font-semibold text-ink-900">{t('home.featured')}</h2>
              <Link href="/procedures" className="text-sm text-brand-700 underline">
                {t('home.seeAll')}
              </Link>
            </div>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featured.items.map((procedure) => (
                <ProcedureCard
                  key={procedure.id}
                  procedure={procedure}
                  locale={locale}
                  labels={cardLabels}
                />
              ))}
            </ul>
          </section>
        ) : null}

        {recent.items.length > 0 ? (
          <section className="mt-12">
            <h2 className="text-xl font-semibold text-ink-900">{t('home.recent')}</h2>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recent.items.map((procedure) => (
                <ProcedureCard
                  key={procedure.id}
                  procedure={procedure}
                  locale={locale}
                  labels={cardLabels}
                />
              ))}
            </ul>
          </section>
        ) : null}

        {faq.items.length > 0 ? (
          <section className="mt-12">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-xl font-semibold text-ink-900">{t('home.faq')}</h2>
              <Link href="/faq" className="text-sm text-brand-700 underline">
                {t('home.allFaq')}
              </Link>
            </div>
            {/* Native disclosures: keyboard-operable and open without JavaScript. */}
            <div className="mt-4 space-y-2">
              {faq.items.map((entry) => (
                <details
                  key={entry.id}
                  className="rounded-lg bg-white px-4 py-3 ring-1 ring-ink-200/70"
                >
                  <summary className="cursor-pointer font-medium text-ink-900">
                    {localized(entry, 'question', locale)}
                  </summary>
                  <Prose className="mt-2" html={localized(entry, 'answer', locale)} />
                </details>
              ))}
            </div>
          </section>
        ) : null}
      </Container>
    </>
  );
}
