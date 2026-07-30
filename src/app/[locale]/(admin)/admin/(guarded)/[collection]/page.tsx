import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import DataTable from '@/components/admin/DataTable';
import { Pagination, SearchBox } from '@/components/admin/ListControls';
import { Card, PageHeader, buttonClass } from '@/components/ui/primitives';
import { Link } from '@/i18n/navigation';
import { getCollectionDef } from '@/lib/admin/registry';
import { getSessionUser, isAdmin } from '@/lib/auth';
import { listRecords } from '@/lib/pb/collections';

const PER_PAGE = 25;

/** Builds a PocketBase filter from the search box, escaping the user's input. */
function searchFilter(fields: readonly string[], query: string): string | undefined {
  const trimmed = query.trim();
  if (!trimmed) return undefined;
  const safe = trimmed.replace(/["\\]/g, '\\$&');
  return fields.map((field) => `${field} ~ "${safe}"`).join(' || ');
}

export default async function CollectionListPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; collection: string }>;
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { locale, collection } = await params;
  const { q = '', page: pageParam } = await searchParams;
  setRequestLocale(locale);

  const def = getCollectionDef(collection);
  if (!def) notFound();

  const user = await getSessionUser();
  // Mirrors the sidebar's filtering. 404 rather than 403 keeps admin-only
  // sections unenumerable by a moderator.
  if (def.adminOnly && !isAdmin(user)) notFound();

  const t = await getTranslations('common');
  const tAdmin = await getTranslations('admin');

  const page = Math.max(1, Number(pageParam) || 1);
  const result = await listRecords(def.name, {
    page,
    perPage: PER_PAGE,
    sort: def.defaultSort,
    filter: searchFilter(def.searchFields, q),
    expand: def.expand,
  });

  const rows = result.items as unknown as Array<Record<string, unknown> & { id: string }>;

  return (
    <>
      <PageHeader
        title={def.labelPlural}
        description={def.description}
        actions={
          def.canCreate ? (
            <Link href={`/admin/${def.name}/new`} className={buttonClass('primary')}>
              {tAdmin('newRecord', { label: def.label.toLowerCase() })}
            </Link>
          ) : null
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <SearchBox
          placeholder={tAdmin('searchPlaceholder', { label: def.labelPlural.toLowerCase() })}
          label={t('search')}
        />
        <span className="text-sm text-ink-500">{t('results', { count: result.totalItems })}</span>
      </div>

      <Card>
        <DataTable def={def} rows={rows} locale={locale} />
        <Pagination
          page={result.page}
          totalPages={result.totalPages}
          labels={{
            previous: t('previous'),
            next: t('next'),
            summary: t('page', { page: result.page, total: result.totalPages }),
          }}
        />
      </Card>
    </>
  );
}
