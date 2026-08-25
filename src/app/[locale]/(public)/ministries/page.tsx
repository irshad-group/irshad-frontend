import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import PrefetchLink from '@/components/public/PrefetchLink';
import { localized } from '@/lib/i18n';
import { fileUrl, listAllPublic } from '@/lib/pb/queries/public';
import { Container, EmptyState, Badge, cn } from '@/components/ui/primitives';

/**
 * Every ministry, optionally narrowed to federal or Kurdistan Regional
 * Government bodies — the two links the seeded header menu points at
 * (`?krg=false` and `?krg=true`).
 */
export default async function MinistriesIndex({
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
  const krgParam = Array.isArray(raw.krg) ? raw.krg[0] : raw.krg;
  // Only the two exact values filter; anything else shows everything, so a
  // mangled URL degrades to the full list rather than to nothing.
  const krg = krgParam === 'true' ? true : krgParam === 'false' ? false : null;

  const ministries = await listAllPublic('ministries', {
    filter: krg === null ? '' : `krg = ${krg}`,
    sort: 'sort_order',
  });

  const filters = [
    { key: 'all', href: '/ministries', label: t('ministries.all'), active: krg === null },
    { key: 'federal', href: '/ministries?krg=false', label: t('ministries.federal'), active: krg === false },
    { key: 'krg', href: '/ministries?krg=true', label: t('ministries.krg'), active: krg === true },
  ];

  return (
    <Container className="py-10">
      <h1 className="text-3xl font-semibold text-ink-900">{t('ministries.title')}</h1>
      <p className="mt-2 max-w-[var(--measure-prose)] text-ink-600">{t('ministries.intro')}</p>

      <nav aria-label={t('ministries.filter')} className="mt-6">
        <ul className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <li key={filter.key}>
              <Link
                href={filter.href}
                aria-current={filter.active ? 'true' : undefined}
                className={cn(
                  'inline-block rounded-full px-3 py-1 text-sm',
                  filter.active
                    ? 'bg-brand-500 text-white'
                    : 'bg-white text-ink-700 ring-1 ring-ink-200 hover:ring-brand-500',
                )}
              >
                {filter.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {ministries.length === 0 ? (
        <div className="mt-6">
          <EmptyState title={t('ministries.emptyTitle')} description={t('ministries.emptyBody')} />
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ministries.map((ministry) => {
            const logo = fileUrl(ministry, ministry.logo, { thumb: '120x120' });
            return (
              <li key={ministry.id}>
                <PrefetchLink
                  href={`/ministries/${ministry.slug}`}
                  className="flex h-full items-start gap-3 rounded-lg bg-white p-4 ring-1 ring-ink-200/70 hover:ring-brand-500"
                >
                  {logo ? (
                    // Sized so the row does not jump when the image lands on a
                    // slow connection.
                    <Image
                      src={logo}
                      alt=""
                      width={40}
                      height={40}
                      className="size-10 shrink-0 rounded object-contain"
                    />
                  ) : (
                    <span aria-hidden="true" className="size-10 shrink-0 rounded bg-ink-100" />
                  )}
                  <span className="min-w-0">
                    <span className="block font-medium text-ink-900">
                      {localized(ministry, 'title', locale)}
                    </span>
                    {/* KRG bodies carry a text badge, not a colour — colour
                        alone would not survive a monochrome screen. */}
                    {ministry.krg ? (
                      <span className="mt-1 inline-block">
                        <Badge tone="neutral">{t('ministries.krgBadge')}</Badge>
                      </span>
                    ) : null}
                  </span>
                </PrefetchLink>
              </li>
            );
          })}
        </ul>
      )}
    </Container>
  );
}
