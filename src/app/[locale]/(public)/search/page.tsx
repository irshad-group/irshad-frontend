import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { parseListParams } from '@/lib/public/procedures';
import {
  listPublic,
  PROCEDURE_SEARCH_FIELDS,
  searchFilter,
} from '@/lib/pb/queries/public';
import { Container, EmptyState, buttonClass } from '@/components/ui/primitives';
import ProcedureCard from '@/components/public/ProcedureCard';
import SearchBox from '@/components/public/SearchBox';

/**
 * Search results.
 *
 * The query lives in the URL, so a result page can be shared, bookmarked and
 * crawled, and the search itself needs no JavaScript. Matching runs across all
 * three languages' title and summary fields rather than only the active one —
 * someone who knows a term in Arabic should still find the record while reading
 * in Kurdish.
 */
export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const { q, page } = parseListParams(await searchParams);
  const filter = searchFilter(q, PROCEDURE_SEARCH_FIELDS);

  // An empty query is not an empty result set — it is no search at all.
  const results = filter
    ? await listPublic('procedures', { filter, expand: 'tags', page, perPage: 12 })
    : null;

  return (
    <Container className="py-10">
      <h1 className="text-3xl font-semibold text-ink-900">{t('search.title')}</h1>

      <div className="mt-6 max-w-xl">
        <SearchBox
          locale={locale}
          defaultValue={q}
          labels={{
            label: t('search.label'),
            placeholder: t('search.placeholder'),
            submit: t('search.submit'),
          }}
        />
      </div>

      {results === null ? (
        <p className="mt-8 text-ink-600">{t('search.prompt')}</p>
      ) : (
        <>
          <p className="mt-8 text-sm text-ink-500" aria-live="polite">
            {t('search.resultCount', { count: results.totalItems, query: q })}
          </p>

          {results.items.length === 0 ? (
            <div className="mt-4">
              {/* A dead end is the one thing a search page must not be. */}
              <EmptyState
                title={t('search.emptyTitle')}
                description={t('search.emptyBody')}
                action={
                  <Link href="/procedures" className={buttonClass('primary')}>
                    {t('search.browseAll')}
                  </Link>
                }
              />
            </div>
          ) : (
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.items.map((procedure) => (
                <ProcedureCard
                  key={procedure.id}
                  procedure={procedure}
                  locale={locale}
                  labels={{
                    free: t('procedure.free'),
                    fee: t('procedure.fee'),
                    time: t('procedure.processingTime'),
                  }}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </Container>
  );
}
