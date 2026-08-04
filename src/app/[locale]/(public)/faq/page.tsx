import { getTranslations, setRequestLocale } from 'next-intl/server';
import { localized } from '@/lib/i18n';
import { listAllPublic } from '@/lib/pb/queries/public';
import { Container, EmptyState, Prose } from '@/components/ui/primitives';

export const revalidate = 3600;

/**
 * Frequently asked questions.
 *
 * Native `<details>` again: keyboard-operable, announced correctly, and open
 * without JavaScript. The API rule already hides disabled entries.
 */
export default async function FaqPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();

  const entries = await listAllPublic('faq', { sort: 'sort_order' });

  return (
    <Container width="narrow" className="py-10">
      <h1 className="text-3xl font-semibold text-ink-900">{t('faq.title')}</h1>
      <p className="mt-2 text-ink-600">{t('faq.intro')}</p>

      {entries.length === 0 ? (
        <div className="mt-6">
          <EmptyState title={t('faq.emptyTitle')} />
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          {entries.map((entry) => (
            <details key={entry.id} className="rounded-lg bg-white px-4 py-3 ring-1 ring-ink-200/70">
              <summary className="cursor-pointer font-medium text-ink-900">
                {localized(entry, 'question', locale)}
              </summary>
              <Prose className="mt-2" html={localized(entry, 'answer', locale)} />
            </details>
          ))}
        </div>
      )}
    </Container>
  );
}
