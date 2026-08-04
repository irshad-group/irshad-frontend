import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { locales } from '@/i18n/routing';
import { localized } from '@/lib/i18n';
import { formatFee } from '@/lib/public/procedures';
import { findPublicBySlug, listAllPublic, publicSlugs } from '@/lib/pb/queries/public';
import { Container, Prose } from '@/components/ui/primitives';
import FileList from '@/components/public/FileList';
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

  return (
    <Container className="py-10">
      <article>
        <header>
          <h1 className="text-3xl font-semibold text-ink-900">
            {localized(procedure, 'title', locale)}
          </h1>
          <p className="mt-3 max-w-[var(--measure-prose)] text-lg text-ink-600">
            {localized(procedure, 'summary', locale)}
          </p>
        </header>

        {/* The three facts a citizen needs before travelling to an office. */}
        <dl className="mt-6 grid gap-4 rounded-lg bg-white p-5 ring-1 ring-ink-200/70 sm:grid-cols-3">
          <div>
            <dt className="text-sm text-ink-500">{t('procedure.fee')}</dt>
            <dd className="mt-0.5 font-medium text-ink-900">
              {fee ? `${fee} IQD` : t('procedure.free')}
            </dd>
          </div>
          {time ? (
            <div>
              <dt className="text-sm text-ink-500">{t('procedure.processingTime')}</dt>
              <dd className="mt-0.5 font-medium text-ink-900">{time}</dd>
            </div>
          ) : null}
          {directorate ? (
            <div>
              <dt className="text-sm text-ink-500">{t('procedure.responsibleOffice')}</dt>
              <dd className="mt-0.5 font-medium">
                <Link
                  href={`/directorates/${directorate.slug}`}
                  className="text-brand-700 underline"
                >
                  {localized(directorate, 'title', locale)}
                </Link>
              </dd>
            </div>
          ) : null}
        </dl>

        {description ? (
          <section className="mt-10">
            <h2 className="text-xl font-semibold text-ink-900">{t('procedure.about')}</h2>
            <Prose className="mt-3" html={description} />
          </section>
        ) : null}

        {steps.length > 0 ? (
          <section className="mt-10">
            <h2 className="text-xl font-semibold text-ink-900">{t('procedure.steps')}</h2>
            {/* A real <ol>: the numbering is the content, not decoration, and a
                screen reader should announce "3 of 7". */}
            <ol className="mt-4 space-y-4">
              {steps.map((step, index) => (
                <li key={step.id} className="flex gap-4">
                  <span
                    aria-hidden="true"
                    className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700"
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-medium text-ink-900">
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
          <section className="mt-10">
            <h2 className="text-xl font-semibold text-ink-900">{t('procedure.forms')}</h2>
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
          <section className="mt-10">
            <h2 className="sr-only">{t('procedure.tags')}</h2>
            <ul className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <li key={tag.id}>
                  <Link
                    href={`/procedures?tag=${encodeURIComponent(tag.slug)}`}
                    className="inline-block rounded bg-ink-100 px-2 py-1 text-sm text-ink-700 hover:bg-ink-200"
                  >
                    {localized(tag, 'name', locale)}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </article>
    </Container>
  );
}
