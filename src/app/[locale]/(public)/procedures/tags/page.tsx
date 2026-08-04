import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { locales } from '@/i18n/routing';
import { localized } from '@/lib/i18n';
import { countByTag } from '@/lib/public/procedures';
import { listAllPublic } from '@/lib/pb/queries/public';
import { Container, EmptyState } from '@/components/ui/primitives';

export const revalidate = 3600;

/**
 * Every tag, as a way in for someone who cannot name the procedure they need.
 *
 * This is the destination of the "Browse by Tag" entry in the seeded
 * `navigation` collection, which pointed at a page that did not exist.
 *
 * A static segment, so it takes precedence over `procedures/[slug]`. That is
 * only safe while no procedure has the slug `tags`; the slug column is unique
 * and staff-editable, so if one ever did, this page would win and that
 * procedure would become unreachable.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return {
    title: t('tags.title'),
    description: t('tags.intro'),
    alternates: {
      canonical: `/${locale}/procedures/tags`,
      languages: Object.fromEntries(locales.map((l) => [l, `/${l}/procedures/tags`])),
    },
  };
}

export default async function TagsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const [tags, procedures] = await Promise.all([
    listAllPublic('tags', { sort: 'name_en' }),
    // Only the tag ids are needed, so ask for nothing else.
    listAllPublic('procedures', { fields: 'tags' }),
  ]);

  const counts = countByTag(procedures);

  // A tag with nothing published behind it is a dead end for a citizen, so it
  // is not offered. Staff still see it in the admin.
  const used = tags.filter((tag) => (counts.get(tag.id) ?? 0) > 0);

  return (
    <Container className="py-10">
      <h1 className="text-3xl font-semibold text-ink-900">{t('tags.title')}</h1>
      <p className="mt-2 max-w-[var(--measure-prose)] text-ink-600">{t('tags.intro')}</p>

      {used.length === 0 ? (
        <div className="mt-6">
          <EmptyState title={t('tags.emptyTitle')} description={t('tags.emptyBody')} />
        </div>
      ) : (
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {used.map((tag) => {
            const count = counts.get(tag.id) ?? 0;
            return (
              <li key={tag.id}>
                <Link
                  href={`/procedures?tag=${encodeURIComponent(tag.slug)}`}
                  className="flex items-center justify-between gap-3 rounded-lg bg-white px-4 py-3 ring-1 ring-ink-200/70 hover:ring-brand-500"
                >
                  <span className="min-w-0 font-medium text-ink-900">
                    {localized(tag, 'name', locale)}
                  </span>
                  {/* The count is meaning, not decoration, so it is spelled out
                      for a screen reader rather than left as a bare number. */}
                  <span className="shrink-0 text-sm text-ink-500">
                    <span aria-hidden="true">{count}</span>
                    <span className="sr-only">{t('procedures.count', { count })}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Container>
  );
}
