import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { locales } from '@/i18n/routing';
import { localized } from '@/lib/i18n';
import { formatFee } from '@/lib/public/procedures';
import { mapsLink } from '@/lib/public/places';
import { fileUrl, findPublicBySlug, listAllPublic, publicSlugs } from '@/lib/pb/queries/public';
import { Container, Prose } from '@/components/ui/primitives';
import FileList from '@/components/public/FileList';
import WorkingHours from '@/components/public/WorkingHours';
import { Icon, tagIcon } from '@/components/public/home/icons';
import type { DirectoratesRecord, ProceduresRecord, TagsRecord } from '@/types/pb';

// See PUBLIC_REVALIDATE — segment config must be a literal.
export const revalidate = 3600;

type Expanded = ProceduresRecord & {
  expand?: { directorate?: DirectoratesRecord; tags?: TagsRecord[] };
};

/**
 * Prerender every published procedure.
 *
 * `publicSlugs` reads anonymously, so unpublished and archived procedures are
 * never in this list — they are unreachable rather than merely unlinked.
 */
export async function generateStaticParams() {
  const slugs = await publicSlugs('procedures');
  return locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

async function load(slug: string) {
  const procedure = (await findPublicBySlug('procedures', slug, {
    expand: 'directorate,tags',
  })) as Expanded | null;
  if (!procedure) return null;

  const [steps, files] = await Promise.all([
    listAllPublic('procedure_items', {
      filter: `procedure = ${JSON.stringify(procedure.id)} && enabled = true`,
      sort: 'sort_order',
    }),
    listAllPublic('files', {
      filter: `procedure = ${JSON.stringify(procedure.id)}`,
      sort: 'sort_order',
    }),
  ]);

  return { procedure, steps, files };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const data = await load(slug);
  if (!data) return {};

  const title = localized(data.procedure, 'title', locale);
  const description = localized(data.procedure, 'summary', locale);

  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/procedures/${slug}`,
      // Every language has the same slug, so alternates are a locale swap.
      languages: Object.fromEntries(locales.map((l) => [l, `/${l}/procedures/${slug}`])),
    },
  };
}

/**
 * The procedure page, to the design's "anatomy" layout: the facts a citizen
 * needs before travelling sit in a strip under the title, the steps read as a
 * numbered path, and everything about *where* — office, address, hours,
 * building photos — lives in one card beside the content.
 */
export default async function ProcedurePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const data = await load(slug);
  // An unpublished procedure and a non-existent one are indistinguishable here,
  // which is deliberate: neither can be confirmed by probing a URL.
  if (!data) notFound();

  const { procedure, steps, files } = data;
  const t = await getTranslations();
  const fee = formatFee(procedure.fee_iqd, locale);
  const time = localized(procedure, 'processing_time', locale);
  const directorate = procedure.expand?.directorate;
  const tags = procedure.expand?.tags ?? [];
  const description = localized(procedure, 'description', locale);
  const firstTag = tags[0];
  const maps = directorate ? mapsLink(directorate.gps_lat, directorate.gps_lon) : null;
  const photos = (directorate?.photos ?? []).slice(0, 3);

  const facts: Array<{ icon: 'wallet' | 'clock' | 'doc' | 'photo'; label: string; value: string }> = [
    { icon: 'wallet', label: t('procedure.fee'), value: fee ? `${fee} IQD` : t('procedure.free') },
    ...(time ? [{ icon: 'clock' as const, label: t('procedure.processingTime'), value: time }] : []),
    ...(steps.length > 0
      ? [
          {
            icon: 'doc' as const,
            label: t('procedure.steps'),
            value: String(steps.length),
          },
        ]
      : []),
  ];

  return (
    <Container width="wide" className="py-10">
      <article>
        <header className="max-w-3xl">
          {firstTag ? (
            <p className="mb-2 flex items-center gap-2 text-xs font-extrabold tracking-[0.12em] uppercase text-brand-500">
              <Icon name={tagIcon(firstTag.slug)} className="size-4" />
              {localized(firstTag, 'name', locale)}
            </p>
          ) : null}
          <h1 className="text-3xl font-extrabold tracking-tight text-ink-950 sm:text-4xl">
            {localized(procedure, 'title', locale)}
          </h1>
          <p className="mt-3 max-w-[var(--measure-prose)] text-lg text-ink-600">
            {localized(procedure, 'summary', locale)}
          </p>
        </header>

        {/* The facts a citizen needs before travelling to an office. */}
        <dl className="mt-6 grid max-w-3xl grid-cols-2 gap-px border border-ink-200 bg-ink-200 sm:grid-cols-3">
          {facts.map((fact) => (
            <div key={fact.label} className="bg-white px-4 py-3.5">
              <dt className="flex items-center gap-1.5 text-xs font-bold text-ink-500">
                <Icon name={fact.icon} className="size-3.5" />
                {fact.label}
              </dt>
              <dd className="mt-1 text-[15px] font-extrabold text-ink-950">{fact.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_340px]">
          <div className="min-w-0 space-y-10">
            {description ? (
              <section>
                <h2 className="text-xl font-extrabold text-ink-950">{t('procedure.about')}</h2>
                <Prose className="mt-3" html={description} />
              </section>
            ) : null}

            {steps.length > 0 ? (
              <section>
                <h2 className="text-xl font-extrabold text-ink-950">{t('procedure.steps')}</h2>
                {/* A real <ol>: the numbering is the content, not decoration, and a
                    screen reader should announce "3 of 7". */}
                <ol className="mt-5">
                  {steps.map((step, index) => (
                    <li key={step.id} className="relative flex gap-4 pb-8 last:pb-0">
                      {index < steps.length - 1 ? (
                        <span
                          aria-hidden="true"
                          className="absolute top-9 bottom-0 start-[15px] w-0.5 bg-ink-200"
                        />
                      ) : null}
                      <span
                        aria-hidden="true"
                        className="relative z-1 flex size-8 shrink-0 items-center justify-center border-2 border-brand-500 bg-white text-sm font-extrabold text-brand-500"
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0 pt-1">
                        <h3 className="font-bold text-ink-950">
                          {localized(step, 'title', locale)}
                        </h3>
                        <Prose className="mt-1" html={localized(step, 'description', locale)} />
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}

            {files.length > 0 ? (
              <section>
                <h2 className="flex items-center gap-2 text-xl font-extrabold text-ink-950">
                  <Icon name="doc" className="size-5 text-brand-500" />
                  {t('procedure.forms')}
                </h2>
                <p className="mt-1 text-sm text-ink-500">{t('procedure.formsHint')}</p>
                <div className="mt-4">
                  <FileList
                    files={files}
                    locale={locale}
                    labels={{ download: t('procedure.download'), opens: t('procedure.opensExternal') }}
                  />
                </div>
              </section>
            ) : null}

            {tags.length > 0 ? (
              <section>
                <h2 className="sr-only">{t('procedure.tags')}</h2>
                <ul className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <li key={tag.id}>
                      <Link
                        href={`/procedures?tag=${encodeURIComponent(tag.slug)}`}
                        className="inline-flex items-center gap-1.5 border border-ink-200 bg-white px-2.5 py-1 text-sm font-semibold text-ink-700 transition-colors hover:border-brand-500 hover:text-brand-500"
                      >
                        <Icon name={tagIcon(tag.slug)} className="size-3.5 text-brand-500" />
                        {localized(tag, 'name', locale)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          {/* Everything about WHERE, in one card. */}
          {directorate ? (
            <aside>
              <div className="border border-ink-200 bg-white">
                <div className="border-b border-ink-200 bg-ink-50 px-4 py-2.5 text-xs font-extrabold tracking-[0.1em] uppercase text-ink-500">
                  {t('procedure.responsibleOffice')}
                </div>
                <div className="p-4">
                  <Link
                    href={`/directorates/${directorate.slug}`}
                    className="inline-block min-h-6 py-0.5 text-[15px] font-extrabold text-ink-950 hover:text-brand-500"
                  >
                    {localized(directorate, 'title', locale)}
                  </Link>
                  {localized(directorate, 'address', locale) ? (
                    <p className="mt-1.5 flex items-start gap-1.5 text-sm text-ink-600">
                      <Icon name="pin" className="mt-0.5 size-4 shrink-0 text-ink-400" />
                      {localized(directorate, 'address', locale)}
                    </p>
                  ) : null}

                  <WorkingHours
                    value={directorate.working_hours}
                    heading={t('directorate.workingHours')}
                    className="mt-4"
                  />

                  {photos.length > 0 ? (
                    <div className="mt-4 grid grid-cols-3 gap-1.5">
                      {photos.map((photo) => (
                        // eslint-disable-next-line @next/next/no-img-element -- PocketBase thumbs, fixed small size.
                        <img
                          key={photo}
                          src={fileUrl(directorate, photo, { thumb: '800x0' }) ?? undefined}
                          alt=""
                          loading="lazy"
                          className="aspect-square w-full border border-ink-200 object-cover"
                        />
                      ))}
                    </div>
                  ) : null}

                  {maps ? (
                    <a
                      href={maps}
                      rel="noopener noreferrer"
                      target="_blank"
                      className="mt-4 inline-flex items-center gap-2 border border-ink-300 px-3.5 py-2 text-sm font-bold text-ink-950 transition-colors hover:border-brand-500 hover:text-brand-500"
                    >
                      <Icon name="pin" className="size-4" />
                      {t('place.openInMaps')}
                    </a>
                  ) : null}
                </div>
              </div>
            </aside>
          ) : null}
        </div>
      </article>
    </Container>
  );
}
