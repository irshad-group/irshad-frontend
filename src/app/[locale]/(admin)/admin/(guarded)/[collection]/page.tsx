import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import DataTable from '@/components/admin/DataTable';
import { Pagination, RelationFilter, SearchBox } from '@/components/admin/ListControls';
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
  searchParams: Promise<{ q?: string; page?: string; f?: string }>;
}) {
  const { locale, collection } = await params;
  const { q = '', page: pageParam, f = '' } = await searchParams;
  setRequestLocale(locale);

  const def = getCollectionDef(collection);
  if (!def) notFound();

  const user = await getSessionUser();
  // Mirrors the sidebar's filtering. 404 rather than 403 keeps admin-only
  // sections unenumerable by a moderator.
  if (def.adminOnly && !isAdmin(user)) notFound();

  const t = await getTranslations('common');
  const tAdmin = await getTranslations('admin');

  // The relation filter value arrives from the URL; only a well-formed record
  // id is ever placed into the PocketBase filter.
  const relationValue = /^[a-z0-9]{15}$/i.test(f) ? f : '';
  const filters = [
    searchFilter(def.searchFields, q),
    def.listFilter && relationValue ? `${def.listFilter.name} = "${relationValue}"` : undefined,
  ].filter(Boolean);

  const filterOptions = def.listFilter
    ? (
        await listRecords(def.listFilter.collection, {
          page: 1,
          perPage: 200,
          sort: def.listFilter.labelField,
          fields: `id,${def.listFilter.labelField}`,
        })
      ).items.map((item) => ({
        id: item.id,
        label: String(
          (item as unknown as Record<string, unknown>)[def.listFilter!.labelField] ?? item.id,
        ),
      }))
    : [];

  const page = Math.max(1, Number(pageParam) || 1);
  const result = await listRecords(def.name, {
    page,
    perPage: PER_PAGE,
    sort: def.defaultSort,
    filter: filters.length ? filters.map((part) => `(${part})`).join(' && ') : undefined,
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
        <div className="flex flex-wrap items-center gap-2">
          <SearchBox
            placeholder={tAdmin('searchPlaceholder', { label: def.labelPlural.toLowerCase() })}
            label={t('search')}
          />
          {def.listFilter ? (
            <RelationFilter
              label={def.listFilter.label}
              allLabel={`${def.listFilter.label}: all`}
              options={filterOptions}
            />
          ) : null}
        </div>
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
