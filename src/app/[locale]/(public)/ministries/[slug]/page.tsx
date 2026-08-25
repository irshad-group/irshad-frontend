import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { locales } from '@/i18n/routing';
import { directionOf } from '@/i18n/routing';
import { localized } from '@/lib/i18n';
import { fileUrl, findPublicBySlug, listAllPublic, publicSlugs } from '@/lib/pb/queries/public';
import { Container, EmptyState, Badge } from '@/components/ui/primitives';
import Lightbox from '@/components/public/Lightbox';
import LocationBlock from '@/components/public/LocationBlock';
import WorkingHours from '@/components/public/WorkingHours';

export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await publicSlugs('ministries');
  return locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const ministry = await findPublicBySlug('ministries', slug);
  if (!ministry) return {};
  return {
    title: localized(ministry, 'title', locale),
    alternates: {
      canonical: `/${locale}/ministries/${slug}`,
      languages: Object.fromEntries(locales.map((l) => [l, `/${l}/ministries/${slug}`])),
    },
  };
}

export default async function MinistryPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const ministry = await findPublicBySlug('ministries', slug);
  if (!ministry) notFound();

  const directorates = await listAllPublic('directorates', {
    filter: `ministry = ${JSON.stringify(ministry.id)}`,
    sort: 'sort_order',
  });

  // A citizen arriving at a ministry wants to know whether it has an office near
  // them. Listing directorate names alone answered a question nobody asked: the
  // Ministry of Education runs offices in eighteen governorates and this page showed
  // no sign of one. Count them here so each directorate says how far it reaches.
  const branches = directorates.length
    ? await listAllPublic('directorate_branches', {
      filter: directorates.map((d) => `directorate = ${JSON.stringify(d.id)}`).join(' || '),
      fields: 'id,directorate,province',
    })
    : [];
  const officesByDirectorate = new Map<string, { count: number; governorates: Set<string> }>();
  for (const branch of branches) {
    const entry = officesByDirectorate.get(branch.directorate)
      ?? { count: 0, governorates: new Set<string>() };
    entry.count += 1;
    if (branch.province) entry.governorates.add(branch.province);
    officesByDirectorate.set(branch.directorate, entry);
  }

  const logo = fileUrl(ministry, ministry.logo, { thumb: '240x240' });
  const address = localized(ministry, 'address', locale);
  const name = localized(ministry, 'title', locale);
  // The building, which every ministry has and none of them was showing. A
  // reader who has to go there benefits from recognising it more than from a
  // second look at the crest.
  const buildingThumb = fileUrl(ministry, ministry.photos?.[0], { thumb: '1200x0' });
  const buildingFull = fileUrl(ministry, ministry.photos?.[0]);

  return (
    <Container className="py-10">
      <header className="flex items-start gap-5">
        {logo ? (
          <Image
            src={logo}
            alt=""
            width={96}
            height={96}
            className="size-20 shrink-0 border border-ink-200 bg-white object-contain p-1.5 sm:size-24"
          />
        ) : null}
        <div className="min-w-0 pt-1">
          <h1 className="text-3xl font-semibold text-ink-900 sm:text-4xl">{name}</h1>
          {ministry.krg ? (
            <span className="mt-2 inline-block">
              <Badge tone="neutral">{t('ministries.krgBadge')}</Badge>
            </span>
          ) : null}
        </div>
      </header>

      {buildingThumb && buildingFull ? (
        <Lightbox
          src={buildingThumb}
          full={buildingFull}
          alt={t('place.buildingPhoto', { name })}
          closeLabel={t('place.closePhoto')}
          className="group relative mt-6 block aspect-[16/7] overflow-hidden border border-ink-200 bg-ink-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
        >
          {/* Through the optimiser: PocketBase returns the banner as a 350 kB
              JPEG, which was a third of everything this page fetched. Served as
              WebP at the width actually rendered it is a fraction of that.
              `fill` because a record photo has no dimensions we know here. */}
          <Image
            src={buildingThumb}
            alt={t('place.buildingPhoto', { name })}
            fill
            sizes="(max-width: 1024px) 100vw, 900px"
            priority
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </Lightbox>
      ) : null}

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <h2 className="text-xl font-semibold text-ink-900">{t('ministry.directorates')}</h2>
          {directorates.length === 0 ? (
            <div className="mt-4">
              <EmptyState title={t('ministry.noDirectorates')} />
            </div>
          ) : (
            <ul className="mt-4 space-y-2">
              {directorates.map((directorate) => (
                <li key={directorate.id}>
                  <Link
                    href={`/directorates/${directorate.slug}`}
                    className="block rounded-lg bg-white px-4 py-3 ring-1 ring-ink-200/70 hover:ring-brand-500"
                  >
                    <span className="font-medium text-ink-900">
                      {localized(directorate, 'title', locale)}
                    </span>
                    {(() => {
                      const offices = officesByDirectorate.get(directorate.id);
                      return offices ? (
                        <span className="mt-0.5 block text-sm font-medium text-brand-600">
                          {t('ministry.offices', {
                            count: offices.count,
                            governorates: offices.governorates.size,
                          })}
                        </span>
                      ) : null;
                    })()}
                    <WorkingHours
                      value={directorate.working_hours}
                      variant="inline"
                      className="mt-0.5 block text-sm text-ink-500"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="space-y-6">
          <LocationBlock
            address={address}
            lat={ministry.gps_lat}
            lon={ministry.gps_lon}
            withMap
            dir={directionOf(locale)}
            labels={{ heading: t('place.address'), openInMaps: t('place.openInMaps') }}
          />

          {ministry.phone || ministry.email || ministry.website ? (
            <div>
              <h3 className="text-sm font-semibold text-ink-900">{t('place.contact')}</h3>
              <ul className="mt-1 space-y-1 text-sm text-ink-600">
                {ministry.phone ? (
                  <li>
                    {/* A +964 number must not be reordered by the bidi algorithm. */}
                    <a dir="ltr" className="hover:text-brand-700" href={`tel:${ministry.phone.replace(/\s+/g, '')}`}>
                      {ministry.phone}
                    </a>
                  </li>
                ) : null}
                {ministry.email ? (
                  <li>
                    <a dir="ltr" className="hover:text-brand-700" href={`mailto:${ministry.email}`}>
                      {ministry.email}
                    </a>
                  </li>
                ) : null}
                {ministry.website ? (
                  <li>
                    <a
                      dir="ltr"
                      className="hover:text-brand-700"
                      href={ministry.website}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {ministry.website.replace(/^https?:\/\//, '')}
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
