import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { locales } from '@/i18n/routing';
import { localized } from '@/lib/i18n';
import { groupBranchesByProvince, type BranchWithProvince } from '@/lib/public/places';
import { findPublicBySlug, listAllPublic, publicSlugs } from '@/lib/pb/queries/public';
import { Container, EmptyState } from '@/components/ui/primitives';
import LocationBlock from '@/components/public/LocationBlock';
import WorkingHours from '@/components/public/WorkingHours';
import type { DirectoratesRecord, MinistriesRecord } from '@/types/pb';

export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await publicSlugs('directorates');
  return locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

async function load(slug: string) {
  const directorate = (await findPublicBySlug('directorates', slug, {
    expand: 'ministry',
  })) as (DirectoratesRecord & { expand?: { ministry?: MinistriesRecord } }) | null;
  if (!directorate) return null;

  const [branches, procedures] = await Promise.all([
    listAllPublic('directorate_branches', {
      filter: `directorate = ${JSON.stringify(directorate.id)}`,
      expand: 'province',
      sort: 'sort_order',
    }),
    listAllPublic('procedures', {
      filter: `directorate = ${JSON.stringify(directorate.id)}`,
      sort: '-featured,sort_order',
    }),
  ]);

  return { directorate, branches: branches as BranchWithProvince[], procedures };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const data = await load(slug);
  if (!data) return {};
  return {
    title: localized(data.directorate, 'title', locale),
    alternates: {
      canonical: `/${locale}/directorates/${slug}`,
      languages: Object.fromEntries(locales.map((l) => [l, `/${l}/directorates/${slug}`])),
    },
  };
}

export default async function DirectoratePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const data = await load(slug);
  if (!data) notFound();

  const { directorate, branches, procedures } = data;
  const ministry = directorate.expand?.ministry;
  const groups = groupBranchesByProvince(branches);

  return (
    <Container className="py-10">
      <header>
        {ministry ? (
          <Link href={`/ministries/${ministry.slug}`} className="inline-flex min-h-6 items-center text-sm text-brand-700 underline">
            {localized(ministry, 'title', locale)}
          </Link>
        ) : null}
        <h1 className="mt-1 text-3xl font-semibold text-ink-900">
          {localized(directorate, 'title', locale)}
        </h1>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-10 lg:col-span-2">
          <section>
            <h2 className="text-xl font-semibold text-ink-900">{t('directorate.procedures')}</h2>
            {procedures.length === 0 ? (
              <div className="mt-4">
                <EmptyState title={t('directorate.noProcedures')} />
              </div>
            ) : (
              <ul className="mt-4 space-y-2">
                {procedures.map((procedure) => (
                  <li key={procedure.id}>
                    <Link
                      href={`/procedures/${procedure.slug}`}
                      className="block rounded-lg bg-white px-4 py-3 ring-1 ring-ink-200/70 hover:ring-brand-500"
                    >
                      <span className="font-medium text-ink-900">
                        {localized(procedure, 'title', locale)}
                      </span>
                      <span className="mt-0.5 line-clamp-2 block text-sm text-ink-500">
                        {localized(procedure, 'summary', locale)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink-900">{t('directorate.branches')}</h2>
            {groups.length === 0 ? (
              <div className="mt-4">
                <EmptyState title={t('directorate.noBranches')} description={t('directorate.noBranchesBody')} />
              </div>
            ) : (
              <div className="mt-4 space-y-6">
                {groups.map((group) => (
                  <div key={group.province?.id ?? 'unassigned'}>
                    <h3 className="text-sm font-semibold tracking-wide text-ink-500 uppercase">
                      {group.province
                        ? localized(group.province, 'name', locale)
                        : t('directorate.otherBranches')}
                    </h3>
                    <ul className="mt-2 space-y-2">
                      {group.branches.map((branch) => (
                        <li
                          key={branch.id}
                          className="rounded-lg bg-white px-4 py-3 ring-1 ring-ink-200/70"
                        >
                          <p className="font-medium text-ink-900">
                            {localized(branch, 'title', locale)}
                          </p>
                          <div className="mt-2 space-y-2">
                            <LocationBlock
                              address={localized(branch, 'address', locale)}
                              lat={branch.gps_lat}
                              lon={branch.gps_lon}
                              labels={{
                                heading: t('place.address'),
                                openInMaps: t('place.openInMaps'),
                              }}
                            />
                            {branch.phone ? (
                              <p className="text-sm">
                                <a
                                  dir="ltr"
                                  className="text-ink-600 hover:text-brand-700"
                                  href={`tel:${branch.phone.replace(/\s+/g, '')}`}
                                >
                                  {branch.phone}
                                </a>
                              </p>
                            ) : null}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <WorkingHours
            value={directorate.working_hours}
            heading={t('directorate.workingHours')}
          />

          <LocationBlock
            address={localized(directorate, 'address', locale)}
            lat={directorate.gps_lat}
            lon={directorate.gps_lon}
            labels={{ heading: t('place.address'), openInMaps: t('place.openInMaps') }}
          />

          {directorate.phone || directorate.email || directorate.website ? (
            <div>
              <h3 className="text-sm font-semibold text-ink-900">{t('place.contact')}</h3>
              <ul className="mt-1 space-y-1 text-sm text-ink-600">
                {directorate.phone ? (
                  <li>
                    <a
                      dir="ltr"
                      className="hover:text-brand-700"
                      href={`tel:${directorate.phone.replace(/\s+/g, '')}`}
                    >
                      {directorate.phone}
                    </a>
                  </li>
                ) : null}
                {directorate.email ? (
                  <li>
                    <a dir="ltr" className="hover:text-brand-700" href={`mailto:${directorate.email}`}>
                      {directorate.email}
                    </a>
                  </li>
                ) : null}
                {directorate.website ? (
                  <li>
                    <a
                      dir="ltr"
                      className="hover:text-brand-700"
                      href={directorate.website}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {directorate.website.replace(/^https?:\/\//, '')}
                    </a>
                  </li>
                ) : null}
              </ul>
            </div>
          ) : null}
        </aside>
      </div>
    </Container>
  );
}
