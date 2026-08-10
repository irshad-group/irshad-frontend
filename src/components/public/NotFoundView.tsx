import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Container, buttonClass } from '@/components/ui/primitives';

/**
 * The body of a 404, shared by the two boundaries that need it.
 *
 * It is reached both by an unknown URL and by any page calling `notFound()` —
 * which the procedure, ministry and directorate pages do when a record is
 * absent *or* unpublished. Those two cases must read identically, so this says
 * only that the page is not there, never that something exists but is hidden.
 *
 * A dead end is the thing to avoid, so every route out of here is a real one.
 */
export default async function NotFoundView() {
  const t = await getTranslations();

  return (
    <Container width="narrow" className="py-20 text-center">
      <p className="text-sm font-medium tracking-wide text-brand-600 uppercase">404</p>
      <h1 className="mt-3 text-3xl font-semibold text-ink-900">{t('notFound.title')}</h1>
      <p className="mt-4 text-ink-600">{t('notFound.body')}</p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className={buttonClass('primary')}>
          {t('notFound.home')}
        </Link>
        <Link href="/procedures" className={buttonClass('secondary')}>
          {t('notFound.browse')}
        </Link>
        <Link href="/search" className={buttonClass('secondary')}>
          {t('notFound.search')}
        </Link>
      </div>
    </Container>
  );
}
