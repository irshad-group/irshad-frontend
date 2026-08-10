import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { localized } from '@/lib/i18n';
import { listAllPublic } from '@/lib/pb/queries/public';
import { Container, EmptyState, buttonClass, cn } from '@/components/ui/primitives';
import type { DirectoratesRecord, MinistriesRecord } from '@/types/pb';

/**
 * Every directorate, optionally narrowed to those with an office in one
 * province — the question a citizen actually asks: "who can I go to near me?"
 *
 * Provinces have no slug in the schema, so the ISO code (`IQ-BG`) is the URL
 * key. It is stable, readable, and already unique.
 */
export default async function DirectoratesIndex({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const raw = await searchParams;
  const code = (Array.isArray(raw.province) ? raw.province[0] : raw.province)?.trim() ?? '';

  const [provinces, allDirectorates] = await Promise.all([
    listAllPublic('provinces', { sort: 'sort_order' }),
    listAllPublic('directorates', { expand: 'ministry', sort: 'sort_order' }),
  ]);

  const selected = provinces.find((province) => province.code === code) ?? null;

  // Narrow through the branches: a directorate is "in" a province when it has
  // an office there. Done in two reads rather than one filter because the
  // relation runs the other way.
  let directorates = allDirectorates as (DirectoratesRecord & {
    expand?: { ministry?: MinistriesRecord };
  })[];

  if (selected) {
    const branches = await listAllPublic('directorate_branches', {
      filter: `province = ${JSON.stringify(selected.id)}`,
      fields: 'directorate',
    });
    const ids = new Set(branches.map((branch) => branch.directorate));
    directorates = directorates.filter((directorate) => ids.has(directorate.id));
  }

  return (
    <Container className="py-10">
      <h1 className="text-3xl font-semibold text-ink-900">{t('directorates.title')}</h1>
      <p className="mt-2 max-w-[var(--measure-prose)] text-ink-600">{t('directorates.intro')}</p>

      <nav aria-label={t('directorates.filterByProvince')} className="mt-6">
        <ul className="flex flex-wrap gap-2">
          <li>
            <Link
              href="/directorates"
              aria-current={!selected ? 'true' : undefined}
              className={cn(
                'inline-block rounded-full px-3 py-1 text-sm',
                !selected
                  ? 'bg-brand-500 text-white'
                  : 'bg-white text-ink-700 ring-1 ring-ink-200 hover:ring-brand-500',
              )}
            >
              {t('directorates.allProvinces')}
            </Link>
          </li>
          {provinces.map((province) => {
            const active = province.code === code;
            return (
              <li key={province.id}>
                <Link
                  href={`/directorates?province=${encodeURIComponent(province.code)}`}
                  aria-current={active ? 'true' : undefined}
                  className={cn(
                    'inline-block rounded-full px-3 py-1 text-sm',
                    active
                      ? 'bg-brand-500 text-white'
                      : 'bg-white text-ink-700 ring-1 ring-ink-200 hover:ring-brand-500',
                  )}
                >
                  {localized(province, 'name', locale)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {directorates.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title={t('directorates.emptyTitle')}
            description={
              selected
                ? t('directorates.emptyInProvince', {
                    province: localized(selected, 'name', locale),
                  })
                : t('directorates.emptyBody')
            }
            action={
              <Link href="/directorates" className={buttonClass('secondary')}>
                {t('directorates.clearFilter')}
              </Link>
            }
          />
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {directorates.map((directorate) => (
            <li key={directorate.id}>
              <Link
                href={`/directorates/${directorate.slug}`}
                className="block h-full rounded-lg bg-white p-4 ring-1 ring-ink-200/70 hover:ring-brand-500"
              >
                <span className="block font-medium text-ink-900">
                  {localized(directorate, 'title', locale)}
                </span>
                {directorate.expand?.ministry ? (
                  <span className="mt-0.5 block text-sm text-ink-500">
                    {localized(directorate.expand.ministry, 'title', locale)}
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
