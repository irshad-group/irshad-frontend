import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { localized } from '@/lib/i18n';
import { parseListParams } from '@/lib/public/procedures';
import { listAllPublic, listPublic } from '@/lib/pb/queries/public';
import { Container, EmptyState, buttonClass, cn } from '@/components/ui/primitives';
import ProcedureCard from '@/components/public/ProcedureCard';

/**
 * All procedures, optionally narrowed to one tag.
 *
 * Reading `searchParams` makes this route dynamic, which is correct: the filter
 * and page number are unbounded, so there is nothing meaningful to prerender.
 * The procedure pages it links to are still static.
 */
export default async function ProceduresIndex({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const { tag, page } = parseListParams(await searchParams);
  const tags = await listAllPublic('tags', { sort: 'name_en' });
  const active = tags.find((candidate) => candidate.slug === tag);

  const { items, totalPages, totalItems } = await listPublic('procedures', {
    // An unknown tag filters to nothing rather than silently showing everything,
    // which would misrepresent the result as "these are tagged X".
    filter: tag ? `tags.slug ?= ${JSON.stringify(tag)}` : '',
    expand: 'tags',
    sort: '-featured,sort_order',
    page,
    perPage: 12,
  });

  return (
    <Container className="py-10">
      <h1 className="text-3xl font-semibold text-ink-900">{t('procedures.title')}</h1>
      <p className="mt-2 text-ink-600">{t('procedures.intro')}</p>

      {/* Tag filter as links, so it works without JavaScript and each filtered
          view has its own shareable URL. */}
      <nav aria-label={t('procedures.filterByTag')} className="mt-6">
        <ul className="flex flex-wrap gap-2">
          <li>
            <Link
              href="/procedures"
              aria-current={!tag ? 'true' : undefined}
              className={cn(
                'inline-block rounded-full px-3 py-1 text-sm',
                !tag ? 'bg-brand-500 text-white' : 'bg-white text-ink-700 ring-1 ring-ink-200',
              )}
            >
              {t('procedures.allTags')}
            </Link>
          </li>
          {tags.map((candidate) => {
            const selected = candidate.slug === tag;
            return (
              <li key={candidate.id}>
                <Link
                  href={`/procedures?tag=${encodeURIComponent(candidate.slug)}`}
                  aria-current={selected ? 'true' : undefined}
                  className={cn(
                    'inline-block rounded-full px-3 py-1 text-sm',
                    selected
                      ? 'bg-brand-500 text-white'
                      : 'bg-white text-ink-700 ring-1 ring-ink-200 hover:ring-brand-500',
                  )}
                >
                  {localized(candidate, 'name', locale)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <p className="mt-6 text-sm text-ink-500" aria-live="polite">
        {t('procedures.count', { count: totalItems })}
      </p>

      {items.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title={t('procedures.emptyTitle')}
            description={
              active
                ? t('procedures.emptyTagged', { tag: localized(active, 'name', locale) })
                : t('procedures.emptyBody')
            }
            action={
              <Link href="/procedures" className={buttonClass('secondary')}>
                {t('procedures.clearFilter')}
              </Link>
            }
          />
        </div>
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((procedure) => (
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

      {totalPages > 1 ? (
        <nav aria-label={t('procedures.pagination')} className="mt-8 flex items-center gap-3">
          {page > 1 ? (
            <Link
              href={`/procedures?${new URLSearchParams({ ...(tag ? { tag } : {}), page: String(page - 1) })}`}
              className={buttonClass('secondary')}
              rel="prev"
            >
              {t('common.previous')}
            </Link>
          ) : null}
          <span className="text-sm text-ink-500">
            {t('common.page', { page, total: totalPages })}
          </span>
          {page < totalPages ? (
            <Link
              href={`/procedures?${new URLSearchParams({ ...(tag ? { tag } : {}), page: String(page + 1) })}`}
              className={buttonClass('secondary')}
              rel="next"
            >
              {t('common.next')}
            </Link>
          ) : null}
        </nav>
      ) : null}
    </Container>
  );
}
