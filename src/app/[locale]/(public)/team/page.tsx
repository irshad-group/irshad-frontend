import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { localized } from '@/lib/i18n';
import { fileUrl, listAllPublic } from '@/lib/pb/queries/public';
import { Container, EmptyState } from '@/components/ui/primitives';

export const revalidate = 3600;

export default async function TeamPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const members = await listAllPublic('team', { filter: 'enabled = true', sort: 'sort_order' });

  return (
    <Container className="py-10">
      <h1 className="text-3xl font-semibold text-ink-900">{t('team.title')}</h1>
      <p className="mt-2 max-w-[var(--measure-prose)] text-ink-600">{t('team.intro')}</p>

      {members.length === 0 ? (
        <div className="mt-6">
          <EmptyState title={t('team.emptyTitle')} />
        </div>
      ) : (
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => {
            const photo = fileUrl(member, member.photo, { thumb: '200x200' });
            return (
              <li key={member.id} className="rounded-lg bg-white p-5 ring-1 ring-ink-200/70">
                {photo ? (
                  <Image
                    src={photo}
                    alt=""
                    width={64}
                    height={64}
                    className="size-16 rounded-full object-cover"
                  />
                ) : null}
                <h2 className="mt-3 font-semibold text-ink-900">
                  {localized(member, 'name', locale)}
                </h2>
                <p className="text-sm text-ink-500">{localized(member, 'job_title', locale)}</p>
                {localized(member, 'bio', locale) ? (
                  <p className="mt-2 text-sm text-ink-600">{localized(member, 'bio', locale)}</p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </Container>
  );
}
