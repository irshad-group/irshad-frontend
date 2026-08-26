import Image from 'next/image';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { localized } from '@/lib/i18n';
import { thumbSize } from '@/lib/public/thumbs';
import { fileUrl, listAllPublic } from '@/lib/pb/queries/public';
import { Container, EmptyState } from '@/components/ui/primitives';

export const revalidate = 3600;

export default async function PartnersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const partners = await listAllPublic('partners', { filter: 'enabled = true', sort: 'sort_order' });

  return (
    <Container className="py-10">
      <h1 className="text-3xl font-semibold text-ink-900">{t('partners.title')}</h1>
      <p className="mt-2 max-w-[var(--measure-prose)] text-ink-600">{t('partners.intro')}</p>

      {partners.length === 0 ? (
        <div className="mt-6">
          <EmptyState title={t('partners.emptyTitle')} />
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {partners.map((partner) => {
            const logo = fileUrl(partner, partner.logo, { thumb: thumbSize('partnerLogo') });
            const name = localized(partner, 'name', locale);
            const inner = (
              <>
                {logo ? (
                  <Image
                    src={logo}
                    alt=""
                    width={48}
                    height={48}
                    className="size-12 shrink-0 rounded object-contain"
                  />
                ) : null}
                <span className="min-w-0 font-medium text-ink-900">{name}</span>
              </>
            );
            return (
              <li key={partner.id}>
                {partner.link ? (
                  <a
                    href={partner.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-full items-center gap-3 rounded-lg bg-white p-4 ring-1 ring-ink-200/70 hover:ring-brand-500"
                  >
                    {inner}
                  </a>
                ) : (
                  <div className="flex h-full items-center gap-3 rounded-lg bg-white p-4 ring-1 ring-ink-200/70">
                    {inner}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Container>
  );
}
